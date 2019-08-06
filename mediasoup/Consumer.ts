import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IConsumer {
  /**
   *
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param score
   */
  new ({
    internal,
    data,
    channel,
    appData,
    paused,
    producerPaused,
    score,
  }: {
    internal: object;
    data: object;
    channel: IChannel;
    appData: object;
    paused: boolean;
    producerPaused: boolean;
    score: object;
  });

  /**
   * Consumer id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Associated Producer id.
   *
   * @type {String}
   */
  producerId: string;

  /**
   * Whether the Consumer is closed.
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
   * Associated Producer type.
   *
   * @type {String} - It can be 'simple', 'simulcast' or 'svc'.
   */
  type: string;

  /**
   * Whether the Consumer is paused.
   *
   * @return {Boolean}
   */
  paused: boolean;

  /**
   * Whether the associate Producer  is paused.
   *
   * @return {Boolean}
   */
  producerPaused: boolean;

  /**
   * RTP parameters.
   *
   * @return {RTCRtpParameters}
   */
  rtpParameters: RTCRtpParameters;

  /**
   * Close the Consumer.
   */
  close(): void;

  /**
   * Transport was closed.
   *
   * @private
   */
  transportClosed(): void;

  /**
   * Dump Consumer.
   *
   * @async
   * @returns {Object}
   * @return
   */
  dump(): any;

  /**
   * Get Consumer stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): void;

  /**
   * Pause the Consumer.
   *
   * @async
   */
  pause(): void;

  /**
   * Resume the Consumer.
   *
   * @async
   */
  resume(): void;

  /**
   * Set preferred video layers.
   *
   * @async
   * @param undefined
   * @param temporalLayer}
   */
  setPreferredLayers({ spatialLayer, temporalLayer }: { spatialLayer: any; temporalLayer: any }): void;

  /**
   * Request a key frame to the Producer.
   *
   * @async
   */
  requestKeyFrame(): void;

  /**
   * @private
   */
  _handleWorkerNotifications(): void;
}
