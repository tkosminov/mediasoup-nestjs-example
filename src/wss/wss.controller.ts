import { Controller, Get, Param } from '@nestjs/common';

import { throwNOTFOUND } from '../common/errors';

import { WssGateway } from './wss.gateway';

@Controller('websocket')
export class WssController {
  constructor(private readonly wssGateway: WssGateway) {}

  @Get('workers/stats')
  public async workersStats() {
    return Object.keys(this.wssGateway.workers).map(key => {
      const worker = this.wssGateway.workers[key];

      return {
        worker: parseInt(key, 10),
        clientsCount: worker.clientsCount,
        roomsCount: worker.roomsCount,
      };
    });
  }

  @Get('rooms/stats')
  public async roomsStats() {
    return Array.from(this.wssGateway.rooms.values()).map(room => {
      return room.stats;
    });
  }

  @Get('rooms/:id/stats')
  public async roomStats(@Param('id') id: string) {
    const room = this.wssGateway.rooms.get(id);

    if (room) {
      return room.stats;
    }

    throwNOTFOUND();
  }

  @Get('rooms/:id/change_worker')
  public async roomChangeWorker(@Param('id') id: string) {
    const room = this.wssGateway.rooms.get(id);

    if (room) {
      await this.wssGateway.reConfigureMedia(room);

      return { msg: 'ok' };
    }

    throwNOTFOUND();
  }
}
