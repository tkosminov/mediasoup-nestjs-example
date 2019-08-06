import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IDataProducer {
  /**
   *
   * @param undefined
   * @param undefined
   * @param undefined
   * @param appData}
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
   * Close the DataProducer.
   */
  close(): void;

  /**
   * Transport was closed.
   *
   * @private
   */
  transportClosed(): void;

  /**
   * Dump DataProducer.
   *
   * @async
   * @returns {Object}
   * @return
   */
  dump(): any;

  /**
   * Get DataProducer stats.
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
