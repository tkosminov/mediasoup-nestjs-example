import { IChannel } from './Channel';

// tslint:disable: no-any

export interface IConsumer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits producerclose
   * @emits producerpause
   * @emits producerresume
   * @emits {consumer: Number, producerScore: Number} score
   * @emits {spatialLayer: Number, temporalLayer: Number|Null} layerschange
   * @emits @close
   * @emits @producerclose
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
   * RTP parameters.
   *
   * @return {RTCRtpParameters}
   */
  rtpParameters: RTCRtpParameters;

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
   * Consumer score with consumer and producerScore keys.
   *
   * @return {Object}
   */
  score: object;

  /**
   * Current video layers.
   *
   * @return {Object}
   */
  currentLayers: object;

  /**
   * App custom data.
   *
   * @return {Object}
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
   * @emits {consumer: Number, producerScore: Number} score
   * @emits {spatialLayer: Number, temporalLayer: Number|Null} layerschange
   */
  observer: any;

  /**
   * Close the Consumer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;

  /**
   * Dump Consumer.
   *
   * @async
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Get Consumer stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): Promise<object[]>;

  /**
   * Pause the Consumer.
   *
   * @async
   */
  pause(): Promise<void>;

  /**
   * Resume the Consumer.
   *
   * @async
   */
  resume(): Promise<void>;

  /**
   * Set preferred video layers.
   *
   * @async
   */
  setPreferredLayers({ spatialLayer, temporalLayer }: { spatialLayer: any; temporalLayer: any }): Promise<void>;

  /**
   * Request a key frame to the Producer.
   *
   * @async
   */
  requestKeyFrame(): Promise<void>;
}
