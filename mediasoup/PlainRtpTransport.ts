import { IConsumer } from './Consumer';

// tslint:disable: no-any

export interface IPlainRtpTransport {
  /**
   * @private
   *
   * @emits {sctpState: String} sctpstatechange
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
   * Observer.
   *
   * @override
   * @type {EventEmitter}
   *
   * @emits close
   * @emits {producer: Producer} newproducer
   * @emits {consumer: Consumer} newconsumer
   * @emits {producer: DataProducer} newdataproducer
   * @emits {consumer: DataConsumer} newdataconsumer
   * @emits {sctpState: String} sctpstatechange
   */
  observer: any;

  /**
   * Close the PlainRtpTransport.
   *
   * @override
   */
  close(): void;

  // /**
  //  * Router was closed.
  //  *
  //  * @private
  //  * @override
  //  */
  // routerClosed(): void;

  /**
   * Provide the PlainRtpTransport remote parameters.
   *
   * @param {String} ip - Remote IP.
   * @param {Number} port - Remote port.
   * @param {Number} [rtcpPort] - Remote RTCP port (ignored if rtcpMux was true).
   *
   * @async
   * @override
   */
  connect({ ip, port, rtcpPort }: { ip: string; port: number; rtcpPort: number }): Promise<void>;

  /**
   * Override Transport.consume() method to reject it if multiSource is set.
   *
   * @async
   * @override
   * @returns {Consumer}
   */
  consume({ ...params }: any): Promise<IConsumer>;
}
