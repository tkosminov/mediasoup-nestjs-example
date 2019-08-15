import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import config from 'config';
import io from 'socket.io';

import { MediasoupService } from './wss.mediasoup';

import { LoggerService } from '../logger/logger.service';

const appSettings = config.get<IAppSettings>('APP_SETTINGS');

// tslint:disable: no-unsafe-any
// tslint:disable: no-feature-envy
@WebSocketGateway(appSettings.wssPort)
export class WssGateway extends MediasoupService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: io.Server;

  constructor(logger: LoggerService) {
    super(logger);
  }

  public async handleConnection(client: io.Socket) {
    this.logger.info('connected');

    try {
      const query = this.getClientQuery(client);

      this.addToMediasoup(query);
      client.join(query.session_id);
      client.broadcast.to(query.session_id).emit('connectMember', query);

      return query;
    } catch (error) {
      this.logger.error('handleConnection');
    }
  }

  public async handleDisconnect(client: io.Socket) {
    this.logger.info('disconnected');

    try {
      const query = this.getClientQuery(client);

      this.removeFromMediasoup(query);
      client.broadcast.to(query.session_id).emit('disconnectMember', query);
      client.leave(query.session_id);

      return query;
    } catch (error) {
      this.logger.error('handleDisconnect');
    }
  }
}
