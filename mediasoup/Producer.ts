import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IProducer {
  /**
   *
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param paused}
   */
  new ({
    internal,
    data,
    channel,
    appData,
    paused,
  }: {
    internal: object;
    data: object;
    channel: IChannel;
    appData: object;
    paused: boolean;
  });

  /**
   * Producer id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Whether the Producer is closed.
   *
   * @type {Boolean}
   */
  closed: boolean;

  /**
   * Media kind.
   *
   * @type {String}
   */
  kind: string;

  /**
   * Producer type.
   *
   * @type {String} - It can be 'simple', 'simulcast' or 'svc'.
   */
  type: string;

  /**
   * Whether the Producer is paused.
   *
   * @return {Boolean}
   */
  paused: boolean;

  /**
   * Producer score list.
   *
   * @type {Array<Object>}
   */
  score: any[];

  /**
   *
   */
  consumableRtpParameters: any;

  /**
   * Close the Producer.
   */
  close(): void;

  /**
   * Transport was closed.
   *
   * @private
   */
  transportClosed(): void;

  /**
   * Dump Producer.
   *
   * @async
   * @returns {Object}
   * @return
   */
  dump(): any;

  /**
   * Get Producer stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): Promise<object[]>;

  /**
   * Pause the Producer.
   *
   * @async
   */
  pause(): void;

  /**
   * Resume the Producer.
   *
   * @async
   */
  resume(): void;

  /**
   * @private
   */
  _handleWorkerNotifications(): void;
}
