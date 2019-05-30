import messageTypes from './message-type';

const {
  RECEIVE_TX,
  RECEIVE_BLOCKCHAIN,
  RECEIVE_HOSTS,
  RECEIVE_LATEST_BLOCK,
  RECEIVE_MEMPOOL,
  RECEIVE_TEXT,
  REQUEST_BLOCKCHAIN,
  REQUEST_HOSTS,
  REQUEST_LATEST_BLOCK,
  REQUEST_MEMPOOL,
  REQUEST_REVERSE_CONNECTION,
} = messageTypes;
/**
 * Сообщения
 * @class
 */
class Messages {
  /**
   * Сообщение отправки текста
   *
   * @param {string} message текст
   *
   * @returns {{type: number, data: Object}}
   */
  static sendText(message) {
    return {
      type: RECEIVE_TEXT,
      data: {
        message,
      },
    };
  }

  /**
   * Сообщение отправки транзакции
   *
   * @param {Transaction} транзакция
   *
   * @returns {{type: number, data: Object}}
   */
  static sendTX(tx) {
    return {
      type: RECEIVE_TX,
      data: tx,
    };
  }

  /**
   * Сообщение запроса последнего блока
   *
   * @returns {{type: number}}
   */
  static getLatestBlock() {
    return {
      type: REQUEST_LATEST_BLOCK,
    };
  }

  /**
   * Сообщение отправки последнего блока
   *
   * @param {Block} block блок
   *
   * @returns {{type: number, data: Block}}
   */
  static sendLatestBlock(block) {
    return {
      type: RECEIVE_LATEST_BLOCK,
      data: block,
    };
  }

  /**
   * Сообщение запроса блокчейна
   *
   * @returns {{type: number}}
   */
  static getBlockchain() {
    return {
      type: REQUEST_BLOCKCHAIN,
    };
  }

  /**
   * Сообщение отправки блокчейна
   *
   * @param {Array} blockchain блокчейн
   *
   * @returns {{type: number, data: Object}}
   */
  static sendBlockchain(blockchain) {
    return {
      type: RECEIVE_BLOCKCHAIN,
      data: blockchain,
    };
  }

  /**
   * Сообщение запроса хостов
   *
   * @returns {{type: number}}
   */
  static getHosts() {
    return {
      type: REQUEST_HOSTS,
    };
  }

  /**
   * Сообщение отправки хостов
   *
   * @param {Array} hosts хосты
   *
   * @returns {{type: number, data: Array}}
   */
  static sendHosts(hosts) {
    return {
      type: RECEIVE_HOSTS,
      data: hosts,
    };
  }

  /**
   * Сообщение запроса мемпула
   *
   * @returns {{type: number}}
   */
  static getMempool() {
    return {
      type: REQUEST_MEMPOOL,
    };
  }

  /**
   * Сообщение отправки мемпула
   *
   * @param {Array<Transaction>} mempool мемпул
   *
   * @returns {{type: number, data: Array<Transaction>}}
   */
  static sendMempool(mempool) {
    return {
      type: RECEIVE_MEMPOOL,
      data: mempool,
    };
  }

  /**
   * Сообщение запроса обратного подключения
   *
   * @param {string} ip ip адрес
   *
   * @returns {{type: number, data: string}}
   */
  static getReverseConnection(ip) {
    return {
      type: REQUEST_REVERSE_CONNECTION,
      data: ip,
    };
  }
}

export default Messages;
