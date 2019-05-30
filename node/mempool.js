/**
 * @typedef {Object} Transaction
 * @property {string} obj.hash
 * @property {string} obj.from
 * @property {Object} obj.data
 * @property {string} obj.publicKey
 * @property {string} obj.signature
 */

let transactions = {};

const BLOCK_SIZE = 4000;

/**
 * Функции для работы с Mempool'ом
 * @class
 */
class Mempool {
  /**
   * Добавление транзакции в мемпул
   *
   * @param {Transaction} transaction
   */
  static addTransaction(transaction) {
    transactions[transaction.hash] = transaction;
  }

  /**
   * Проверка транзакции
   *
   * @param {Transaction} tx - проверяемая транзакция
   * @param {boolean} isMine - транзакция создана на данном устройстве?
   */
  static async checkTransaction(transaction, isMine) {
    if (Mempool.alreadyInMempool(transaction.hash)) {
      throw Error(`Transaction with hash ${transaction.hash} already in mempool!`);
    }

    if (!isMine) {
      await transaction.checkTX();
    }
  }

  /**
   * Список текущих транзакций в мемпуле.
   * @returns {Transaction[]}
   */
  static getTransactions() {
    return Object.values(transactions);
  }

  /**
   * Задать список транзакций в мемпуле
   * @param {Transaction[]} txs
   */
  static setMempool(txs) {
    transactions = txs;
  }

  /**
   * Сбор массива транзакций для нового блока
   *
   * @returns {Transaction[]}
   */
  static getTransactionsForBlock() {
    const txsArray = Mempool.getTransactions();
    const toForge = txsArray.splice(
      0,
      BLOCK_SIZE,
    );

    return toForge;
  }

  /**
   * Удаление транзакций из mempool
   * @param {Transaction[]} _transactions - список удаляемых транзакций
   */
  static async removeTransactions(_transactions) {
    return new Promise((resolve) => {
      _transactions.forEach((tx) => {
        Mempool.removeTransaction(tx.hash);
      });

      resolve();
    });
  }

  /**
   * Удаление транзакции из мемпула (с учетом обновления кэша)
   * @param {string} tx
   */
  static removeTransaction(hash) {
    delete transactions[hash];
  }

  static alreadyInMempool(hash) {
    return transactions[hash];
  }
}

export default Mempool;
