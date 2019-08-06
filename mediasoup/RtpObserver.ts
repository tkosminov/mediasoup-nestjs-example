import { IChannel } from './Channel';
import { IProducer } from './Producer';

// tslint:disable: no-any

export interface IRtpObserver {
  /**
   *
   * @param undefined
   * @param undefined
   * @param getProducerById}
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

  /**
   * Close the RtpObserver.
   *
   * @virtual
   */
  close(): void;

  /**
   * Router was closed.
   *
   * @private
   * @virtual
   */
  routerClosed(): void;

  /**
   * Pause the RtpObserver.
   *
   * @async
   */
  pause(): void;

  /**
   * Resume the RtpObserver.
   *
   * @async
   */
  resume(): void;

  /**
   * Add a Producer to the RtpObserver.
   *
   * @param {String} producerId - The id of a Producer.
   *
   * @async
   * @param {producerId}
   */
  addProducer({ producerId }: { producerId: string }): void;

  /**
   * Remove a Producer from the RtpObserver.
   *
   * @param {String} producerId - The id of a Producer.
   *
   * @async
   * @param {producerId}
   */
  removeProducer({ producerId }: { producerId: string }): void;

  /**
   * @private
   * @abstract
   */
  _handleWorkerNotifications(): void;
}
