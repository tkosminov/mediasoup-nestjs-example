import { Socket } from 'net';

// tslint:disable: no-any

export interface IChannel {
  /**
   *
   * @param undefined
   * @param pid}
   */
  new ({ socket, pid }: { socket: Socket; pid: number });
}
