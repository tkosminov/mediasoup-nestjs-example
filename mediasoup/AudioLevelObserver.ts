// tslint:disable: no-any

export interface IAudioLevelObserver {
  /**
   * @private
   *
   * @emits {volumes: Array<Object<producer: Producer, volume: Number>>} volumes
   * @emits silence
   */
  new ({ ...params }: any);
}
