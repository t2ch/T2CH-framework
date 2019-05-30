import { createHash } from 'crypto';
import { sign, verify } from 'eccrypto';
import { readFileSync } from 'fs';
import merkle from 'merkle';
import getTimeInSec from './helper/time';
import parseTXObj from './helper/parseObj';
import getLastRecord from './helper/db';

import Transaction from './transaction';
import Coin from './chainCode/coin';
import DB from './db';

const blockDB = DB.getInstance('blocks');
const blockHashesDB = DB.getInstance('blocksHashes');

const genesisPath = './genesis.json';

/**
 * @type {Block}
 */
let latestBlock = null;

/**
 * @class
 */
class Block {
  /**
   * @constructor
   *
   * @param {string} hash хэш блока
   * @param {number} index номер блока
   * @param {string} previousHash хэш предыдущего
   * @param {number} timestamp время создания
   * @param {Transaction[]} txs транзакции
   * @param {number} baseTarget
   * @param {string} generator
   * @param {string} genSig generation signature
   * @param {number} cumulativeDifficulty сложность блока
   * @param {string} publicKey публичный ключ
   */
  constructor(
    hash,
    index,
    previousHash,
    timestamp,
    txs,
    baseTarget,
    merkleRoot,
    signature,
    generator,
    genSig,
    cumulativeDifficulty,
    publicKey,
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp || getTimeInSec();
    this.txs = txs;
    this.baseTarget = baseTarget;
    this.generationSignature = genSig;
    this.cumulativeDifficulty = cumulativeDifficulty;
    this.generator = generator;
    this.publicKey = publicKey;
    this.merkleRoot = merkleRoot;

    if (signature) {
      this.signature = signature;
      this.hash = hash || this.genBlockHash();
    }
  }

  /**
   * Сохранение блока в store
   * @async
   */
  async saveBlock() {
    await Promise.all([
      blockDB.put(this.hash, this),
      blockHashesDB.put(this.index, this.hash),
    ]);
  }

  /**
   * Генерация нового блока
   *
   * @param {Transaction[]} txs - массив транзакций блока
   * @param {number} baseTarget
   * @param {string} generator - адрес кошелька майнера
   * @param {string} genSig
   * @param {string} publicKey - публичный ключ майнера
   *
   * @returns {Block}
   */
  static generateNextBlock(txs, baseTarget, generator, genSig, publicKey) {
    const nextIndex = latestBlock.index + 1;
    const previousHash = latestBlock.hash;

    const nextBlock = new Block(
      null,
      nextIndex,
      previousHash,
      null,
      txs,
      baseTarget,
      null,
      null,
      generator,
      genSig,
      Math.floor(
        latestBlock.cumulativeDifficulty + 18446744073709551616 / baseTarget,
      ), // 2^64/baseTarget,
      publicKey,
    );

    return nextBlock;
  }

  /**
   * Получение генезисного блока по заданной конфигурации
   *
   * @returns {Block}
   */
  static getGenesisBlock() {
    let genBlock;
    try {
      genBlock = JSON.parse(readFileSync(genesisPath, 'utf8'));
    } catch (e) {
      throw Error("Can't open genesis.json!");
    }

    const genesisBlock = new Block(
      genBlock.hash,
      genBlock.index,
      genBlock.previousHash,
      genBlock.timestamp,
      genBlock.txs,
      genBlock.baseTarget,
      genBlock.merkleRoot,
      genBlock.signature,
      genBlock.generator,
      genBlock.generationSignature,
      genBlock.cumulativeDifficulty,
      genBlock.publicKey,
    );

    return genesisBlock;
  }

  /**
   * Десериализация сообщения типа 'блок' от узла
   * @async
   *
   * @param {Object} block - сериализованный блок
   * @param {string} block.hash
   * @param {number} block.index
   * @param {string} block.previousHash
   * @param {number} block.timestamp
   * @param {Transaction[]} block.txs,
   * @param {number} block.baseTarget
   * @param {string} block.generator
   * @param {string} block.generationSignature
   * @param {number} block.cumulativeDifficulty
   * @param {string} block.publicKey
   *
   * @returns {Block}
   */
  static parseBlock(block) {
    const txs = [];
    block.txs.forEach((tx) => {
      txs.push(parseTXObj(tx));
    });

    return new Block(
      block.hash,
      block.index,
      block.previousHash,
      block.timestamp,
      txs,
      block.baseTarget,
      block.merkleRoot,
      block.signature,
      block.generator,
      block.generationSignature,
      block.cumulativeDifficulty,
      block.publicKey,
    );
  }

  /**
  * Удаление блоков
  * @async
  *
  * @param {Block[]} blocks - массив удаляемых блоков
  */
  static async deleteBlocks(blocks) {
    blocks.forEach((block) => {
      blockHashesDB.del(block.index);
      blockDB.del();

      Transaction.deleteTransactions(block.txs);
    });
  }

  /**
   * Подсчет хэша блока
   *
   * @returns {string} хэш блока
   */
  genBlockHash() {
    const toHash = {
      index: this.index,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      baseTarget: this.baseTarget,
      generationSignature: this.generationSignature,
      cumulativeDifficulty: this.cumulativeDifficulty,
      generator: this.generator,
      merkleRoot: this.merkleRoot,
      signature: this.signature,
    };

    const str = JSON.stringify(toHash);

    return createHash('sha256')
      .update(str)
      .digest('hex');
  }

  static getOrderedTXSHashes(txs) {
    const data = [];
    txs.forEach((tx) => {
      data.push(tx.hash);
    });

    return data.sort();
  }

  static getMerkleRoot(txs) {
    const tree = merkle('sha256', false).sync(txs);

    return tree.root();
  }

  async sign(privateKey) {
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    const orderedTXs = Block.getOrderedTXSHashes(this.txs);
    const merkleRoot = Block.getMerkleRoot(orderedTXs);

    this.merkleRoot = merkleRoot || '0';

    const toSign = {
      index: this.index,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      baseTarget: this.baseTarget,
      generationSignature: this.generationSignature,
      cumulativeDifficulty: this.cumulativeDifficulty,
      generator: this.generator,
      publicKey: this.publicKey,
    };
    const str = JSON.stringify(toSign);

    const msg = createHash('sha256')
      .update(str)
      .digest();

    this.signature = (await sign(privateKeyBuffer, msg)).toString('hex');

    this.hash = this.genBlockHash();
  }

  async verifySign() {
    const toVerify = {
      index: this.index,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      baseTarget: this.baseTarget,
      generationSignature: this.generationSignature,
      cumulativeDifficulty: this.cumulativeDifficulty,
      generator: this.generator,
      publicKey: this.publicKey,
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
        verifySign error: Block signature is invalid!
        ${e}
      `);
    }
  }

  verifyMerkle() {
    const orderedTXS = Block.getOrderedTXSHashes(this.txs);
    const merkleRoot = Block.getMerkleRoot(orderedTXS) || '0';

    if (merkleRoot !== this.merkleRoot) {
      throw new Error(`
        verifyMerkle error: Invalid merkle root!
        block merkleRoot ${this.merkleRoot} != generated merkle root ${merkleRoot}
      `);
    }
  }

  /**
   * Проверка 'Generation signature' блока
   */
  async verifyGenerationSignature() {
    const genSig = createHash('sha256')
      .update(latestBlock.generationSignature + this.publicKey)
      .digest('hex');

    if (genSig !== this.generationSignature) {
      throw new Error(`
        verifyGenerationSignature error: Invalid generation signature! 
        Valid gen sig(${genSig}) != New block gen sig(${this.generationSignature})`);
    }

    const hit = parseInt(genSig.substr(0, 12), 16);
    const balance = await Coin.getBalance(this.generator);

    const target = latestBlock.baseTarget
      * (this.timestamp - latestBlock.timestamp)
      * balance;

    if (target <= hit) {
      throw new Error(`
        verifyGenerationSignature error: Target less than or equal hit!
        Target(${target}) <= Hit(${hit})
      `);
    }
  }

  /**
   * Проверка валидности блока
   * @async
   *
   * @param {Block} nextBlock - новый блок
   * @param {Block} previousBlock - текущий блок
   */
  static async isValidNextBlock(nextBlock, previousBlock) {
    if (previousBlock.index + 1 !== nextBlock.index) {
      throw new Error(`
        isValidNextBlock error: Next block index is invalid!
        Previous index(${previousBlock.index}) + 1 != Next block index(${nextBlock.index})
      `);
    }

    const calculatedHash = nextBlock.genBlockHash();
    if (calculatedHash !== nextBlock.hash) {
      throw new Error(`
        isValidNextBlock error: Calculated block hash and hash in block are not equal!
        Calculated hash(${calculatedHash}) != Block hash(${nextBlock.hash})
      `);
    }

    if (previousBlock.hash !== nextBlock.previousHash) {
      throw new Error(`
        isValidNextBlock error: Previous hash of next block is not equal hash of previous block!
        Previous hash(${previousBlock.hash}) != Next block previous hash(${nextBlock.previousHash})
      `);
    }

    const curTime = getTimeInSec();
    if (nextBlock.timestamp > curTime + 5) {
      throw new Error(`
        isValidNextBlock error: Block from the future? Or maybe your current time is invalid
        Next block timestamp(${nextBlock.timestamp}) > Your current time(${curTime})
      `);
    }

    if (nextBlock.timestamp < previousBlock.timestamp) {
      throw new Error(`
        isValidNextBlock error: Next block timestamp less than previous block timestamp!
        Next block timestamp(${nextBlock.timestamp}) < Previous block timestamp(${previousBlock.timestamp})
      `);
    }

    await nextBlock.verifyMerkle();
    await nextBlock.verifySign();
    await nextBlock.verifyGenerationSignature();
  }

  /**
   * Обновление последнего блока в памяти процесса
   *
   * @param {Block} block
   */
  static setLastBlock(block) {
    latestBlock = block;
  }

  /**
   * Получение последнего блока из памяти процесса
   *
   * @returns {Block}
   */
  static getLatestBlock() {
    return latestBlock;
  }

  /**
   * Получение блока по его хэшу
   * @async
   *
   * @param {string} hash - хэш запрашиваемого блока
   *
   * @returns {Block}
   */
  static async getBlockByHash(hash) {
    const block = await blockDB.get(hash);

    return block;
  }

  /**
   * Получение блока по хэшу транзакции, содержащейся в нем
   * @async
   *
   * @param {string} txHash - хэш транзакции
   *
   * @returns {Promise}
   */
  static getBlockByTxHash(txHash) {
    return new Promise((resolve) => {
      blockDB.createReadStream({})
        .on('data', (block) => {
          const blockData = block.value;
          const blockTxs = blockData.txs;

          blockTxs.forEach(async (tx) => {
            if (tx.hash === txHash) {
              resolve(block);
            }
          });
        })
        .on('end', () => {
          resolve('Block not found!');
        });
    });
  }

  /**
   * Список все доступных блоков
   * @async
   *
   * @returns {Promise}
   */
  static async getAllBlocks() {
    let blocks = [];

    const formPromises = new Promise((resolve) => {
      blockHashesDB.createReadStream({
        keys: false,
        value: true,
      }).on('data', (hash) => {
        blocks.push(blockDB.get(hash));
      }).on('end', () => {
        resolve();
      });
    });

    await formPromises;
    blocks = await Promise.all(blocks);

    return blocks;
  }

  /**
   * Проверка на наличие генезисного блока в структуре блокчейна
   * @async
   *
   * @returns {Promise}
   */
  static async initLatestBlock() {
    const lastBlockHash = await getLastRecord(blockHashesDB);

    if (!lastBlockHash) {
      const genesisBlock = Block.getGenesisBlock();
      await blockDB.put(genesisBlock.hash, genesisBlock);
      await blockHashesDB.put(
        genesisBlock.index,
        genesisBlock.hash,
      );

      const genesisTX = parseTXObj(genesisBlock.txs[0]);
      genesisTX.saveTX();

      Block.setLastBlock(genesisBlock);

      return;
    }

    const lastBlock = await blockDB.get(lastBlockHash);
    Block.setLastBlock(lastBlock);
  }

  /**
   * Создание 'Generation signature' по публичному ключу
   *
   * @param {string} pub - публичный ключ
   *
   * @returns {string}
   */
  static getGenSignature(pub) {
    return createHash('sha256')
      .update(latestBlock.generationSignature + pub)
      .digest('hex');
  }

  /**
   * Начальное значение base target
   *
   * @type {number}
   */
  static get initialBaseTarget() {
    return 153722867;
  }

  /**
   * Начальное количество монет
   *
   * @type {number}
   */
  static get initialCoinAmount() {
    return Coin.totalSupply;
  }

  /**
   * Максимальное значение base target
   *
   * @type {number}
   */
  static get maxBaseTarget() {
    return Block.initialCoinAmount * Block.initialBaseTarget;
  }
}

export default Block;
