// tslint:disable: no-any

export interface IWebRtcTransport {
  /**
   *
   * @param params
   */
  new (params: any);

  /**
   * @type {String}
   */
  iceRole: string;

  /**
   * @type {Object}
   */
  iceParameters: object;

  /**
   * @type {Array<RTCIceCandidate>}
   */
  iceCandidates: RTCIceCandidate[];

  /**
   * @type {String}
   */
  iceState: string;

  /**
   * @type {Object}
   */
  iceSelectedTuple: object;

  /**
   * @type {Object}
   */
  dtlsParameters: object;

  /**
   * @type {String}
   */
  dtlsState: string;

  /**
   * @type {String}
   */
  dtlsRemoteCert: string;

  /**
   * @type {Object}
   */
  sctpParameters: object;

  /**
   * @type {String}
   */
  sctpState: string;

  /**
   * Close the WebRtcTransport.
   *
   * @override
   */
  close(): void;

  /**
   * Router was closed.
   *
   * @private
   * @override
   */
  routerClosed(): void;

  /**
   * Provide the WebRtcTransport remote parameters.
   *
   * @param {RTCDtlsParameters} dtlsParameters - Remote DTLS parameters.
   *
   * @async
   * @override
   * @param {dtlsParameters}
   */
  connect({ dtlsParameters }: { dtlsParameters: RTCDtlsParameters }): Promise<void>;

  /**
   * Set maximum incoming bitrate for receiving media.
   *
   * @param {Number} bitrate - In bps.
   *
   * @async
   * @param bitrate
   */
  setMaxIncomingBitrate(bitrate: number): void;

  /**
   * Restart ICE.
   *
   * @async
   * @returns {RTCIceParameters}
   * @return
   */
  restartIce(): Promise<RTCIceParameters>;

  /**
   * @private
   * @override
   */
  _handleWorkerNotifications(): void;
}
