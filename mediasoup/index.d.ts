import { IWorker } from './Worker';

// tslint:disable: no-any
// tslint:disable: no-unsafe-any

declare module 'mediasoup' {
  export const version: string;

  export function createWorker({
    logLevel,
    logTags,
    rtcMinPort,
    rtcMaxPort,
    dtlsCertificateFile,
    dtlsPrivateKeyFile,
  }: any): Promise<IWorker>;

  export function getSupportedRtpCapabilities(): RTCRtpCapabilities;

  export function parseScalabilityMode(scalabilityMode: any): any;

  export namespace observer {
    function addListener(type: any, listener: any): any;

    function emit(type: any, args: any): any;

    function eventNames(): any;

    function getMaxListeners(): any;

    function listenerCount(type: any): any;

    function listeners(type: any): any;

    function off(type: any, listener: any): any;

    function on(type: any, listener: any): any;

    function once(type: any, listener: any): any;

    function prependListener(type: any, listener: any): any;

    function prependOnceListener(type: any, listener: any): any;

    function rawListeners(type: any): any;

    function removeAllListeners(type: any, ...args: any[]): any;

    function removeListener(type: any, listener: any): any;

    function safeEmit(...args: any[]): void;

    function safeEmitAsPromise(...args: any[]): void;

    function setMaxListeners(n: any): any;
  }
}
