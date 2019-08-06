import { IRouter } from './Router';

// tslint:disable: no-any

export interface IWorker {
  /**
   *
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param undefined
   * @param dtlsPrivateKeyFile}
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
   * Close the Worker.
   */
  close(): void;

  /**
   * Dump Worker.
   *
   * @async
   * @returns {Object}
   * @return
   */
  dump(): any;

  /**
   * 	 * Update settings.
   * 	 *
   * 	 * @param {String} [logLevel]
   *    * @param {Array<String>} [logTags]
   *    *
   * 	 * @async
   * @param undefined
   * @param logTags}
   */
  updateSettings(logLevel: string, logTags: string[]): void;

  /**
   * Create a Router.
   *
   * @param {Array<RTCRtpCodecCapability>} mediaCodecs
   *
   * @async
   * @returns {Router}
   * @param {mediaCodecs}
   * @return
   */
  createRouter({ mediaCodecs }: { mediaCodecs: RTCRtpCodecCapability[] }): Promise<IRouter>;
}
