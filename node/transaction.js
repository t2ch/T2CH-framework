import { sign, verify } from 'eccrypto';
import { createHash } from 'crypto';

import DB from './db';
import Mempool from './mempool';

const txDB = DB.getInstance('txs');

/**
 * Класс транзакции
 * @class
 */
class Transaction {
  /**
   * @constructor
   *
   * @param {string} hash
   * @param {string} from - адрес отправителя
   * @param {Object} data - данные транзакции
   * @param {string} publicKey - публичный ключ отправителя
   * @param {string} signature - подпись
   * @param {number} timestamp - метка создания транзакции
   */
  constructor(
    hash,
    from,
    data,
    publicKey,
    signature,
    timestamp,
  ) {
    this.from = from;
    this.data = data;
    this.publicKey = publicKey;
    this.timestamp = timestamp || Date.now();

    this.signature = signature || null;

    if (!hash) {
      this.hash = hash;
    } else if (this.signature) {
      this.hash = this.genTXHash();
    }
  }

  /**
   * Сохранение транзакции в store
   */
  saveTX() {
    txDB.put(this.hash, this);
  }


  /**
   * Подписание транзакции отправителем
   *
   * @param {string} privateKey - приватный ключ
   */
  async signTX(privateKey) {
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const toSign = {
      from: this.from,
      data: this.data,
      publicKey: this.publicKey,
      timestamp: this.timestamp,
    };
    const str = JSON.stringify(toSign);

    const msg = createHash('sha256')
      .update(str)
      .digest();

    this.signature = (await sign(privateKeyBuffer, msg)).toString('hex');

    this.hash = this.genTXHash();
  }

  /**
   * Проверка подписи транзакции
   */
  async verifyTXSign() {
    const toVerify = {
      from: this.from,
      data: this.data,
      publicKey: this.publicKey,
      timestamp: this.timestamp,
    };

    const str = JSON.stringify(toVerify);

    const msg = createHash('sha256')
      .update(str)
      .digest();

    try {
      await verify(
        Buffer.from(`04${this.publicKey}`, 'hex'),
        msg,
        Buffer.from(this.signature, 'hex'),
      );
    } catch (e) {
      throw new Error(`
        verifyTX error: Transaction signature is invalid!
        ${e}
      `);
    }
  }

  /**
     * Проверка основных полей транзакции
     */
  checkFields() {
    const generatingHash = this.genTXHash();
    if (this.hash !== generatingHash) {
      throw new Error(`
        checkFields error: Transaction hash is not equal generating hash!
        Hash ${this.hash} != Generating hash ${generatingHash}
        `);
    }

    // TODO: Добавить больше проверок общих для всех транзакций полей
  }

  /**
     * Проверка валидности транзакции
     * @async
     */
  async checkTX() {
    this.checkFields();
    await this.verifyTXSign();
  }

  genTXHash() {
    const toHash = {
      from: this.from,
      data: this.data,
      publicKey: this.publicKey,
      signature: this.signature,
    };

    const str = JSON.stringify(toHash);

    return createHash('sha256')
      .update(str)
      .digest('hex');
  }

  /**
   * @param {Transaction[]} txs
   *
   * @returns {Promise}
   */
  static async saveTXs(txs) {
    const saving = [];
    txs.forEach((tx) => {
      const savePromise = new Promise(async (resolve) => {
        if (!Mempool.alreadyInMempool(tx.hash)) {
          await tx.checkTX();
        }
        tx.saveTX();

        resolve();
      });

      saving.push(savePromise);
    });

    await Promise.all(saving);
  }

  /**
   * Функция генерации транзакции
   *
   * @param {string} from
   * @param {string} publicKey
   * @param {Object} params
   * @param {string} params.type
   *
   * @returns {Transaction}
   */
  static async genTX(from, publicKey, params) {
    const tx = new Transaction(
      null,
      from,
      params,
      publicKey,
    );

    return tx;
  }

  /**
   * Удаление транзакции из store
   * @async
   *
   * @param {Transaction[]} transactions - массив удаляемых транзакций
   *
   * @returns {Promise}
   */
  static async deleteTransactions(transactions) {
    transactions.forEach((tx) => {
      txDB.del(tx.hash);

      Mempool.addTransaction(tx);
    });
  }

  static async getTransactions(searchOpts) {
    let resTxs = [];
    if (searchOpts.hash) {
      resTxs = await txDB.get(searchOpts.hash);
      return resTxs;
    }

    return new Promise((resolve) => {
      txDB.createReadStream({
        keys: false,
        values: true,
      }).on('data', (tx) => {
        if (searchOpts.type && tx.data.type !== searchOpts.type) return;
        if (searchOpts.sender && tx.from !== searchOpts.sender) return;

        resTxs.push(tx);
      }).on('end', () => {
        resolve(resTxs);
      });
    });
  }
}

export default Transaction;
