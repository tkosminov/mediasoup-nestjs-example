import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IDataConsumer {
  /**
   *
   * @param undefined
   * @param undefined
   * @param undefined
   * @param appData}
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
   * Close the DataConsumer.
   */
  close(): void;

  /**
   * Transport was closed.
   *
   * @private
   */
  transportClosed(): void;

  /**
   * Dump DataConsumer.
   *
   * @async
   * @returns {Object}
   * @return
   */
  dump(): any;

  /**
   * Get DataConsumer stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): Promise<object[]>;

  /**
   * @private
   */
  _handleWorkerNotifications(): void;
}
