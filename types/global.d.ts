interface IClient {
  readonly client_id: string;
  readonly client_secret: string;
}

interface ILogSettings {
  readonly level: string;
  readonly silence: string[];
}

interface IAppSettings {
  readonly appPort: number;
  readonly wssPort: number;
  readonly swaggerScheme: 'http' | 'https';
  readonly client: IClient;
  readonly sslCrt: string;
  readonly sslKey: string;
}

interface ICorsSettings {
  readonly allowedOrigins: string[];
  readonly allowedMethods: string[];
  readonly allowedCredentials: boolean;
  readonly allowedHeaders: string[];
}

interface IMediasoupWorkerSettings {
  readonly rtcMinPort: number;
  readonly rtcMaxPort: number;
  readonly logLevel: string;
  readonly logTags: string[];
}

interface IMediasoupMediacodecSettings {
  readonly kind: string;
  readonly mimeType: string;
  readonly clockRate: number;
  readonly channels?: number;
  readonly parameters?: { "x-google-start-bitrate": number }
}

interface IMediasoupListenIds {
  readonly ip: string;
  readonly announcedIp?: string | null;
}

interface IMediasoupWebRtcTransport {
  readonly listenIps: IMediasoupListenIds[];
  readonly maxIncomingBitrate: number;
  readonly minIncomingBitrate: number;
  readonly factorIncomingBitrate: number;
  readonly initialAvailableOutgoingBitrate: number;
}

interface IMediasoupSettings {
  readonly workerPool: number;
  readonly worker: IMediasoupWorkerSettings;
  readonly router: { mediaCodecs: IMediasoupMediacodecSettings[] }
  readonly webRtcTransport: IMediasoupWebRtcTransport;
}