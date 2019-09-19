import { IAudioLevelObserver } from 'mediasoup/AudioLevelObserver';
import { IConsumer } from 'mediasoup/Consumer';
import { IProducer } from 'mediasoup/Producer';
import { IRtpObserver } from 'mediasoup/RtpObserver';
import { ITransport } from 'mediasoup/Transport';
import { IWebRtcTransport } from 'mediasoup/WebRtcTransport';

export type TWebRtcTransport = IWebRtcTransport & ITransport;
export type TAudioLevelObserver = IAudioLevelObserver & IRtpObserver;

export interface IMediasoupClient {
  producerVideo?: IProducer;
  producerAudio?: IProducer;
  producerTransport?: TWebRtcTransport;
  consumerTransport?: TWebRtcTransport;
  consumersVideo?: Map<string, IConsumer>;
  consumersAudio?: Map<string, IConsumer>;
}

export interface IMsMessage {
  readonly action:
    | 'getRouterRtpCapabilities'
    | 'createWebRtcTransport'
    | 'connectWebRtcTransport'
    | 'produce'
    | 'consume'
    | 'restartIce'
    | 'requestConsumerKeyFrame'
    | 'getTransportStats'
    | 'getProducerStats'
    | 'getConsumerStats'
    | 'getProducerIds'
    | 'producerClose'
    | 'producerPause'
    | 'producerResume'
    | 'allProducerClose'
    | 'allProducerPause'
    | 'allProducerResume';
  readonly data?: object;
}
