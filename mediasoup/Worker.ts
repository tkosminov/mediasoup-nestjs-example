import { IRouter } from './Router';

// tslint:disable: no-any

export interface IWorker {
  /**
   * @private
   *
   * @emits died
   * @emits @succeed
   * @emits @settingserror
   * @emits @failure
   */
  new (
    logLevel: string,
    logTags: string[],
    rtcMinPort: number,
    rtcMaxPort: number,
    dtlsCertificateFile: string,
    dtlsPrivateKeyFile: string
  );

  /**
   * Worker process identifier (PID).
   *
   * @type {Number}
   */
  pid: number;

  /**
   * Whether the Worker is closed.
   *
   * @type {Boolean}
   */
  closed: boolean;

  /**
   * Observer.
   *
   * @type {EventEmitter}
   *
   * @emits close
   * @emits {router: Router} newrouter
   */
  observer: any;

  /**
   * Close the Worker.
   */
  close(): void;

  /**
   * Dump Worker.
   *
   * @async
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Update settings.
   *
   * @param {String} [logLevel]
   * @param {Array<String>} [logTags]
   *
   * @async
   */
  updateSettings(logLevel: string, logTags: string[]): Promise<void>;

  /**
   * Create a Router.
   *
   * @param {Array<RTCRtpCodecCapability>} mediaCodecs
   *
   * @async
   * @returns {Router}
   */
  createRouter({ mediaCodecs }: { mediaCodecs: RTCRtpCodecCapability[] }): Promise<IRouter>;
}
