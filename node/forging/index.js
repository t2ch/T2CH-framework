import getTimeInSec from '../helper/time';
import Mempool from '../mempool';
import Block from '../block';
import Coin from '../chainCode/coin';
import Transaction from '../transaction';
import Peer from '../p2p/Peer';

let forging = false;
let forgingTimerId;
let forgerAddress;
let forgerPubKey;
let forgerPrivKey;

class Forging {
  /**
   * @param {string} genSig
   *
   * @returns {number}
   */
  static getHit(genSig) {
    return parseInt(genSig.substr(0, 12), 16);
  }

  /**
   * Генерация 'target' для конкретного майнера
   *
   * @param {string} address - адрес форжера
   * @param {Block} lastBlock - последний блок
   *
   * @return {Promise}
   */
  static async getTarget(address, lastBlock) {
    const prevTarget = lastBlock.baseTarget;
    const elapsedTime = getTimeInSec() - lastBlock.timestamp;

    const balance = await Coin.getBalance(address);
    console.log(`Balance: ${balance}`);
    console.log(`prevBaseTarget: ${prevTarget}`);

    const target = prevTarget * balance * elapsedTime;

    return target;
  }

  /**
   * @param {string} address
   * @param {string} pub
   */
  static enableForge(_address, _pub, _privKey) {
    if (forgingTimerId) {
      clearTimeout(forgingTimerId);
      forgingTimerId = null;
    }

    let address = _address;
    let pub = _pub;
    let privKey = _privKey;
    if (!address || !pub) {
      if (!forgerAddress || !forgerPubKey || !forgerPrivKey) {
        return;
      }

      address = forgerAddress;
      pub = forgerPubKey;
      privKey = forgerPrivKey;
    }

    forging = true;

    Forging.forge(address, pub, privKey);
  }

  /**
  * Остановка майнинга
  */
  static stopForge() {
    clearTimeout(forgingTimerId);

    forging = false;
  }

  /**
   * Запуск майнинга. Майнинг возможен на любом кошельке, чей публичный ключ Вы знаете.
   * @async
   * @param {string} address - адрес майнера
   * @param {string} pub - публичный ключ майнера
   *
   * @returns {Promise}
   */
  static async forge(_address, _pub, privKey) {
    if (!forging) {
      return;
    }

    const latestBlock = Block.getLatestBlock();
    const targetPerSec = await Forging.getTarget(_address, latestBlock);
    if (targetPerSec <= 0) {
      console.log('You can\'t mine with zero balance!');

      Forging.stopForge();

      return;
    }

    const timestamp = getTimeInSec();
    const currTarget = targetPerSec * (timestamp - latestBlock.timestamp);
    console.log(`target: ${currTarget}`);

    const genSig = Block.getGenSignature(_pub);
    const hit = Forging.getHit(genSig);
    console.log(`hit${hit}`);

    // Время для майнинга в сек
    const genTime = currTarget < hit ? ((hit - currTarget) / targetPerSec) + 1 : 0;
    console.log(`Блок сгенерируется через ${genTime} сек`);

    forgingTimerId = setTimeout(async () => {
      const newTimestamp = getTimeInSec();
      const maxTarget = Math.min(2 * latestBlock.baseTarget, Block.maxBaseTarget);
      const minTarget = Math.max(Math.floor(latestBlock.baseTarget / 2), 1);
      const delta = newTimestamp - latestBlock.timestamp;
      const candidate = Math.floor(latestBlock.baseTarget * delta / 10);
      const baseTarget = Math.min(Math.max(minTarget, candidate), maxTarget);

      const transactions = Mempool.getTransactionsForBlock();
      console.log(`Насобирали ${transactions.length} транзакций`);

      const block = Block.generateNextBlock(
        transactions,
        baseTarget,
        _address,
        genSig,
        _pub,
      );
      await block.sign(privKey.substring(2));
      await Block.isValidNextBlock(block, latestBlock);

      Transaction.saveTXs(transactions);
      console.log('Транзакции сохранены');

      Block.setLastBlock(block);
      block.saveBlock();
      console.log('Блок сохранен');

      Mempool.removeTransactions(transactions);

      Peer.sendBlock(block);
      console.log('Блок отправлен');

      setTimeout(() => {
        Forging.forge(_address, _pub, privKey);
      }, 1000);
    }, genTime * 1000);
  }
}

export default Forging;
