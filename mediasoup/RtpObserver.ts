import { IChannel } from './Channel';
import { IProducer } from './Producer';

// tslint:disable: no-any

export interface IRtpObserver {
  /**
   * @private
   * @interface
   *
   * @emits routerclose
   * @emits @close
   */
  new ({
    internal,
    channel,
    getProducerById,
  }: {
    internal: object;
    channel: IChannel;
    getProducerById: () => IProducer;
  });

  /**
   * RtpObserver id.
   *
   * @type {String}
   */
  id: string;

  /**
   * Whether the RtpObserver is closed.
   *
   * @type {Boolean}
   */
  closed: boolean;

  /**
   * Whether the RtpObserver is paused.
   *
   * @type {Boolean}
   */
  paused: boolean;

  on(type: any, listener: (...params: any) => Promise<void> | void): Promise<void> | void;

  /**
   * Close the RtpObserver.
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
   * Pause the RtpObserver.
   *
   * @async
   */
  pause(): Promise<void>;

  /**
   * Resume the RtpObserver.
   *
   * @async
   */
  resume(): Promise<void>;

  /**
   * Add a Producer to the RtpObserver.
   *
   * @param {String} producerId - The id of a Producer.
   *
   * @async
   */
  addProducer({ producerId }: { producerId: string }): Promise<void>;

  /**
   * Remove a Producer from the RtpObserver.
   *
   * @param {String} producerId - The id of a Producer.
   *
   * @async
   */
  removeProducer({ producerId }: { producerId: string }): Promise<void>;
}
