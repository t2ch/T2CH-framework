let instance = null;

/**
 * Работа со статусом
 * @class
 */
class Status {
  constructor() {
    if (!instance) {
      instance = this;
      this.status = 'ready';
    }
    return instance;
  }

  /**
   * Получение состояния
   *
   * @type {string}
   */
  get state() {
    return this.status;
  }

  /**
   * Установка состояния
   *
   * @param {string} newState новое состояние
   */
  set state(newState) {
    console.log(`####DEBUG state switched to ${newState}`);
    this.status = newState;
  }
}

export default Status;
