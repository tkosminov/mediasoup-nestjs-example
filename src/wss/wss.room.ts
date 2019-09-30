import config from 'config';
import io from 'socket.io';

import { IConsumer } from 'mediasoup/Consumer';
import { TAudioLevelObserver, TKind, TPeer, TWebRtcTransport } from 'mediasoup/interfaces';
import { IProducer } from 'mediasoup/Producer';
import { IRouter } from 'mediasoup/Router';
import { IWorker } from 'mediasoup/Worker';

import { IClient, IClientQuery, IMediasoupClient, IMsMessage } from './wss.interfaces';

import { LoggerService } from '../logger/logger.service';

const mediasoupSettings = config.get<IMediasoupSettings>('MEDIASOUP_SETTINGS');

export class WssRoom {
  public readonly clients: Map<string, IClient> = new Map();

  public router: IRouter;
  public audioLevelObserver: TAudioLevelObserver;

  constructor(
    private worker: IWorker,
    public workerIndex: number,
    public readonly session_id: string,
    private readonly logger: LoggerService,
    private readonly wssServer: io.Server
  ) {}

  private async configureWorker() {
    try {
      await this.worker
        .createRouter({ mediaCodecs: mediasoupSettings.router.mediaCodecs })
        .then(router => {
          this.router = router;
          return this.router.createAudioLevelObserver({ maxEntries: 1, threshold: -80, interval: 800 });
        })
        .then(observer => (this.audioLevelObserver = observer))
        .then(() => {
          // tslint:disable-next-line: no-any
          this.audioLevelObserver.on('volumes', (volumes: Array<{ producer: IProducer; volume: number }>) => {
            this.wssServer.to(this.session_id).emit('mediaActiveSpeaker', {
              user_id: (volumes[0].producer.appData as { user_id: string }).user_id,
              volume: volumes[0].volume,
            });
          });

          this.audioLevelObserver.on('silence', () => {
            this.wssServer.to(this.session_id).emit('mediaActiveSpeaker', {
              user_id: null,
            });
          });
        });
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - configureWorker');
    }
  }

  get clientsCount(): number {
    return this.clients.size;
  }

  get clientsIds(): string[] {
    return Array.from(this.clients.keys());
  }

  get audioProducerIds(): string[] {
    return Array.from(this.clients.values())
      .filter(c => {
        if (c.media && c.media.producerAudio && !c.media.producerAudio.closed) {
          return true;
        }

        return false;
      })
      .map(c => c.id);
  }

  get videoProducerIds(): string[] {
    return Array.from(this.clients.values())
      .filter(c => {
        if (c.media && c.media.producerVideo && !c.media.producerVideo.closed) {
          return true;
        }

        return false;
      })
      .map(c => c.id);
  }

  get producerIds(): string[] {
    return Array.from(this.clients.values())
      .filter(c => {
        if (c.media) {
          if (c.media.producerVideo || c.media.producerAudio) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
      .map(c => c.id);
  }

  get getRouterRtpCapabilities(): RTCRtpCapabilities {
    return this.router.rtpCapabilities;
  }

  get stats() {
    const clientsArray = Array.from(this.clients.values());

    return {
      id: this.session_id,
      worker: this.workerIndex,
      clients: clientsArray.map(c => ({
        id: c.id,
        device: c.device,
        produceAudio: c.media.producerAudio ? true : false,
        produceVideo: c.media.producerVideo ? true : false,
      })),
      groupByDevice: clientsArray.reduce((acc, curr) => {
        if (!acc[curr.device]) {
          acc[curr.device] = 1;
        }

        acc[curr.device] += 1;

        return acc;
      }, {}) as { [device: string]: number },
    };
  }

  /**
   * Конфигурируем воркер.
   * @returns {Promise<void>} Promise<void>
   */
  public async load(): Promise<void> {
    try {
      await this.configureWorker();
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - load');
    }
  }

  /**
   * Закрывает комнату убивая все соединения с ней.
   * @returns {void} void
   */
  public close(): void {
    try {
      this.clients.forEach(user => {
        const { io: client, media, id } = user;

        if (client) {
          client.broadcast.to(this.session_id).emit('mediaDisconnectMember', { id });
          client.leave(this.session_id);
        }

        if (media) {
          this.closeMediaClient(media);
        }
      });
      this.clients.clear();
      this.audioLevelObserver.close();
      this.router.close();

      this.logger.info(`room ${this.session_id} closed`);
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - close');
    }
  }

  /**
   * Меняет воркер в комнате.
   * @param {IWorker} worker воркер
   * @param {number} index индекс воркера
   * @returns {Promise<void>} Promise<void>
   */
  public async reConfigureMedia(worker: IWorker, index: number): Promise<void> {
    try {
      this.clients.forEach(user => {
        const { media } = user;

        if (media) {
          this.closeMediaClient(media);
          user.media = {};
        }
      });

      this.audioLevelObserver.close();
      this.router.close();

      this.worker = worker;
      this.workerIndex = index;

      await this.configureWorker();

      this.broadcastAll('mediaReconfigure', {});
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - reConfigureMedia');
    }
  }

  /**
   * Отправляет сообщения от клиента всем в комнату.
   * @param {io.Socket} client клиент
   * @param {string} event ивент из сообщения
   * @param {msg} msg сообщение клиента
   * @returns {boolean} boolean
   */
  public broadcast(client: io.Socket, event: string, msg: object): boolean {
    try {
      return client.broadcast.to(this.session_id).emit(event, msg);
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - broadcast');
    }
  }

  /**
   * Отправляет сообщения от клиента всем в комнату включая его.
   * @param {string} event ивент из сообщения
   * @param {msg} msg сообщение клиента
   * @returns {boolean} boolean
   */
  public broadcastAll(event: string, msg: object): boolean {
    try {
      return this.wssServer.to(this.session_id).emit(event, msg);
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - broadcastAll');
    }
  }

  /**
   *  Убивает все соединения с медиасупом для клиента.
   * @param {IMediasoupClient} mediaClient данные из комнату по медиасупу клиенту
   * @returns {boolean} boolean
   */
  private closeMediaClient(mediaClient: IMediasoupClient): boolean {
    try {
      if (mediaClient.producerVideo && !mediaClient.producerVideo.closed) {
        mediaClient.producerVideo.close();
      }
      if (mediaClient.producerAudio && !mediaClient.producerAudio.closed) {
        mediaClient.producerAudio.close();
      }
      if (mediaClient.producerTransport && !mediaClient.producerTransport.closed) {
        mediaClient.producerTransport.close();
      }
      if (mediaClient.consumerTransport && !mediaClient.consumerTransport.closed) {
        mediaClient.consumerTransport.close();
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - closeMediaClient');
    }
  }

  /**
   * Добавляет юзера в комнату.
   * @param {IClientQuery} query query клиента
   * @param {io.Socket} client клиент
   * @returns {Promise<boolean>} Promise<boolean>
   */
  public async addClient(query: IClientQuery, client: io.Socket): Promise<boolean> {
    try {
      this.logger.info(`${query.user_id} connected to room ${this.session_id}`);

      this.clients.set(query.user_id, { io: client, id: query.user_id, device: query.device, media: {} });

      client.join(this.session_id);

      this.broadcastAll('mediaClientConnected', {
        id: query.user_id,
      });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - addClient');
    }
  }

  /**
   * Удаляет юзера из комнаты.
   * @param {string} user_id юзера
   * @returns {Promise<boolean>} Promise<boolean>
   */
  public async removeClient(user_id: string): Promise<boolean> {
    try {
      this.logger.info(`${user_id} disconnected from room ${this.session_id}`);

      const user = this.clients.get(user_id);

      if (user) {
        const { io: client, media, id } = user;

        if (client) {
          this.broadcast(client, 'mediaClientDisconnect', { id });

          client.leave(this.session_id);
        }

        if (media) {
          this.closeMediaClient(media);
        }

        this.clients.delete(user_id);
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssRoom - removeClient');
    }
  }

  /**
   * Обрабатывает сообщение.
   * @param {string} user_id автор сообщения
   * @param {IMsMessage} msg сообщение
   * @returns {Promise<object | boolean>} Promise<object | boolean>
   */
  public async speakMsClient(user_id: string, msg: IMsMessage): Promise<object | boolean> {
    try {
      switch (msg.action) {
        case 'getRouterRtpCapabilities':
          return {
            routerRtpCapabilities: this.getRouterRtpCapabilities,
          };
        case 'createWebRtcTransport':
          return await this.createWebRtcTransport(msg.data as { type: TPeer }, user_id);
        case 'connectWebRtcTransport':
          return await this.connectWebRtcTransport(
            msg.data as { dtlsParameters: RTCDtlsParameters; type: TPeer },
            user_id
          );
        case 'produce':
          return await this.produce(msg.data as { rtpParameters: RTCRtpParameters; kind: TKind }, user_id);
        case 'consume':
          return await this.consume(
            msg.data as { rtpCapabilities: RTCRtpCapabilities; user_id: string; kind: TKind },
            user_id
          );
        case 'restartIce':
          return await this.restartIce(msg.data as { type: TPeer }, user_id);
        case 'requestConsumerKeyFrame':
          return await this.requestConsumerKeyFrame(msg.data as { user_id: string }, user_id);
        case 'getTransportStats':
          return await this.getTransportStats(msg.data as { type: TPeer }, user_id);
        case 'getProducerStats':
          return await this.getProducerStats(msg.data as { user_id: string; kind: TKind }, user_id);
        case 'getConsumerStats':
          return await this.getConsumerStats(msg.data as { user_id: string; kind: TKind }, user_id);
        case 'getAudioProducerIds':
          return await this.getAudioProducerIds(user_id);
        case 'getVideoProducerIds':
          return await this.getVideoProducerIds(user_id);
        case 'producerClose':
          return await this.producerClose(msg.data as { user_id: string; kind: TKind }, user_id);
        case 'producerPause':
          return await this.producerPause(msg.data as { user_id: string; kind: TKind }, user_id);
        case 'producerResume':
          return await this.producerResume(msg.data as { user_id: string; kind: TKind }, user_id);
        case 'allProducerClose':
          return await this.allProducerClose(msg.data as { kind: TKind }, user_id);
        case 'allProducerPause':
          return await this.allProducerPause(msg.data as { kind: TKind }, user_id);
        case 'allProducerResume':
          return await this.allProducerResume(msg.data as { kind: TKind }, user_id);
      }

      throw new Error(`Couldn't find Mediasoup Event with 'name'=${msg.action}`);
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - commit');
      return false;
    }
  }

  /**
   * Создает WebRTC транспорт для приема или передачи стрима.
   * @param {object} data { type: TPeer }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async createWebRtcTransport(data: { type: TPeer }, user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} createWebRtcTransport - ${data.type}`);

      const user = this.clients.get(user_id);

      const { initialAvailableOutgoingBitrate, minimumAvailableOutgoingBitrate } = mediasoupSettings.webRtcTransport;

      const transport = await this.router.createWebRtcTransport({
        listenIps: mediasoupSettings.webRtcTransport.listenIps,
        enableUdp: true,
        enableSctp: true,
        enableTcp: true,
        initialAvailableOutgoingBitrate,
        minimumAvailableOutgoingBitrate,
        appData: { user_id, type: data.type },
      });

      switch (data.type) {
        case 'producer':
          user.media.producerTransport = transport;
          break;
        case 'consumer':
          user.media.consumerTransport = transport;
          break;
      }

      await this.updateMaxIncomingBitrate();

      return {
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
        type: data.type,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - createWebRtcTransport');
    }
  }

  /**
   * Подключает WebRTC транспорт.
   * @param {object} data { dtlsParameters: RTCDtlsParameters; type: TPeer }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async connectWebRtcTransport(
    data: { dtlsParameters: RTCDtlsParameters; type: TPeer },
    user_id: string
  ): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} connectWebRtcTransport - ${data.type}`);

      const user = this.clients.get(user_id);

      let transport: TWebRtcTransport;

      switch (data.type) {
        case 'producer':
          transport = user.media.producerTransport;
          break;
        case 'consumer':
          transport = user.media.consumerTransport;
          break;
      }

      if (!transport) {
        throw new Error(
          `Couldn't find ${data.type} transport with 'user_id'=${user_id} and 'room_id'=${this.session_id}`
        );
      }

      await transport.connect({ dtlsParameters: data.dtlsParameters });

      return {};
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - connectWebRtcTransport');
    }
  }

  /**
   * Принимает стрим видео или аудио от пользователя.
   * @param {object} data { rtpParameters: RTCRtpParameters; kind: TKind }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async produce(data: { rtpParameters: RTCRtpParameters; kind: TKind }, user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} produce - ${data.kind}`);

      const user = this.clients.get(user_id);

      const transport = user.media.producerTransport;

      if (!transport) {
        throw new Error(`Couldn't find producer transport with 'user_id'=${user_id} and 'room_id'=${this.session_id}`);
      }

      const producer = await transport.produce({ ...data, appData: { user_id, kind: data.kind } });

      switch (data.kind) {
        case 'video':
          user.media.producerVideo = producer;
          break;
        case 'audio':
          user.media.producerAudio = producer;
          await this.audioLevelObserver.addProducer({ producerId: producer.id });
          break;
      }

      this.broadcast(user.io, 'mediaProduce', { user_id, kind: data.kind });

      if (data.kind === 'video') {
        producer.on('videoorientationchange', (videoOrientation: object) => {
          this.broadcastAll('mediaVideoOrientationChange', { user_id, videoOrientation });
        });
      }

      producer.on('score', (info: { score: number; ssrc: number; rid?: string }) => {
        this.logger.info(`room ${this.session_id} user ${user_id} producer ${data.kind} score ${JSON.stringify(info)}`);
      });

      return {};
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - produce');
    }
  }

  /**
   * Передает стрим видео или аудио от одного пользователя другому.
   * @param {object} data { rtpCapabilities: RTCRtpCapabilities; user_id: string; kind: TKind }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async consume(
    data: { rtpCapabilities: RTCRtpCapabilities; user_id: string; kind: TKind },
    user_id: string
  ): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} produce - ${data.kind}`);

      const user = this.clients.get(user_id);
      const target = this.clients.get(data.user_id);

      let target_producer: IProducer;

      switch (data.kind) {
        case 'video':
          target_producer = target.media.producerVideo;
          break;
        case 'audio':
          target_producer = target.media.producerAudio;
          break;
      }

      if (
        !target_producer ||
        !data.rtpCapabilities ||
        !this.router.canConsume({
          producerId: target_producer.id,
          rtpCapabilities: data.rtpCapabilities,
        })
      ) {
        throw new Error(
          `Couldn't consume ${data.kind} with 'user_id'=${data.user_id} and 'room_id'=${this.session_id}`
        );
      }

      const transport = user.media.consumerTransport;

      if (!transport) {
        throw new Error(`Couldn't find consumer transport with 'user_id'=${user_id} and 'room_id'=${this.session_id}`);
      }

      const consumer = await transport.consume({
        producerId: target_producer.id,
        rtpCapabilities: data.rtpCapabilities,
        paused: data.kind === 'video',
        appData: { user_id, kind: data.kind, producer_user_id: data.user_id },
      });

      switch (data.kind) {
        case 'video':
          if (!user.media.consumersVideo) {
            user.media.consumersVideo = new Map();
          }

          user.media.consumersVideo.set(data.user_id, consumer);

          consumer.on('transportclose', async () => {
            consumer.close();
            user.media.consumersVideo.delete(data.user_id);
          });

          consumer.on('producerclose', async () => {
            consumer.close();
            user.media.consumersVideo.delete(data.user_id);
          });
          break;
        case 'audio':
          if (!user.media.consumersAudio) {
            user.media.consumersAudio = new Map();
          }

          user.media.consumersAudio.set(data.user_id, consumer);

          consumer.on('transportclose', async () => {
            consumer.close();
            user.media.consumersAudio.delete(data.user_id);
          });

          consumer.on('producerclose', async () => {
            consumer.close();
            user.media.consumersAudio.delete(data.user_id);
          });
          break;
      }

      consumer.on('producerpause', async () => {
        await consumer.pause();
        user.io.emit('mediaProducerPause', { user_id: data.user_id, kind: data.kind });
      });

      consumer.on('producerresume', async () => {
        await consumer.resume();
        user.io.emit('mediaProducerResume', { user_id: data.user_id, kind: data.kind });
      });

      consumer.on('score', (info: { score: number; producerScore: number }) => {
        this.logger.info(`room ${this.session_id} user ${user_id} consumer ${data.kind} score ${JSON.stringify(info)}`);
      });

      if (consumer.kind === 'video') {
        await consumer.resume();
      }

      return {
        producerId: target_producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - consume');
    }
  }

  /**
   * Перезапустить соединительные узлы.
   * @param {object} data { type: TPeer }
   * https://developer.mozilla.org/ru/docs/Web/API/WebRTC_API/%D0%BF%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB%D1%8B
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async restartIce(data: { type: TPeer }, user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} restartIce - ${data.type}`);

      const user = this.clients.get(user_id);

      let transport: TWebRtcTransport;

      switch (data.type) {
        case 'producer':
          transport = user.media.producerTransport;
          break;
        case 'consumer':
          transport = user.media.consumerTransport;
          break;
      }

      if (!transport) {
        throw new Error(
          `Couldn't find ${data.type} transport with 'user_id'=${user_id} and 'room_id'=${this.session_id}`
        );
      }

      const iceParameters = await transport.restartIce();

      return { ...iceParameters };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - restartIce');
    }
  }

  /**
   * Запросить опорный кадр.
   * @param {object} data { user_id: string }
   * @param {string} user_id автор сообщения
   * @returns {Promise<boolean>} Promise<boolean>
   */
  private async requestConsumerKeyFrame(data: { user_id: string }, user_id: string): Promise<boolean> {
    try {
      const user = this.clients.get(user_id);

      const consumer: IConsumer = user.media.consumersVideo.get(data.user_id);

      if (!consumer) {
        throw new Error(`Couldn't find video consumer with 'user_id'=${data.user_id} and 'room_id'=${this.session_id}`);
      }

      await consumer.requestKeyFrame();

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - requestConsumerKeyFrame');
    }
  }

  /**
   * Отдает стату транспорта.
   * @param {object} data { type: TPeer }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async getTransportStats(data: { type: TPeer }, user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} getTransportStats - ${data.type}`);

      const user = this.clients.get(user_id);

      let transport: TWebRtcTransport;

      switch (data.type) {
        case 'producer':
          transport = user.media.producerTransport;
          break;
        case 'consumer':
          transport = user.media.consumerTransport;
          break;
      }

      if (!transport) {
        throw new Error(
          `Couldn't find ${data.type} transport with 'user_id'=${user_id} and 'room_id'=${this.session_id}`
        );
      }

      const stats = await transport.getStats();

      return { ...data, stats };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - getTransportStats');
    }
  }

  /**
   * Отдает инфу о стриме юзера
   * Замер происходит когда от юзера приходит стрим на сервер.
   * @param {object} data { user_id: string; kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async getProducerStats(data: { user_id: string; kind: TKind }, _user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} getProducerStats - ${data.kind}`);

      const target_user = this.clients.get(data.user_id);

      let producer: IProducer;

      switch (data.kind) {
        case 'video':
          producer = target_user.media.producerVideo;
          break;
        case 'audio':
          producer = target_user.media.producerAudio;
          break;
      }

      if (!producer) {
        throw new Error(
          `Couldn't find ${data.kind} producer with 'user_id'=${data.user_id} and 'room_id'=${this.session_id}`
        );
      }

      const stats = await producer.getStats();

      return { ...data, stats };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - getProducerStats');
    }
  }

  /**
   * Отдает инфу о стриме юзера на которого подписан текущий юзер
   * Замер происходит когда от того юзера передается стрим текущему юзеру.
   * @param {object} data { user_id: string; kind: TKind }
   * @param {string} user_id автор сообщения
   * @returns {Promise<object>} Promise<object>
   */
  private async getConsumerStats(data: { user_id: string; kind: TKind }, user_id: string): Promise<object> {
    try {
      this.logger.info(`room ${this.session_id} getProducerStats - ${data.kind}`);

      const user = this.clients.get(user_id);

      let consumer: IConsumer;

      switch (data.kind) {
        case 'video':
          consumer = user.media.consumersVideo.get(data.user_id);
          break;
        case 'audio':
          consumer = user.media.consumersAudio.get(data.user_id);
          break;
      }

      if (!consumer) {
        throw new Error(
          `Couldn't find ${data.kind} consumer with 'user_id'=${data.user_id} and 'room_id'=${this.session_id}`
        );
      }

      const stats = await consumer.getStats();

      return { ...data, stats };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - getConsumerStats');
    }
  }

  /**
   * Id юзеров которые передаеют стримы на сервер.
   * @param {string} _user_id автор сообщения
   * @returns {Promise<string[]>} Promise<string[]>
   */
  private async getVideoProducerIds(_user_id: string): Promise<string[]> {
    try {
      return this.videoProducerIds;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - getVideoProducerIds');
    }
  }

  /**
   * Id юзеров которые передаеют стримы на сервер.
   * @param {string} _user_id автор сообщения
   * @returns {Promise<string[]>} Promise<string[]>
   */
  private async getAudioProducerIds(_user_id: string): Promise<string[]> {
    try {
      return this.audioProducerIds;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - getAudioProducerIds');
    }
  }

  /**
   * Остановить передачу стрима на сервер от пользователя.
   * @param {object} data { user_id: string; kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async producerClose(data: { user_id: string; kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      const target_user = this.clients.get(data.user_id);

      if (target_user) {
        let target_producer: IProducer;

        switch (data.kind) {
          case 'video':
            target_producer = target_user.media.producerVideo;
            break;
          case 'audio':
            target_producer = target_user.media.producerAudio;
            break;
        }

        if (target_producer && !target_producer.closed) {
          target_producer.close();
        }
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - producerClose');
    }
  }

  /**
   * Приостановить передачу стрима на сервер от пользователя.
   * @param {object} data { user_id: string; kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async producerPause(data: { user_id: string; kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      const target_user = this.clients.get(data.user_id);

      if (target_user) {
        let target_producer: IProducer;

        switch (data.kind) {
          case 'video':
            target_producer = target_user.media.producerVideo;
            break;
          case 'audio':
            target_producer = target_user.media.producerAudio;
            break;
        }

        if (target_producer && !target_producer.paused) {
          await target_producer.pause();
        }
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - producerPause');
    }
  }

  /**
   * Возобновить передачу стрима на сервер от пользователя.
   * @param {object} data { user_id: string; kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async producerResume(data: { user_id: string; kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      const target_user = this.clients.get(data.user_id);

      if (target_user) {
        let target_producer: IProducer;

        switch (data.kind) {
          case 'video':
            target_producer = target_user.media.producerVideo;
            break;
          case 'audio':
            target_producer = target_user.media.producerAudio;
            break;
        }

        if (target_producer && target_producer.paused && !target_producer.closed) {
          await target_producer.resume();
        } else if (target_producer && target_producer.closed) {
          target_user.io.emit('mediaReproduce', { kind: data.kind });
        }
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - producerResume');
    }
  }

  /**
   * Остановить передачу стрима на сервер от всех пользователей.
   * @param {object} data { kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async allProducerClose(data: { kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      this.clients.forEach(async client => {
        if (client.media) {
          let target_producer: IProducer;

          switch (data.kind) {
            case 'video':
              target_producer = client.media.producerVideo;
              break;
            case 'audio':
              target_producer = client.media.producerAudio;
              break;
          }

          if (target_producer && !target_producer.closed) {
            target_producer.close();
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - allProducerClose');
    }
  }

  /**
   * Приостановить передачу стрима на сервер от всех пользователей.
   * @param {object} data { kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async allProducerPause(data: { kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      this.clients.forEach(async client => {
        if (client.media) {
          let target_producer: IProducer;

          switch (data.kind) {
            case 'video':
              target_producer = client.media.producerVideo;
              break;
            case 'audio':
              target_producer = client.media.producerAudio;
              break;
          }

          if (target_producer && !target_producer.paused) {
            await target_producer.pause();
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - allProducerPause');
    }
  }

  /**
   * Возобновить передачу стрима на сервер от всех пользователей.
   * @param {object} data { kind: TKind }
   * @param {string} _user_id автор сообщения
   * @returns {Promise<boolean>} promise<boolean>
   */
  private async allProducerResume(data: { kind: TKind }, _user_id: string): Promise<boolean> {
    try {
      this.clients.forEach(async client => {
        if (client.media) {
          let target_producer: IProducer;

          switch (data.kind) {
            case 'video':
              target_producer = client.media.producerVideo;
              break;
            case 'audio':
              target_producer = client.media.producerAudio;
              break;
          }

          if (target_producer && target_producer.paused && !target_producer.closed) {
            await target_producer.resume();
          } else if (target_producer && target_producer.closed) {
            client.io.emit('mediaReproduce', { kind: data.kind });
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - allProducerResume');
    }
  }

  /**
   * Изменяет качество стрима.
   * @returns {Promise<boolean>} Promise<boolean>
   */
  private async updateMaxIncomingBitrate(): Promise<boolean> {
    try {
      const {
        minimumAvailableOutgoingBitrate,
        maximumAvailableOutgoingBitrate,
        factorIncomingBitrate,
      } = mediasoupSettings.webRtcTransport;

      let newMaxIncomingBitrate = Math.round(
        maximumAvailableOutgoingBitrate / ((this.producerIds.length - 1) * factorIncomingBitrate)
      );

      if (newMaxIncomingBitrate < minimumAvailableOutgoingBitrate) {
        newMaxIncomingBitrate = minimumAvailableOutgoingBitrate;
      }

      if (this.producerIds.length < 3) {
        newMaxIncomingBitrate = maximumAvailableOutgoingBitrate;
      }

      this.clients.forEach(client => {
        if (client.media) {
          if (client.media.producerTransport && !client.media.producerTransport.closed) {
            client.media.producerTransport.setMaxIncomingBitrate(newMaxIncomingBitrate);
          }
          if (client.media.consumerTransport && !client.media.consumerTransport.closed) {
            client.media.consumerTransport.setMaxIncomingBitrate(newMaxIncomingBitrate);
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'MediasoupHelper - updateMaxBitrate');
    }
  }
}
