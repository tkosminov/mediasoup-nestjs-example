import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IDataConsumer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits dataproducerclose
   * @emits @close
   * @emits @dataproducerclose
   */
  new ({ internal, data, channel, appData }: { internal: object; data: object; channel: IChannel; appData: object });

  /**
   * DataConsumer id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Associated DataProducer id.
   *
   * @type {String}
   */
  dataProducerId: string;

  /**
   * Whether the DataConsumer is closed.
   *
   * @type {Boolean}
   */
  closed: boolean;

  /**
   * SCTP stream parameters.
   *
   * @type {RTCSctpStreamParameters}
   */
  sctpStreamParameters: any;

  /**
   * DataChannel label.
   *
   * @returns {String}
   */
  label: string;

  /**
   * DataChannel protocol.
   *
   * @returns {String}
   */
  protocol: string;

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  appData: object;

  /**
   * Observer.
   *
   * @type {EventEmitter}
   *
   * @emits close
   */
  observer: any;

  /**
   * Close the DataConsumer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;

  /**
   * Dump DataConsumer.
   *
   * @async
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Get DataConsumer stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): Promise<object[]>;
}
