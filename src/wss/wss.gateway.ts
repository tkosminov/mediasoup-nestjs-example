import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import config from 'config';
import io from 'socket.io';

import mediasoup from 'mediasoup';
import { IWorker } from 'mediasoup/Worker';

import { LoggerService } from '../logger/logger.service';

import { IMsMessage } from './wss.interfaces';
import { WssRoom } from './wss.room';

const appSettings = config.get<IAppSettings>('APP_SETTINGS');
const mediasoupSettings = config.get<IMediasoupSettings>('MEDIASOUP_SETTINGS');

// tslint:disable: no-unsafe-any
@WebSocketGateway(appSettings.wssPort)
export class WssGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: io.Server;

  private readonly rooms: Map<string, WssRoom> = new Map();

  private workers: { [index: number]: { clientsCount: number; worker: IWorker } };

  constructor(private readonly logger: LoggerService) {
    this.createWorkers();
  }

  /**
   * Создает воркеры медиасупа.
   * @returns {Promise<void>} Promise<void>
   */
  private async createWorkers(): Promise<void> {
    const promises = [];
    for (let i = 0; i < mediasoupSettings.workerPool; i++) {
      promises.push(mediasoup.createWorker(mediasoupSettings.worker));
    }

    this.workers = (await Promise.all(promises)).reduce((acc, worker, index) => {
      acc[index] = {
        clientsCount: 0,
        worker,
      };

      return acc;
    }, {});
  }

  /**
   * Обновляет инфу о количество пользователей на веркере.
   * @returns {void} void
   */
  private updateWorkerStats(): void {
    const data: { [index: number]: number } = {};

    this.rooms.forEach(room => {
      if (data[room.workerIndex]) {
        data[room.workerIndex] += room.clientsCount;
      } else {
        data[room.workerIndex] = room.clientsCount;
      }
    });

    Object.entries(data).forEach(([index, clientsCount]) => {
      this.workers[index].clientsCount = clientsCount;
    });
  }

  /**
   * Возвращает номер воркер с наименьшим количеством участников.
   * @returns {number} number
   */
  private getOptimalWorkerIndex(): number {
    return parseInt(
      Object.entries(this.workers).reduce((prev, curr) => {
        if (prev[1].clientsCount < curr[1].clientsCount) {
          return prev;
        }
        return curr;
      })[0],
      10
    );
  }

  private getClientQuery(client: io.Socket): { user_id: string; session_id: string } {
    return client.handshake.query as { user_id: string; session_id: string };
  }

  public async handleConnection(client: io.Socket) {
    try {
      const { user_id, session_id } = this.getClientQuery(client);

      let room = this.rooms.get(session_id);

      if (!room) {
        this.updateWorkerStats();

        const index = this.getOptimalWorkerIndex();

        room = new WssRoom(this.workers[index].worker, index, session_id, this.logger, this.server);

        await room.load();

        this.rooms.set(session_id, room);

        this.logger.info(`room ${session_id} created`);
      }

      await room.addClient(user_id, client);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssGateway - handleConnection');
    }
  }

  public async handleDisconnect(client: io.Socket) {
    try {
      const { user_id, session_id } = this.getClientQuery(client);

      const room = this.rooms.get(session_id);

      await room.removeClient(user_id);

      if (!room.clientsCount) {
        room.close();
        this.rooms.delete(session_id);
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssGateway - handleDisconnect');
    }
  }

  @SubscribeMessage('roomClients')
  public async roomInfo(client: io.Socket) {
    try {
      const { session_id } = this.getClientQuery(client);

      const room = this.rooms.get(session_id);

      return {
        clientsCount: room.clientsCount,
        clientsIds: room.clientsIds,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssGateway - roomClients');
    }
  }

  @SubscribeMessage('media')
  public async media(client: io.Socket, msg: IMsMessage) {
    try {
      const { user_id, session_id } = this.getClientQuery(client);

      const room = this.rooms.get(session_id);

      return await room.speakMsClient(user_id, msg);
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssGateway - media');
    }
  }

  @SubscribeMessage('reConfigureMedia')
  public async remedia(client: io.Socket) {
    try {
      const { session_id } = this.getClientQuery(client);

      const room = this.rooms.get(session_id);

      if (room) {
        this.updateWorkerStats();

        const index = this.getOptimalWorkerIndex();

        await room.reConfigureMedia(this.workers[index].worker, index);
      }

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack, 'WssGateway - reConfigureMedia');
    }
  }
}
