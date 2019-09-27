import io from 'socket.io';

import { IConsumer } from 'mediasoup/Consumer';
import { TWebRtcTransport } from 'mediasoup/interfaces';
import { IProducer } from 'mediasoup/Producer';

export interface IClientQuery {
  readonly user_id: string;
  readonly session_id: string;
  readonly device: string;
}

export interface IClient {
  id: string;
  io: io.Socket;
  media?: IMediasoupClient;
  device: string;
}

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
    | 'getAudioProducerIds'
    | 'getVideoProducerIds'
    | 'producerClose'
    | 'producerPause'
    | 'producerResume'
    | 'allProducerClose'
    | 'allProducerPause'
    | 'allProducerResume';
  readonly data?: object;
}
