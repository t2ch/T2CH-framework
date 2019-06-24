import Transaction from '../transaction';
import { isValidAddress } from '../wallet/wallet';
import DB from '../db/index';

const unspInpDB = DB.getInstance('unspInp');
const txName = 'coin';

/**
 * Транзакции типа "coin"
 * @class
 */
class Coin extends Transaction {
  /**
   * Сохранение транзакций типа 'coin'
   * @async
   */
  async saveTX() {
    super.saveTX();

    this.saveUnspentInputs();
  }

  async saveUnspentInputs() {
    // удаляем использованные инпуты
    const { inputs, outputs } = this.data;

    inputs.forEach((input) => {
      const key = `${txName}_${this.from}_${input.txHash}_${input.index}`;
      unspInpDB.del(key);
    });

    // сохраняем новые неиспользованные инпуты
    outputs.forEach((output, index) => {
      const unspInp = {
        txHash: this.hash,
        index,
        amount: output.amount,
      };
      const key = `${txName}_${output.address}_${this.hash}_${index}`;
      unspInpDB.put(key, unspInp);
    });
  }

  /**
   * Проверка на двойную трату
   *
   * @returns {boolean}
   */
  async checkDoubleWaste() {
    const checks = [];
    const { inputs } = this.data;
    inputs.forEach((input) => {
      const key = `${txName}_${this.from}_${input.txHash}_${input.index}`;
      checks.push(unspInpDB.get(key)); // проверяем, не использован ли input
    });

    try {
      await Promise.all(checks);
    } catch (e) {
      throw new Error('Attempt to double waste of coins!');
    }
  }

  /**
   * Проверка на соответствие входящих и исходящих транзакций
   */
  isInputsMore() {
    if (this.inputTotal < this.outputTotal) {
      throw new Error('Inputs must be greater than or equal to outputs!');
    }
  }

  /**
   * Проверка на двойную трату внутри одного блока, при его формировании
   *
   * @param {Coin[]} otherTxs
   * @returns {boolean}
   */
  // TODO: оптимизировать через поиск ключ-значениие
  canBeInOneBlock(otherTxs) {
    for (let i = 0; i < otherTxs.length; i += 1) {
      let flag = false;
      if (otherTxs[i].hash !== this.hash) {
        const result = [];
        for (let k = 0; k < otherTxs[i].data.inputs.length; k += 1) {
          for (let s = 0; s < this.data.inputs.length; s += 1) {
            if (otherTxs[i].data.inputs[k].txHash === this.data.inputs[s].txHash
              && otherTxs[i].data.inputs[k].index === this.data.inputs[s].index) {
              result.push(otherTxs[i].data.inputs[k]);
            }
          }
        }
        if (result.length > 0) { flag = true; }
      }
      if (flag) { return false; }
    }

    return true;
  }

  /**
   * Проверка валидности транзакции
   * @async
   */
  async checkTX() {
    await super.checkTX();

    this.isInputsMore();
    await this.checkDoubleWaste();
  }

  /**
   * Функция генерации транзакции
   *
   * @param {string} from
   * @param {string} publicKey
   * @param {Object} params
   * @param {string} params.type
   * @param {string} params.recipient
   * @param {number} params.amount
   *
   * @returns {Coin}
   */
  static async genTX(from, publicKey, params) {
    const { inputs, remainder } = await Coin.formInputs(from, params.amount);
    const outputs = Coin.formOutputs(from, params.recipient, params.amount, remainder);

    const data = {
      type: params.type,
      inputs,
      outputs,
    };

    const tx = new Coin(
      null,
      from,
      data,
      publicKey,
    );

    return tx;
  }

  static async formInputs(from, amount) {
    const inputs = [];
    let sum = 0;
    const unspentInputs = await Coin.getUnspentInputs(from);
    for (let i = 0; sum < amount && i < unspentInputs.length; i += 1) {
      const unspInput = unspentInputs[i];

      sum += unspInput.amount;
      inputs.push(unspInput);
    }

    const remainder = sum - amount;
    if (remainder < 0) {
      throw new Error('You don\'t have enough money');
    }

    return {
      inputs,
      remainder,
    };
  }

  static formOutputs(from, to, amount, remainder) {
    const outputs = [];

    const toOutput = {
      address: to,
      amount,
    };

    const backOutput = {
      address: from,
      amount: remainder,
    };
    outputs.push(toOutput, backOutput);

    return outputs;
  }

  /**
   * Список всех транзакций отправителя
   * @param {string} address - адрес отправителя
   * @returns {Promise<Object>}
   */
  static getUnspentInputs(address) {
    const prefix = `${txName}_${address}_`;
    const unspInputs = [];
    return new Promise((resolve) => {
      unspInpDB.createReadStream({
        keys: false,
        values: true,
        gte: prefix,
        lte: `${prefix}\xff`,
      }).on('data', (unspInput) => {
        unspInputs.push(unspInput);
      }).on('end', () => {
        resolve(unspInputs);
      });
    });
  }

  /**
   * Получение баланса coin'ов
   * @async
   * @param {string} address - проверяемый адрес
   * @returns {number} Баланс кошелька
   */
  static async getBalance(address) {
    if (!isValidAddress(address)) {
      throw new Error('getBalance error: invalid address');
    }

    const unspentInputs = await Coin.getUnspentInputs(address);

    return unspentInputs.reduce((balance, input) => balance + Number(input.amount), 0);
  }

  /**
   * Сумма выходящих транзакций
   * @type {number}
   */
  get inputTotal() {
    return this.data.inputs.reduce(
      (total, input) => total + Number(input.amount),
      0,
    );
  }

  /**
   * Сумма исходящих транзакций
   * @type {number}
   */
  get outputTotal() {
    return this.data.outputs.reduce(
      (total, output) => total + Number(output.amount),
      0,
    );
  }

  /**
   * Общее число coin'ов в системе
   * @returns {number}
   */
  static get totalSupply() {
    return 250000000000;
  }
}

export default Coin;
