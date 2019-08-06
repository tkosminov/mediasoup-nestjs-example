import { IChannel } from './Channel';
import { IConsumer } from './Consumer';
import { IDataConsumer } from './DataConsumer';
import { IDataProducer } from './DataProducer';
import { IProducer } from './Producer';

// tslint:disable: no-any

export interface ITransport {
  /**
   * @private
   * @interface
   *
   * @emits routerclose
   * @emits @close
   * @emits @newproducer
   * @emits @producerclose
   * @emits @newdataproducer
   * @emits @dataproducerclose
   */
  new ({
    internal,
    data,
    channel,
    appData,
    getRouterRtpCapabilities,
    getProducerById,
    getDataProducerById,
  }: {
    internal: {};
    data: {};
    channel: IChannel;
    appData: {};
    getRouterRtpCapabilities: () => RTCRtpCapabilities;
    getProducerById: () => IProducer;
    getDataProducerById: () => IDataProducer;
  });

  /**
   * Transport id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Whether the Transport is closed.
   *
   * @type {Boolean}
   */
  closed: boolean;

  /**
   * App custom data.
   *
   * @type {object}
   */
  appData: object;

  /**
   * Observer.
   *
   * @type {EventEmitter}
   *
   * @emits close
   * @emits {producer: Producer} newproducer
   * @emits {consumer: Consumer} newconsumer
   * @emits {producer: DataProducer} newdataproducer
   * @emits {consumer: DataConsumer} newdataconsumer
   */
  observer: any;

  /**
   * Close the Transport.
   *
   * @virtual
   */
  close(): void;

  // /**
  //  * Router was closed.
  //  *
  //  * @private
  //  * @virtual
  //  */
  // routerClosed(): void;

  /**
   * Dump Transport.
   *
   * @async
   * @returns {Object}
   */
  dump(): Promise<object>;

  /**
   * Get Transport stats.
   *
   * @async
   * @returns {Array<Object>}
   */
  getStats(): Promise<object[]>;

  /**
   * Provide the Transport remote parameters.
   *
   * @async
   * @abstract
   */
  connect(): Promise<void>;

  /**
   * Create a Producer.
   *
   * @param {String} [id] - Producer id (just for PipeTransports).
   * @param {String} kind - 'audio'/'video'.
   * @param {RTCRtpParameters} rtpParameters - Remote RTP parameters.
   * @param {Boolean} [paused=false] - Whether the Producer must start paused.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {Producer}
   */
  produce({
    id,
    kind,
    rtpParameters,
    paused,
    appData,
  }: {
    id?: string;
    kind: string;
    rtpParameters: RTCRtpParameters;
    paused?: boolean;
    appData?: object;
  }): Promise<IProducer>;

  /**
   * Create a Consumer.
   *
   * @param {String} producerId
   * @param {RTCRtpCapabilities} rtpCapabilities - Remote RTP capabilities.
   * @param {Boolean} [paused=false] - Whether the Consumer must start paused.
   * @param {Object} [preferredLayers] - Preferred spatial and temporal layers.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @virtual
   * @returns {Consumer}
   */
  consume({
    producerId,
    rtpCapabilities,
    paused,
    preferredLayers,
    appData,
  }: {
    producerId: string;
    rtpCapabilities: RTCRtpCapabilities;
    paused?: boolean;
    preferredLayers?: object;
    appData?: object;
  }): Promise<IConsumer>;

  /**
   * Create a DataProducer.
   *
   * @param {String} [id] - DataProducer id (just for PipeTransports).
   * @param {RTCSctpStreamParameters} sctpStreamParameters - Remote SCTP stream
   *   parameters.
   * @param {String} [label='']
   * @param {String} [protocol='']
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {DataProducer}
   */
  produceData({
    id,
    sctpStreamParameters,
    label,
    protocol,
    appData,
  }: {
    id: string;
    sctpStreamParameters: any;
    label: string;
    protocol: string;
    appData: {};
  }): Promise<IDataProducer>;

  /**
   * Create a DataConsumer.
   *
   * @param {String} dataProducerId
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @virtual
   * @returns {DataConsumer}
   */
  consumeData({ dataProducerId, appData }: { dataProducerId: string; appData: {} }): Promise<IDataConsumer>;
}
