// tslint:disable: no-any

export interface IWebRtcTransport {
  /**
   * @private
   *
   * @emits {iceState: String} icestatechange
   * @emits {iceSelectedTuple: Object} iceselectedtuplechange
   * @emits {dtlsState: String} dtlsstatechange
   * @emits {sctpState: String} sctpstatechange
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
   * Observer.
   *
   * @override
   * @type {EventEmitter}
   *
   * @emits close
   * @emits {producer: Producer} newproducer
   * @emits {consumer: Consumer} newconsumer
   * @emits {producer: DataProducer} newdataproducer
   * @emits {consumer: DataConsumer} newdataconsumer
   * @emits {iceState: String} icestatechange
   * @emits {iceSelectedTuple: Object} iceselectedtuplechange
   * @emits {dtlsState: String} dtlsstatechange
   * @emits {sctpState: String} sctpstatechange
   */
  observer: any;

  /**
   * Close the WebRtcTransport.
   *
   * @override
   */
  close(): void;

  // /**
  //  * Router was closed.
  //  *
  //  * @private
  //  * @override
  //  */
  // routerClosed(): void;

  /**
   * Provide the WebRtcTransport remote parameters.
   *
   * @param {RTCDtlsParameters} dtlsParameters - Remote DTLS parameters.
   *
   * @async
   * @override
   */
  connect({ dtlsParameters }: { dtlsParameters: RTCDtlsParameters }): Promise<void>;

  /**
   * Set maximum incoming bitrate for receiving media.
   *
   * @param {Number} bitrate - In bps.
   *
   * @async
   */
  setMaxIncomingBitrate(bitrate: number): Promise<void>;

  /**
   * Restart ICE.
   *
   * @async
   * @returns {RTCIceParameters}
   */
  restartIce(): Promise<RTCIceParameters>;
}
