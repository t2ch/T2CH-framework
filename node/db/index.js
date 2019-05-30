import level from 'level';
import charwise from 'charwise';
import factory from 'lexicographic-integer-encoding';
import { existsSync, mkdirSync } from 'fs';

if (!existsSync('./store')) {
  mkdirSync('./store');
}

const lexint = factory('hex');
const singletonEnforcer = Symbol('s');

class DB {
  /**
   * @callback onData
   * @param {*} data
   * @param {function} resolve
   * @param {function} reject
   *
   * @returns {void}
   */

  /**
   * @callback onEnd
   * @param {function} resolve
   *
   * @returns {void}
   */

  /**
   * @constructor
   *
   * @param {symbol} enforcer
   * @param {string} dbName
   */
  constructor(enforcer, dbName) {
    if (enforcer !== singletonEnforcer) { throw Error('Instantiation failed: use Singleton.getInstance() instead of new.'); }
    // Инициализация в зависимости от имени бд
    if (dbName === 'blocksHashes') {
      this.db = level(`./store/${dbName}`, { keyEncoding: lexint, valueEncoding: 'json' });
    } else {
      this.db = level(`./store/${dbName}`, { keyEncoding: charwise, valueEncoding: 'json' });
    }

    this.dbName = dbName;
  }

  /**
   * @param {Object} options
   * @param {boolean=} options.keys
   * @param {boolean=} options.values
   * @param {*=} options.gte
   * @param {*=} options.lte
   *
   * @returns {ReadableStream}
   */
  createReadStream(options) {
    return this.db.createReadStream(options);
  }

  async get(key) {
    try {
      const res = await this.db.get(key);
      return res;
    } catch (err) {
      throw new Error(`${this.dbName} error: key not found`);
    }
  }

  async put(key, value) {
    await this.db.put(key, value);
  }

  async del(key) {
    await this.db.del(key);
  }

  /**
   *
   * @param {string} dbName
   *
   * @returns {DB}
   */
  static getInstance(dbName) {
    if (!this[dbName]) {
      this[dbName] = new DB(singletonEnforcer, dbName);
    }
    return this[dbName];
  }
}

export default DB;
