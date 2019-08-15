import { IAudioLevelObserver } from './AudioLevelObserver';
import { IChannel } from './Channel';
import { IConsumer } from './Consumer';
import { IDataConsumer } from './DataConsumer';
import { IDataProducer } from './DataProducer';
import { IPipeTransport } from './PipeTransport';
import { IPlainRtpTransport } from './PlainRtpTransport';
import { IProducer } from './Producer';
import { IRtpObserver } from './RtpObserver';
import { ITransport } from './Transport';
import { IWebRtcTransport } from './WebRtcTransport';

// tslint:disable: no-any

export interface IRouter {
  /**
   * @private
   *
   * @emits workerclose
   * @emits @close
   */
  new ({ internal, data, channel }: { internal: object; data: object; channel: IChannel });

  /**
   * Router id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Whether the Router is closed.
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
   * @emits {transport: Transport} newtransport
   */
  observer: any;

  /**
   * Whether the Router is closed.
   *
   * @type {RTCRtpCapabilities}
   */
  rtpCapabilities: RTCRtpCapabilities;

  /**
   * Close the Router.
   */
  close(): void;

  // /**
  //  * Worker was closed.
  //  *
  //  * @private
  //  */
  // workerClosed(): void;

  /**
   * Dump Router.
   *
   * @private
   *
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Create a WebRtcTransport.
   *
   * @param {Array<String|Object>} listenIps - Listen IPs in order of preference.
   *   Each entry can be a IP string or an object with ip and optional
   *   announcedIp strings.
   * @param {Boolean} [enableUdp=true] - Enable UDP.
   * @param {Boolean} [enableTcp=false] - Enable TCP.
   * @param {Boolean} [preferUdp=false] - Prefer UDP.
   * @param {Boolean} [preferTcp=false] - Prefer TCP.
   * @param {Number} [initialAvailableOutgoingBitrate=600000] - Initial available
   *   outgoing bitrate (in bps) when the endpoint supports REMB or Transport-CC.
   * @param {Number} [minimumAvailableOutgoingBitrate=300000] - Minimum available
   *   outgoing bitrate (in bps).
   * @param {Boolean} [enableSctp=false] - Enable SCTP.
   * @param {Object} [numSctpStreams={ OS: 1024, MIS: 1024 }] - Number of SCTP
   *   streams (initially requested outbound streams and maximum inbound streams).
   * @param {Number} [maxSctpMessageSize=262144] - Max SCTP message size (in bytes).
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {IWebRtcTransport & ITransport}
   */
  createWebRtcTransport({
    listenIps,
    enableUdp,
    enableTcp,
    preferUdp,
    preferTcp,
    initialAvailableOutgoingBitrate,
    minimumAvailableOutgoingBitrate,
    enableSctp,
    numSctpStreams,
    maxSctpMessageSize,
    appData,
  }: {
    listenIps: string[] | object[];
    enableUdp?: boolean;
    enableTcp?: boolean;
    preferUdp?: boolean;
    preferTcp?: boolean;
    initialAvailableOutgoingBitrate?: number;
    minimumAvailableOutgoingBitrate?: number;
    enableSctp?: boolean;
    numSctpStreams?: { OS: number; MIS: number };
    maxSctpMessageSize?: number;
    appData?: object;
  }): Promise<IWebRtcTransport & ITransport>;

  /**
   * Create a PlainRtpTransport.
   *
   * @param {String|Object} listenIp - Listen IP string or an object with ip and
   *   optional announcedIp string.
   * @param {Boolean} [rtcpMux=true] - Use RTCP-mux.
   * @param {Boolean} [comedia=false] - Whether remote IP:port should be
   *   auto-detected based on first RTP/RTCP packet received. If enabled, connect()
   *   method must not be called. This option is ignored if multiSource is set.
   * @param {Boolean} [multiSource=false] - Whether RTP/RTCP from different remote
   *   IPs:ports is allowed. If set, the transport will just be valid for receiving
   *   media (consume() cannot be called on it) and connect() must not be called.
   * @param {Boolean} [enableSctp=false] - Enable SCTP.
   * @param {Object} [numSctpStreams={ OS: 1024, MIS: 1024 }] - Number of SCTP
   *   streams (initially requested outbound streams and maximum inbound streams).
   * @param {Number} [maxSctpMessageSize=262144] - Max SCTP message size (in bytes).
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {IPlainRtpTransport & ITransport}
   */
  createPlainRtpTransport({
    listenIp,
    rtcpMux,
    comedia,
    multiSource,
    enableSctp,
    numSctpStreams,
    maxSctpMessageSize,
    appData,
  }: {
    listenIp: string | object;
    rtcpMux?: boolean;
    comedia?: boolean;
    multiSource?: boolean;
    enableSctp?: boolean;
    numSctpStreams?: number;
    maxSctpMessageSize?: number;
    appData?: object;
  }): Promise<IPlainRtpTransport & ITransport>;

  /**
   * Create a PipeTransport.
   *
   * @param {String|Object} listenIp - Listen IP string or an object with ip and optional
   *   announcedIp string.
   * @param {Boolean} [enableSctp=false] - Enable SCTP.
   * @param {Object} [numSctpStreams={ OS: 1024, MIS: 1024 }] - Number of SCTP
   *   streams (initially requested outbound streams and maximum inbound streams).
   * @param {Number} [maxSctpMessageSize=1073741823] - Max SCTP message size (in bytes).
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {IPipeTransport & ITransport}
   */
  createPipeTransport({
    listenIp,
    enableSctp,
    numSctpStreams,
    maxSctpMessageSize,
    appData,
  }: {
    listenIp: string | object;
    enableSctp?: boolean;
    numSctpStreams?: { OS: number; MIS: number };
    maxSctpMessageSize?: number;
    appData?: object;
  }): Promise<IPipeTransport & ITransport>;

  /**
   * Pipes the given Producer or DataProducer into another Router in same host.
   *
   * @param {String} [producerId]
   * @param {String} [dataProducerId]
   * @param {Router} router
   * @param {String|Object} [listenIp='127.0.0.1'] - Listen IP string or an
   *   object with ip and optional announcedIp string.
   * @param {Boolean} [enableSctp=true] - Enable SCTP.
   * @param {Object} [numSctpStreams={ OS: 1024, MIS: 1024 }] - Number of SCTP
   *   streams (initially requested outbound streams and maximum inbound streams).
   *
   * @async
   * @returns {Object} - Contains `pipeConsumer` {Consumer} created in the current
   *   Router and `pipeProducer` {Producer} created in the destination Router, or
   *   `pipeDataConsumer` {DataConsumer} and `pipeDataProducer` {DataProducer}.
   */
  pipeToRouter({
    producerId,
    dataProducerId,
    router,
    listenIp,
    enableSctp,
    numSctpStreams,
  }: {
    producerId: string;
    dataProducerId: string;
    router: IRouter;
    listenIp: string | object;
    enableSctp: boolean;
    numSctpStreams: { OS: number; MIS: number };
  }): Promise<{
    pipeConsumer?: IConsumer;
    pipeProducer?: IProducer;
    pipeDataConsumer?: IDataConsumer;
    pipeDataProducer?: IDataProducer;
  }>;

  /**
   * Create an AudioLevelObserver.
   *
   * @param {Number} [maxEntries=1] - Maximum number of entries in the 'volumes'
   *                                  event.
   * @param {Number} [threshold=-80] - Minimum average volume (in dBvo from -127 to 0)
   *                                   for entries in the 'volumes' event.
   * @param {Number} [interval=1000] - Interval in ms for checking audio volumes.
   *
   * @async
   * @returns {AudioLevelObserver & IRtpObserver}
   */
  createAudioLevelObserver({
    maxEntries,
    threshold,
    interval,
  }: {
    maxEntries: number;
    threshold: number;
    interval: number;
  }): Promise<IAudioLevelObserver & IRtpObserver>;

  /**
   * Check whether the given RTP capabilities can consume the given Producer.
   *
   * @param {String} producerId
   * @param {RTCRtpCapabilities} rtpCapabilities - Remote RTP capabilities.
   *
   * @returns {Boolean}
   */
  canConsume({ producerId, rtpCapabilities }: { producerId: string; rtpCapabilities: RTCRtpCapabilities }): boolean;
}
