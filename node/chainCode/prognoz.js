import aes256 from 'aes256';
import Transaction from '../transaction';
import Moderator from './moderator';
import DB from '../db/index';
import { getPublicFromPrivate } from '../wallet/wallet';
import { calctimeFrame } from '../helper/time';

const txsDB = DB.getInstance('txs');
const txName = 'prognoz';

/**
 * Транзакции типа "prognoz"
 * @class
 */
class Prognoz extends Transaction {
  /**
   * Сохранение транзакций типа 'prognoz'
   * @async
   */
  async saveTX() {
    super.saveTX();
  }

  async checkTX() {
    await super.checkTX();
    switch (this.data.action) {
      case 'public':
        if (await Moderator.isComplience(this.from) === null) {
          throw new Error('Нет прав на публикацию');
        }
        await this.inLimit();
        // TODO: checkFields
        break;
      case 'private':
        if (await Moderator.isComplience(this.from) === null) {
          throw new Error('Нет прав на публикацию');
        }
        await this.inLimit();
        // TODO: checkFields
        break;
      case 'open':
        await Moderator.isModerator(this.from);
        // TODO: checkFields
        break;
      default:
        break;
    }
  }

  async inLimit() {
    const timeFrame = calctimeFrame(this.timestamp);
    let i = 0;
    i = await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if ((data.value.data.action === 'private' || data.value.data.action === 'public')
              && data.value.from === this.from) {
              if (data.value.timestamp <= timeFrame.end
                 && data.value.timestamp >= timeFrame.start) {
                i += 1;
              }
            }
          }
        })
        .on('end', () => {
          resolve(i);
        });
    }));

    if (i >= 10) {
      throw new Error('Превыше суточный лимит');
    }
  }

  static toCryptTip(tip, _salt, pk) {
    const salt = _salt || '';
    const result = aes256.encrypt(pk, tip + salt);

    return result;
  }

  static async getAllPublic(_time) {
    const time = _time || 0;
    const publicTips = [];
    return new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.matchDate > time && data.value.data.action === 'public') {
              publicTips.push(data.value);
            }
          }
        })
        .on('end', () => {
          resolve(publicTips);
        });
    });
  }

  static async getAllPrivateWithoutOpen(_time) {
    const time = _time || 0;
    let privateTips = [];

    privateTips = await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.matchDate > time && data.value.data.action === 'private') {
              privateTips.push(data.value);
            }
          }
        })
        .on('end', () => {
          resolve(privateTips);
        });
    }));

    await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === 'open') {
              for (let i = 0; i < privateTips.length; i += 1) {
                if (privateTips[i].hash === data.value.data.href) {
                  privateTips.splice(i, 1);
                  i -= 1;
                }
              }
            }
          }
        })
        .on('end', () => {
          resolve(privateTips);
        });
    }));

    return privateTips;
  }

  static async getAllByUser(address) {
    const tips = [];
    return new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.from === address) {
              tips.push(data.value);
            }
          }
        })
        .on('end', () => {
          resolve(tips);
        });
    });
  }

  static async decryptTip(hash) {
    const open = await txsDB.get(hash);
    const tip = await txsDB.get(open.data.href);
    const salt = aes256.decrypt(open.data.privKey, tip.data.cryptoSalt);
    const result = aes256.decrypt(open.data.privKey, tip.data.cryptoTipAndSalt).replace(salt, '');

    return {
      salt,
      tip: result,
    };
  }

  static async getOpenByPrivate(hash) {
    const result = await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === 'open') {
              if (data.value.data.href === hash) {
                resolve(data.value.hash);
              }
            }
          }
        })
        .on('end', () => {
          resolve('');
        });
    }));
    return result;
  }

  static async genTX(from, publicKey, params) {
    const data = {};
    data.type = params.type;
    data.action = params.action;

    switch (params.action) {
      case 'public':
        data.matchDate = params.matchDate;
        data.game = params.game;
        data.gameType = params.gameType;
        data.tip = params.tip;
        break;
      case 'private':
        data.matchDate = params.matchDate;
        data.gameType = params.gameType;
        data.game = params.game;
        data.cryptoTipAndSalt = Prognoz.toCryptTip(params.tip, params.salt, params.privKey);
        data.cryptoSalt = Prognoz.toCryptTip(params.salt, null, params.privKey);
        data.pubKey = (getPublicFromPrivate(`0x${params.privKey}`)).toString('hex');
        break;
      case 'open':
        data.href = params.href;
        data.salt = params.salt;
        data.privKey = params.privKey;
        break;
      default:
        break;
    }

    const tx = new Prognoz(
      null,
      from,
      data,
      publicKey,
    );

    return tx;
  }
}

export default Prognoz;
