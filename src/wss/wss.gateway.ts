import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import config from 'config';
import io from 'socket.io';

import { LoggerService } from '../logger/logger.service';

import mediasoup from 'mediasoup';
import { IConsumer } from 'mediasoup/Consumer';
import { IProducer } from 'mediasoup/Producer';
import { IRouter } from 'mediasoup/Router';
import { ITransport } from 'mediasoup/Transport';
import { IWebRtcTransport } from 'mediasoup/WebRtcTransport';
import { IWorker } from 'mediasoup/Worker';

const appSettings = config.get<IAppSettings>('APP_SETTINGS');
const mediasoupSettings = config.get<IMediasoupSettings>('MEDIASOUP_SETTINGS');

type TWebRtcTransport = IWebRtcTransport & ITransport;

interface IClient {
  producerTransport?: TWebRtcTransport;
  consumerTransport?: TWebRtcTransport;
  producer?: IProducer;
  consumer?: IConsumer;
}

// tslint:disable-next-line: no-unsafe-any
@WebSocketGateway(appSettings.wssPort)
export class WssGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: io.Server;

  private worker: IWorker;
  private router: IRouter;

  private readonly clients: { [key: string]: IClient } = {};

  // producer - current user
  // consumer - other users

  constructor(private readonly logger: LoggerService) {
    mediasoup.createWorker(mediasoupSettings.worker).then(w => {
      this.worker = w;
      this.worker.createRouter({ mediaCodecs: mediasoupSettings.router.mediaCodecs }).then(r => {
        this.router = r;
      });
    });
  }

  public async handleConnection(client: io.Client) {
    this.logger.log('Connected');

    this.clients[client.id] = {};
  }

  public async handleDisconnect(client: io.Client) {
    this.logger.log('Disconnected');

    if (this.clients[client.id]) {
      delete this.clients[client.id];
    }
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  public async getRouterRtpCapabilities(_client: io.Client) {
    this.logger.log('getRouterRtpCapabilities');

    return this.router.rtpCapabilities;
  }

  @SubscribeMessage('createProducerTransport')
  public async createProducerTransport(client: io.Client) {
    this.logger.log('createProducerTransport');

    const { transport, params } = await this.createWebRtcTransport();

    if (this.clients[client.id]) {
      this.clients[client.id].producerTransport = transport;
    }

    return params;
  }

  @SubscribeMessage('createConsumerTransport')
  public async createConsumerTransport(client: io.Client) {
    this.logger.log('createConsumerTransport');

    const { transport, params } = await this.createWebRtcTransport();

    if (this.clients[client.id]) {
      this.clients[client.id].consumerTransport = transport;
    }

    return params;
  }

  @SubscribeMessage('connectProducerTransport')
  public async connectProducerTransport(client: io.Client, data: { dtlsParameters: RTCDtlsParameters }) {
    this.logger.log('connectProducerTransport');

    if (this.clients[client.id]) {
      if (this.clients[client.id].producerTransport) {
        await this.clients[client.id].producerTransport.connect({ dtlsParameters: data.dtlsParameters });
      }
    }

    return {}; // !!!
  }

  @SubscribeMessage('connectConsumerTransport')
  public async connectConsumerTransport(client: io.Client, data: { dtlsParameters: RTCDtlsParameters }) {
    this.logger.log('connectConsumerTransport');

    if (this.clients[client.id]) {
      if (this.clients[client.id].consumerTransport) {
        await this.clients[client.id].consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
      }
    }

    return {}; // !!!
  }

  @SubscribeMessage('produce')
  public async produce(client: io.Client, data: { kind: string; rtpParameters: RTCRtpParameters }) {
    this.logger.log('produce');

    const { kind, rtpParameters } = data;

    if (this.clients[client.id]) {
      const transport = this.clients[client.id].producerTransport;

      if (transport) {
        const producer = await transport.produce({ kind, rtpParameters });

        this.clients[client.id].producer = producer;

        return {
          id: producer.id,
        };
      }
    }

    return {};
  }

  @SubscribeMessage('consume')
  public async consume(client: io.Client, data: { rtpCapabilities: RTCRtpCapabilities }) {
    this.logger.log('consume');

    if (this.clients[client.id]) {
      const { consumer, params } = await this.createConsumer(
        this.clients[client.id].producer,
        data.rtpCapabilities,
        this.clients[client.id].consumerTransport
      );

      this.clients[client.id].consumer = consumer;

      return params;
    }

    return {};
  }

  @SubscribeMessage('resume')
  public async resume(client: io.Client) {
    this.logger.log('resume');

    if (this.clients[client.id]) {
      const consumer = this.clients[client.id].consumer;

      if (consumer) {
        await consumer.resume();
      }
    }

    return {}; // !!!
  }

  // tslint:disable: no-feature-envy
  private async createWebRtcTransport() {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = mediasoupSettings.webRtcTransport;

    const transport = await this.router.createWebRtcTransport({
      listenIps: mediasoupSettings.webRtcTransport.listenIps,
      enableUdp: true,
      enableSctp: true,
      enableTcp: true,
      initialAvailableOutgoingBitrate,
    });

    if (maxIncomingBitrate) {
      await transport.setMaxIncomingBitrate(maxIncomingBitrate);
    }

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }
  // tslint:enable: no-feature-envy

  // tslint:disable: no-feature-envy
  private async createConsumer(
    producer: IProducer,
    rtpCapabilities: RTCRtpCapabilities,
    consumerTransport: TWebRtcTransport
  ) {
    if (
      !this.router.canConsume({
        producerId: producer.id,
        rtpCapabilities,
      })
    ) {
      return;
    }

    const consumer = await consumerTransport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: producer.kind === 'video',
    });

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
    }

    return {
      consumer,
      params: {
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }
  // tslint:enable: no-feature-envy
}
