// tslint:disable: no-any

export interface IAudioLevelObserver {
  /**
   *
   * @param {...params}
   */
  new ({ ...params }: any);

  /**
   * @private
   * @override
   */
  _handleWorkerNotifications(): void;
}
