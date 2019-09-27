import { IChannel } from './Channel';
import { IPeerStat } from './interfaces';

// tslint:disable: no-any

export interface IProducer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits {Array<Object>} score
   * @emits {Object} videoorientationchange
   * @emits @close
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
  kind: 'audio' | 'video';

  /**
   * RTP parameters.
   *
   * @type {RTCRtpParameters}
   */
  rtpParameters: RTCRtpParameters;

  /**
   * Producer type.
   *
   * @type {String} - It can be 'simple', 'simulcast' or 'svc'.
   */
  type: 'simple' | 'simulcast' | 'svc';

  /**
   * Consumable RTP parameters.
   *
   * @private
   * @type {RTCRtpParameters}
   */
  consumableRtpParameters: RTCRtpParameters;

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
  score: object[];

  /**
   * App custom data.
   *
   * @type {Object}
   */
  appData: object;

  /**
   * Observer.
   *
   * @type {EventEmitter}
   *
   * @emits close
   * @emits pause
   * @emits resume
   * @emits {Array<Object>} score
   * @emits {Object} videoorientationchange
   */
  observer: any;

  on(type: any, listener: (...params: any) => Promise<void> | void): Promise<void> | void;

  /**
   * Close the Producer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;

  /**
   * Dump Producer.
   *
   * @async
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Get Producer stats.
   *
   * @async
   * @returns {Array<IPeerStat>}
   */
  getStats(): Promise<IPeerStat[]>;

  /**
   * Pause the Producer.
   *
   * @async
   */
  pause(): Promise<void>;

  /**
   * Resume the Producer.
   *
   * @async
   */
  resume(): Promise<void>;
}
