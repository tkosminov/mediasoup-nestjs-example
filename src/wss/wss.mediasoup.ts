import { SubscribeMessage } from '@nestjs/websockets';
import io from 'socket.io';

import config from 'config';

import mediasoup from 'mediasoup';
import { IAudioLevelObserver } from 'mediasoup/AudioLevelObserver';
import { IProducer } from 'mediasoup/Producer';
import { IRouter } from 'mediasoup/Router';
import { IRtpObserver } from 'mediasoup/RtpObserver';
import { IWorker } from 'mediasoup/Worker';

import { IHandshakeQuery, IRoomClient, TWebRtcTransport } from './wss.interface';

import { LoggerService } from '../logger/logger.service';

const mediasoupSettings = config.get<IMediasoupSettings>('MEDIASOUP_SETTINGS');

// tslint:disable: no-feature-envy
export class MediasoupService {
  private worker: IWorker;
  private router: IRouter;
  private audioLevelObserver: IAudioLevelObserver & IRtpObserver;

  public readonly channels: Map<string, Map<string, IRoomClient>> = new Map();

  constructor(public readonly logger: LoggerService) {
    mediasoup.createWorker(mediasoupSettings.worker).then(w => {
      this.worker = w;
      this.worker.createRouter({ mediaCodecs: mediasoupSettings.router.mediaCodecs }).then(r => {
        this.router = r;

        this.router
          .createAudioLevelObserver({
            maxEntries: 1,
            threshold: -80,
            interval: 800,
          })
          .then(a => {
            this.audioLevelObserver = a;
          });
      });
    });
  }

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

  public getClientQuery(client: io.Socket) {
    return client.handshake.query as IHandshakeQuery;
  }

  public addToMediasoup(query: { session_id: string; user_id: string }) {
    this.logger.warn('addToMediasoup');

    try {
      let channel = this.channels.get(query.session_id);

      if (!channel) {
        this.channels.set(query.session_id, new Map());
      }

      channel = this.channels.get(query.session_id);

      channel.set(query.user_id, { consumersVideo: new Map(), consumersAudio: new Map() });
    } catch (error) {
      this.logger.error('addToMediasoup');
      this.logger.error(error);
    }

    return;
  }

  public removeFromMediasoup(query: { session_id: string; user_id: string }) {
    this.logger.warn('removeFromMediasoup');
    try {
      const channel = this.channels.get(query.session_id);

      if (channel) {
        const user = channel.get(query.user_id);

        if (user) {
          if (user.producerVideo && !user.producerVideo.closed) {
            user.producerVideo.close();
          }

          if (user.producerAudio && !user.producerAudio.closed) {
            user.producerAudio.close();
          }

          if (user.consumerTransport && !user.consumerTransport.closed) {
            user.consumerTransport.close();
          }

          if (user.producerTransport && !user.producerTransport.closed) {
            user.producerTransport.close();
          }

          channel.delete(query.user_id);
        }
      }
    } catch (error) {
      this.logger.error('removeFromMediasoup');
      this.logger.error(error);
    }

    return;
  }

  private gerUserFromChannel(query: { session_id: string; user_id: string }) {
    const channel = this.channels.get(query.session_id);

    if (channel) {
      const user = channel.get(query.user_id);

      if (user) {
        return user;
      }
    }

    return null;
    // throw new Error(`User (${query.user_id}) not found in channel (${query.session_id})`);
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  public async getRouterRtpCapabilities(_client: io.Socket) {
    this.logger.info('getRouterRtpCapabilities');

    try {
      return this.router.rtpCapabilities;
    } catch (error) {
      this.logger.error('getRouterRtpCapabilities');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('getRoomInfo')
  public async getRoomInfo(client: io.Socket) {
    this.logger.info('getRoomInfo');

    try {
      const query = this.getClientQuery(client);
      const channel = this.channels.get(query.session_id);

      let user_ids = [];

      if (channel) {
        user_ids = Array.from(channel.keys()).filter(id => id !== query.user_id);
      }

      return {
        user_ids,
      };
    } catch (error) {
      this.logger.error('getRoomInfo');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('createProducerTransport')
  public async createProducerTransport(client: io.Socket) {
    this.logger.info('createProducerTransport');

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);

      const { transport, params } = await this.createWebRtcTransport();
      current_user.producerTransport = transport;

      return params;
    } catch (error) {
      this.logger.error('createProducerTransport');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('connectProducerTransport')
  public async connectProducerTransport(client: io.Socket, data: { dtlsParameters: RTCDtlsParameters }) {
    this.logger.info('connectProducerTransport');

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);

      if (current_user && current_user.producerTransport) {
        await current_user.producerTransport.connect({ dtlsParameters: data.dtlsParameters });
      }
    } catch (error) {
      this.logger.error('connectProducerTransport');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('produce')
  public async produce(client: io.Socket, data: { kind: string; rtpParameters: RTCRtpParameters }) {
    this.logger.info(`produce ${data.kind}`);

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);

      if (current_user && current_user.producerTransport) {
        const { kind, rtpParameters } = data;
        const producer = await current_user.producerTransport.produce({ kind, rtpParameters });

        // producer.on('videoorientationchange', async (videoOrientation) => {
        //   console.log(videoOrientation)
        // });

        if (kind === 'video') {
          current_user.producerVideo = producer;
        } else if (kind === 'audio') {
          current_user.producerAudio = producer;
          this.audioLevelObserver.addProducer({ producerId: producer.id });
        }

        client.broadcast.to(query.session_id).emit('newProducer', { ...query, ...{ producer_id: producer.id, kind } });

        return {
          id: producer.id,
        };
      }
    } catch (error) {
      this.logger.error('produce');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('createConsumerTransport')
  public async createConsumerTransport(client: io.Socket) {
    this.logger.info('createConsumerTransport');

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);

      if (current_user) {
        const { transport, params } = await this.createWebRtcTransport();
        current_user.consumerTransport = transport;

        return params;
      }
    } catch (error) {
      this.logger.error('createConsumerTransport');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('connectConsumerTransport')
  public async connectConsumerTransport(client: io.Socket, data: { dtlsParameters: RTCDtlsParameters }) {
    this.logger.info('connectConsumerTransport');

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);

      if (current_user && current_user.consumerTransport) {
        await current_user.consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
      }
    } catch (error) {
      this.logger.error('connectConsumerTransport');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('consume')
  public async consume(
    client: io.Socket,
    data: { rtpCapabilities: RTCRtpCapabilities; user_id: string; kind: string }
  ) {
    this.logger.info(`consume ${data.kind}`);

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);
      const target_user = this.gerUserFromChannel({ session_id: query.session_id, user_id: data.user_id });

      if (current_user && target_user) {
        if (data.kind === 'video' && target_user.producerVideo && !target_user.producerVideo.closed) {
          const { consumer, params } = await this.createConsumer(
            target_user.producerVideo,
            data.rtpCapabilities,
            current_user.consumerTransport
          );

          current_user.consumersVideo.set(data.user_id, consumer);

          consumer.on('transportclose', () => {
            current_user.consumersVideo.delete(data.user_id);
          });

          consumer.on('producerclose', () => {
            current_user.consumersVideo.delete(data.user_id);
          });

          return params;
        } else if (data.kind === 'audio' && target_user.producerAudio && !target_user.producerAudio.closed) {
          const { consumer, params } = await this.createConsumer(
            target_user.producerAudio,
            data.rtpCapabilities,
            current_user.consumerTransport
          );

          current_user.consumersAudio.set(data.user_id, consumer);

          consumer.on('transportclose', () => {
            current_user.consumersAudio.delete(data.user_id);
          });

          consumer.on('producerclose', () => {
            current_user.consumersAudio.delete(data.user_id);
          });

          return params;
        }
      }
    } catch (error) {
      this.logger.error('consume');
      this.logger.error(error);
    }

    return {};
  }

  @SubscribeMessage('resume')
  public async resume(client: io.Socket, data: { user_id: string }) {
    this.logger.info('resume');

    try {
      const query = this.getClientQuery(client);
      const current_user = this.gerUserFromChannel(query);
      const target_user = this.gerUserFromChannel({ session_id: query.session_id, user_id: data.user_id });

      if (current_user && target_user && target_user.producerVideo && !target_user.producerVideo.closed) {
        const consumer = current_user.consumersVideo.get(data.user_id);

        if (consumer && !consumer.closed) {
          await consumer.resume();
        }
      }
    } catch (error) {
      this.logger.error('resume');
      this.logger.error(error);
    }

    return {};
  }
}
// tslint:enable: no-feature-envy
