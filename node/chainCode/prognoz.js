import Transaction from '../transaction';
//import { isValidAddress } from '../wallet/wallet';
//import DB from '../db/index';

//const unspInpDB = DB.getInstance('unspInp');

/**
 * Транзакции типа "coin"
 * @class
 */
class Prognoz extends Transaction {
  /**
   * Сохранение транзакций типа 'coin'
   * @async
   */
  async saveTX() {
    super.saveTX();

    //this.saveUnspentInputs();
  }

  static async genTX(from, publicKey, params) {
    let data;
    data.type = params.type;

    switch (params.action) {
    case 'public': 

        break;
    case 'private': 

        break;
    case 'open': 
        data.href = params.href;
        data.bet = params.bet;
        data.pk = params.pk;
        break;
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