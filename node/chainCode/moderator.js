import Transaction from '../transaction';
import Block from '../block';
// import { isValidAddress } from '../wallet/wallet';
import DB from '../db/index';

const unspInpDB = DB.getInstance('unspInp');
const txsDB = DB.getInstance('txs');
const txName = 'moder';

/**
 * Транзакции типа "coin"
 * @class
 */
class Moderator extends Transaction {
  /**
   * Сохранение транзакций типа 'moderator'
   * @async
   */
  async saveTX() {
    super.saveTX();
    if (this.data.action === 'vote') { this.saveVotesAsInputs(); }
  }

  saveVotesAsInputs() {
    // сохраняем голоса
    const vote = {
      txHash: this.hash,
      from: this.from,
    };
    const key = `${txName}_${this.data.input}_${this.from}`;
    unspInpDB.put(key, vote);
  }

  /**
   * Проверка валидности транзакции
   * @async
   */
  async checkTX() {
    await super.checkTX();
    await Moderator.isModerator(this.from);
    if (this.data.action === 'vote') {
      await this.hasInVoteList();
      await this.isDoubleVote();
      await this.isFullVoteList();
    } else { this.isDoubleAddOrRemove(); }
  }

  async hasInVoteList() {
    const msg = 'Нет права голоса в данном голосовании';
    try {
      const vote = await txsDB.get(this.data.input);
      let flag = false;

      vote.data.votersList.forEach((voter) => {
        if (voter === this.from) { flag = true; }
      });

      if (!flag) {
        throw new Error(msg);
      }
    } catch (e) {
      if (e.message !== msg) {
        throw new Error('Некорректная ссылка на голосование');
      } else throw Error(msg);
    }
  }

  async isDoubleVote() {
    const msg = 'Попытка повторного голосования';
    try {
      const input = await unspInpDB.get(`${txName}_${this.data.input}_${this.from}`);

      if (input.from === this.from) {
        throw new Error(msg);
      }
    } catch (e) {
      if (e.message === msg) {
        throw new Error(msg);
      }
    }
  }

  async isFullVoteList() {
    const errMsg = 'Некорректное число голосующих';
    const vote = await txsDB.get(this.data.input);
    const allModersAtMoment = await Moderator.getAllModerators();
    try {
      if (allModersAtMoment.length !== vote.data.votersList.length) {
        throw new Error(errMsg);
      } else {
        let dif = [];
        dif = allModersAtMoment.filter(i => vote.data.votersList.indexOf(i) < 0);
        if (dif.length > 0) {
          throw new Error(errMsg);
        }
      }
    } catch (e) {
      if (e.message !== errMsg) { throw new Error(e); }
    }
  }

  async isDoubleAddOrRemove() {
    return new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === this.data.action
              && data.value.data.address === this.data.address) {
              resolve(true);
            }
          }
        })
        .on('end', () => resolve(false));
    });
  }

  /**
   * Назначим по дефолту модератором адрес из генезисного блока.
   * Позднее, при необоходимости, его можно будет лишить модераторских прав.
   *
   * @returns {string} - genesis user address;
   */
  static getDefaultModerator() {
    return Block.getGenesisBlock().txs[0].from;
  }

  static async isModerator(address) {
    let result = false;
    if (Moderator.getDefaultModerator() === address) { result = true; }

    let initVote = {};
    initVote.removeVote = '';
    initVote.addVote = '';

    initVote = await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.address === address) {
              if (data.value.data.action === 'add') {
                initVote.addVote = {
                  from: data.value.from,
                  action: data.value.data.action,
                  hash: data.value.hash,
                  votersList: data.value.data.votersList,
                };
                resolve(initVote);
              } else if (data.value.data.action === 'remove') {
                initVote.removeVote = {
                  from: data.value.from,
                  action: data.value.data.action,
                  hash: data.value.hash,
                  votersList: data.value.data.votersList,
                };
                resolve(initVote);
              }
            }
          }
        })
        .on('end', () => resolve(initVote));
    }));

    let removeCount = 0; let
      addCount = 0;

    await (new Promise((resolve) => {
      unspInpDB.createReadStream({})
        .on('data', (data) => {
          if (initVote.removeVote !== '') {
            if (data.key === `${txName}_${initVote.removeVote.hash}_${initVote.removeVote.from}`) { removeCount += 1; }
          }
          if (initVote.addVote !== '') {
            if (data.key === `${txName}_${initVote.addVote.hash}_${initVote.addVote.from}`) { addCount += 1; }
          }
        })
        .on('end', () => resolve());
    }));

    if (initVote.addVote !== '') {
      if (addCount >= Math.ceil(initVote.addVote.votersList.length / 2)) { result = true; }
    }

    if (initVote.removeVote !== '') {
      if (removeCount >= Math.ceil(initVote.removeVote.votersList.length / 2)) { result = false; }
    }

    if (!result) { throw new Error(`${address} нужны права модератора для совершения данной транзакции!`); }
  }

  static async getAllModerators() {
    const tryToAdd = [];
    const tryToRemove = [];

    await (new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === 'add') {
              tryToAdd.push({
                from: data.value.from,
                address: data.value.data.address,
                action: data.value.data.action,
                hash: data.value.hash,
                votersList: data.value.data.votersList,
                votes: 0,
              });
            } else if (data.value.data.action === 'remove') {
              tryToRemove.push({
                from: data.value.from,
                address: data.value.data.address,
                action: data.value.data.action,
                hash: data.value.hash,
                votersList: data.value.data.votersList,
                votes: 0,
              });
            }
          }
        })
        .on('end', () => resolve());
    }));

    await (new Promise((resolve) => {
      unspInpDB.createReadStream({})
        .on('data', (data) => {
          const len = tryToAdd.length >= tryToRemove.length ? tryToAdd.length : tryToRemove.length;
          for (let i = 0; i < len; i += 1) {
            if (i < tryToRemove.length) {
              if (data.key.substring(0, txName.length + 1 + tryToRemove[i].hash.length) === `${txName}_${tryToRemove[i].hash}`) {
                tryToRemove[i].votes += 1;
              }
            }
            if (i < tryToAdd.length) {
              if (data.key.substring(0, txName.length + 1 + tryToAdd[i].hash.length) === `${txName}_${tryToAdd[i].hash}`) {
                tryToAdd[i].votes += 1;
              }
            }
          }
        })
        .on('end', () => resolve());
    }));

    const moderList = [Moderator.getDefaultModerator()];

    tryToAdd.forEach((moder) => {
      if (Math.ceil(moder.votersList.length / 2) <= moder.votes) {
        let flag = false;
        tryToRemove.forEach((removed) => {
          if (Math.ceil(removed.votersList.length / 2) <= removed.votes
            && removed.address === moder.address) {
            flag = true;
          }
        });
        if (!flag) { moderList.push(moder.address); }
      }
    });

    return moderList;
  }

  static async isComplience(address) {
    return new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === 'compliance') {
              if (data.value.data.address === address) {
                resolve(data.value.data.login);
              }
            }
          }
        })
        .on('end', () => {
          resolve(null);
        });
    });
  }

  static async getAllComplience() {
    const verifedUsers = [];
    return new Promise((resolve) => {
      txsDB.createReadStream({})
        .on('data', (data) => {
          if (data.value.data.type === txName) {
            if (data.value.data.action === 'compliance') {
              verifedUsers.push({
                address: data.value.data.address,
                login: data.value.data.login,
              });
            }
          }
        })
        .on('end', () => {
          resolve(verifedUsers);
        });
    });
  }

  static async genTX(from, publicKey, params) {
    const data = {};
    data.type = params.type;
    data.action = params.action;

    switch (params.action) {
      case 'add':
        data.address = params.address;
        data.votersList = await Moderator.getAllModerators();
        break;
      case 'remove':
        data.address = params.address;
        data.votersList = await Moderator.getAllModerators();
        break;
      case 'vote':
        data.input = params.refHash;
        break;
      case 'compliance':
        data.address = params.address;
        data.login = params.login;
        break;
      default:
        throw new Error('Некорретный экшн');
    }

    const tx = new Moderator(
      null,
      from,
      data,
      publicKey,
    );

    return tx;
  }
}

export default Moderator;
