import { Socket } from 'net';

// tslint:disable: no-any

export interface IChannel {
  /**
   *
   * @param undefined
   * @param pid}
   */
  new ({ socket, pid }: { socket: Socket; pid: number });

  /**
   * @private
   */
  close(): void;

  /**
   * @private
   *
   * @async
   * @param method
   * @param internal
   * @param data
   * @return
   */
  request(method: any, internal: any, data: any): /* Channel.prototype.+Promise */ any;

  /**
   * @private
   * @param msg
   */
  _processMessage(msg: any): void;
}
