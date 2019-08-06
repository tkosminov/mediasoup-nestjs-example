import { IConsumer } from './Consumer';

// tslint:disable: no-any

export interface IPlainRtpTransport {
  /**
   *
   * @param params
   */
  new (params: any);

  /**
   * @type {Object}
   */
  tuple: object;

  /**
   * @type {Object}
   */
  rtcpTuple: object;

  /**
   * @type {Object}
   */
  sctpParameters: object;

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
   * Provide the PlainRtpTransport remote parameters.
   *
   * @param {String} ip - Remote IP.
   * @param {Number} port - Remote port.
   * @param {Number} [rtcpPort] - Remote RTCP port (ignored if rtcpMux was true).
   *
   * @async
   * @override
   * @param undefined
   * @param undefined
   * @param rtcpPort}
   */
  connect({ ip, port, rtcpPort }: { ip: string; port: number; rtcpPort: number }): void;

  /**
   * Override Transport.consume() method to reject it if multiSource is set.
   *
   * @async
   * @override
   * @returns {Consumer}
   * @param {...params}
   * @return
   */
  consume({ ...params }: any): Promise<IConsumer>;

  /**
   * @private
   * @override
   */
  _handleWorkerNotifications(): void;
}
