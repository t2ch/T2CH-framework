const EC2 = require('elliptic').ec;
const CryptoJS = require('crypto-js');
const ethCrypto = require('eth-crypto');
const aes256 = require('aes256');

const ec = new EC2('secp256k1');

// TODO:
// export randomBytes

// let XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; //удалить при сборке

class webED {
  /**
   * @param {string} httpNode - url ноды
   * @return {webED}
   */
  constructor(httpNode) {
    this.httpNode = httpNode;
  }

  /**
   * Cоздание нового кошелька
   * @returns {Object} - {PrivateKey, PublicKey, Address}
   */
  createWallet() {
    const key1 = ec.genKeyPair();
    const key2 = ec.genKeyPair();
    const PublicKey = key1.getPublic().add(key2.getPublic());
    const PrivateKey = key1.getPrivate().add(key2.getPrivate());

    const key3 = ec.genKeyPair();
    key3._importPrivate(PrivateKey);

    const key4 = ec.genKeyPair();
    key4._importPublic(PublicKey);

    // privKey
    const priv = toHexString(key3.getPrivate().toArray());

    // public
    const _public = webED.getPublicFromPrivate(priv);

    // address
    const add = webED.getAddressFromPublic(_public);

    return {
      PrivateKey: `0x${priv}`,
      PublicKey: _public,
      Address: add,
    };
  }

  static getPublicFromPrivate(privKey) {
    const keyPair = ec.genKeyPair();
    keyPair._importPrivate(privKey, 'hex');

    return keyPair.getPublic(false, 'hex').slice(2);
  }

  static getAddressFromPublic(pubKey) {
    const pubKeyWordArray = CryptoJS.enc.Hex.parse(pubKey);
    const hash = CryptoJS.SHA3(pubKeyWordArray, { outputLength: 256 });

    return `0x${hash.toString(CryptoJS.enc.Hex).slice(24)}`;
  }

  static privateToAddress(privKey) {
    return webED.getAddressFromPublic(webED.getPublicFromPrivate(privKey));
  }

  /**
   * Создание транакзции для "отправки монет"
   * @param {string} to - кому (адрес)
   * @param {string} amount - количество evocoin'ов
   * @param {string} privateKey - приватный ключ
   * @return {Status}
   */
  async sendCoin(to, amount, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const type = 1;
    const url_prep = `${this.httpNode}/prepare`;
    const url_send = `${this.httpNode}/sendtx`;
    const method = 'POST';

    let tx = await http(url_prep, method, {
      type, from, to, amount,
    });

    tx = JSON.parse(tx);
    tx.pubkey = webED.getPublicFromPrivate(privateKey).toString('hex');

    tx = await webED.signTX(JSON.stringify(tx), privateKey);

    await http(url_send, method, tx);

    return tx;
  }

  /**
   *
   */
  static async signTX(tx, privateKey) {
    if (typeof tx === 'string') tx = JSON.parse(tx);

    if (privateKey[0] === '0' && privateKey[1] === 'x') {
      privateKey = Array.from(privateKey);
      privateKey = privateKey.slice(2, privateKey.length);
      privateKey = privateKey.join('');
    }

    const struct = {
      from: tx.from,
      data: tx.data,
      pubkey: tx.pubkey,
      timestamp: tx.timestamp,
    };
    const str = JSON.stringify(struct);
    const msg = CryptoJS.SHA256(str).toString();

    tx.signature = ethCrypto.sign(privateKey, msg).slice(2);

    tx.hash = Transaction.genHash(tx);

    return tx;
  }

  async sendPublic(gameType, game, matchDate, tip, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'prognoz',
        action: 'public',
        gameType,
        game,
        tip,
        matchDate,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex'),
    );

    tx = await webED.signTX(tx, privateKey);
    await http(url_send, method, tx);
    return tx;
  }

  // TODO: разобраться с 0x, явно где-то лишний
  async sendPrivate(gameType, game, matchDate, tip, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    const salt = genRandomString(64);
    const keys = this.createWallet();
    const cryptoTipAndSalt = () => { aes256.encrypt(keys.PrivateKey, tip + salt); };
    const cryptoSalt = () => { aes256.encrypt(keys.PrivateKey, salt); };

    let tx = new Transaction(
      from,
      {
        type: 'prognoz',
        action: 'private',
        gameType,
        game,
        cryptoTipAndSalt,
        cryptoSalt,
        matchDate,
        pubKey: this.getPublicFromPrivate(keys.PrivateKey),
      },
      webED.getPublicFromPrivate(privateKey).toString('hex'),
    );

    tx = await webED.signTX(tx, privateKey);
    await http(url_send, method, tx);
    return {
      tx,
      privKey: keys.PrivateKey,
      salt,
    };
  }
}


function toHexString(byteArray) {
  let s = '';
  byteArray.forEach((byte) => {
    s += (`0${(byte & 0xff).toString(16)}`).slice(-2);
  });
  return s;
}

module.exports = webED;

function http(url, method, body) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);

    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
          return;
        }
        resolve(`Ошибка с сервера: ${xhr.responseText}`);
      }
    };

    xhr.send(JSON.stringify(body));
  });
}

function genRandomString(length) {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

class Transaction {
  /**
   * @constructor
   *
   * @param {string} from адрес отправителя
   * @param {Object} data данные транзакции
   * @param {string} publicKey публичный ключ отправителя
   * @param {string} signature подпись
   */
  constructor(from, data, publicKey, signature, timestamp) {
    this.from = from;
    this.data = data;
    this.publicKey = publicKey;
    this.timestamp = timestamp || Date.now();

    if (signature) {
      this.signature = signature;
    }
  }

  /**
   * Получение подписи
   *
   * @type {string}
   */
  get signature() {
    return this.signature;
  }

  /**
   * Получение хэша транзакции
   *
   * @type {strign<hex>}
   */
  get hashTx() {
    return CryptoJS.SHA256(
      this.from + JSON.stringify(this.data) + this.pubkey + this.signature,
    ).toString(CryptoJS.enc.Hex);
  }

  static genHash(tx) {
    const struct = {
      from: tx.from,
      data: tx.data,
      pubkey: tx.pubkey,
      signature: tx.signature,
    };
    const str = JSON.stringify(struct);

    return CryptoJS.SHA256(
      str,
    ).toString(CryptoJS.enc.Hex);
  }
}
