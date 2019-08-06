import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IDataProducer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits @close
   */
  new ({ internal, data, channel, appData }: { internal: object; data: object; channel: IChannel; appData: object });

  /**
   * DataProducer id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Whether the DataProducer is closed.
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
   * Close the DataProducer.
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
