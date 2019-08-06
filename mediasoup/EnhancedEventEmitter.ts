// tslint:disable: no-any

export interface IEnhancedEventEmitter {
  /**
   *
   * @param logger
   */
  new (logger: any);

  /**
   *
   * @param event
   * @param ...args
   */
  safeEmit(event: any, ...args: any): void;

  /**
   *
   * @param event
   * @param ...args
   * @return
   */
  safeEmitAsPromise(event: any, ...args: any): Promise<void>;
}
