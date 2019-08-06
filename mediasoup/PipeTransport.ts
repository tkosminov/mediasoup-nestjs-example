import { IConsumer } from './Consumer';

// tslint:disable: no-any

export interface IPipeTransport {
  /**
   *
   * @param params
   */
  new (params: any);

  /**
   * @type {String}
   */
  sctpState: string;

  /**
   * Close the PlainRtpTransport.
   *
   * @override
   */
  close(): void;

  /**
   * Router was closed.
   *
   * @private
   * @override
   */
  routerClosed(): void;

  /**
   * Provide the PipeTransport remote parameters.
   *
   * @param {String} ip - Remote IP.
   * @param {Number} port - Remote port.
   *
   * @async
   * @override
   * @param undefined
   * @param port}
   */
  // tslint:disable-next-line: variable-name
  connect({ ip, port }: { ip: string; port: number }): void;

  /**
   * Create a pipe Consumer.
   *
   * @param {String} producerId
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @override
   * @returns {Consumer}
   * @param undefined
   * @param appData}
   * @return
   */
  consume({ producerId, appData }: { producerId: string; appData: object }): Promise<IConsumer>;

  /**
   * @private
   * @override
   */
  _handleWorkerNotifications(): void;
}
