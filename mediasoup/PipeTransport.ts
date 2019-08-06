import { IConsumer } from './Consumer';

// tslint:disable: no-any

export interface IPipeTransport {
  /**
   * @private
   */
  new (params: any);

  /**
   * @type {Object}
   */
  tuple: string;

  /**
   * @type {Object}
   */
  sctpParameters: any;

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
   * Provide the PipeTransport remote parameters.
   *
   * @param {String} ip - Remote IP.
   * @param {Number} port - Remote port.
   *
   * @async
   * @override
   */
  connect({ ip, port }: { ip: string; port: number }): Promise<void>;

  /**
   * Create a pipe Consumer.
   *
   * @param {String} producerId
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @override
   * @returns {Consumer}
   */
  consume({ producerId, appData }: { producerId: string; appData: object }): Promise<IConsumer>;
}
