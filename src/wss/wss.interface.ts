import { IConsumer } from 'mediasoup/Consumer';
import { IProducer } from 'mediasoup/Producer';
import { ITransport } from 'mediasoup/Transport';
import { IWebRtcTransport } from 'mediasoup/WebRtcTransport';

export type TWebRtcTransport = IWebRtcTransport & ITransport;

export interface IHandshakeQuery {
  readonly user_id: string | null | undefined;
  readonly session_id: string | null | undefined;
}

// tslint:disable: no-any
export interface IRoomClient {
  producerVideo?: IProducer;
  producerAudio?: IProducer;
  producerTransport?: TWebRtcTransport;
  consumerTransport?: TWebRtcTransport;
  consumersVideo?: Map<string, IConsumer>;
  consumersAudio?: Map<string, IConsumer>;
}
