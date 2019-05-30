const EC2 = require('elliptic').ec;
const CryptoJS = require('crypto-js');
const ec = new EC2('secp256k1');

// let XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; //удалить при сборке

class webED {
  /**
   * @param {string} httpNode - url ноды
   * @param {string} accessToken - ключ доступа к api ноды
   * @return {webED}
   */
  constructor(httpNode, accessToken) {
    //добавить валидаторы
    this.httpNode = httpNode;
    this.accessToken = accessToken;
  }

  /**
   * Cоздание нового кошелька
   * @returns {Object} - {PrivateKey, PublicKey, Address}
   */
  createWallet() {
    let key1 = ec.genKeyPair(),
      key2 = ec.genKeyPair(),
      PublicKey = key1.getPublic().add(key2.getPublic()),
      PrivateKey = key1.getPrivate().add(key2.getPrivate());

    let key3 = ec.genKeyPair();
    key3._importPrivate(PrivateKey);

    let key4 = ec.genKeyPair();
    key4._importPublic(PublicKey);

    //privKey
    let priv = toHexString(key3.getPrivate().toArray());

    //public
    let _public = webED.getPublicFromPrivate(priv);

    //address
    let add = webED.getAddressFromPublic(_public);

    return {
      PrivateKey: '0x' + priv,
      PublicKey: _public,
      Address: add,
    };
  }

  static getPublicFromPrivate(privKey) {
    let keyPair = ec.genKeyPair();
    keyPair._importPrivate(privKey, 'hex');

    return keyPair.getPublic(false, 'hex').slice(2);
  }

  static getAddressFromPublic(pubKey) {
    let pubKeyWordArray = CryptoJS.enc.Hex.parse(pubKey),
      hash = CryptoJS.SHA3(pubKeyWordArray, { outputLength: 256 });

    return '0x' + hash.toString(CryptoJS.enc.Hex).slice(24);
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
    let from = webED.privateToAddress(privateKey),
      url_prep = `${this.httpNode}/prepeare/coin`,
      url_send = `${this.httpNode}/sendtx/`,
      method = 'POST';

    let tx = await http(url_prep, method, JSON.stringify({ from, to, amount }));

    tx = JSON.parse(tx);
    tx.publicKey = webED.getPublicFromPrivate(privateKey).toString('hex');

    tx = await webED.signTX(JSON.stringify(tx), privateKey);
    http(url_send, method, tx);

    return tx;
  }

  /**
   * Создание компетенции.
   * Отправка комментария к чьей-то компетенции.
   * Доступно только для прошедших комплаенс.
   * @param {string} to - кому (адрес)
   * @param {string} code - код компетенции от 0 до 9999
   * @param {string} text - текст комментария от 5 до 100 символов
   * @param {string} mark - оценка, символ "+" или символ "-"
   * @param {string} privateKey
   */
  async sendSkill(to, code, text, mark, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    text = text
      .replace('/', '')
      .replace('<', '')
      .replace('>', '');
    let tx = new Transaction(
      from,
      {
        type: 'skill',
        mark,
        text,
        code,
        to,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    tx = await webED.signTX(tx, privateKey);
    http(url_send, method, tx);

    return tx;
  }

  /**
   * Отправка компланеса.
   * Возможна только модератором.
   * @param {string} address - адрес проходящего комплаенс
   * @param {string} fullName - ФИО юзера
   * @param {string} privateKey - приватный ключ
   */
  async sendCompliance(address, fullName, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'compliance',
        address,
        fullName,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    tx = await webED.signTX(tx, privateKey);
    http(url_send, method, tx);

    return tx;
  }

  /**
   * Для добавления или удаления модератора админом (add/remove).
   * Для добавления новго модератора, путем голосования других модераторов.
   * @param {string} address - адрес получателя
   * @param {string} action  - 'add','remove','vote'
   * @param {string} privateKey - приватны ключ
   */
  async sendModerator(address, action, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'moderator',
        address,
        action,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    tx = await webED.signTX(tx, privateKey);
    http(url_send, method, tx);

    return tx;
  }

  /**
   * Функция позволяющая осуществлять арбитраж компетенций.
   * 'create' - доступна для всех у кого есть статус 'compliance'
   * 'accept' и 'close' - доступна только модераторам
   * @param {string} ref - ссылка на оспариваемый комментарий в случае 'create',
   * или ссылка на созданный арбитраж в случае 'accept' или 'close'
   * @param {string} text - поясняющий комментарий
   * @param {string} action - 'create', 'accept', 'close'
   * @param {string} privateKey - приватный ключ
   */
  async sendArbitr(ref, text, action, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const info = http(`${this.httpNode}/info`, 'GET');
    const url_send = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let dutyHash;
    if (_action == 'create') {
      dutyHash = await this.sendCoin(info.genesis, info.dutyPrice, privateKey);
    } else dutyHash = '';

    let tx = new Transaction(
      from,
      {
        type: 'arbitr',
        ref,
        dutyHash,
        text,
        action,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    tx = await webED.signTX(tx, privateKey);
    http(url_send, method, tx);

    return tx;
  }

  async createVoting(question, voters, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const urlSend = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'voting',
        action: 0,
        question,
        voters,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    await webED.signTX(tx, privateKey);
    http(urlSend, method, tx);

    return tx;
  }

  async sendVote(questRef, answer, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const urlSend = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'voting',
        action: 1,
        questRef,
        answer,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    await webED.signTX(tx, privateKey);
    http(urlSend, method, tx);

    return tx;
  }

  async closeVote(questRef, privateKey) {
    const from = webED.privateToAddress(privateKey);
    const urlSend = `${this.httpNode}/sendtx/`;
    const method = 'POST';

    let tx = new Transaction(
      from,
      {
        type: 'voting',
        action: 2,
        questRef,
      },
      webED.getPublicFromPrivate(privateKey).toString('hex')
    );

    await webED.signTX(tx, privateKey);
    http(urlSend, method, tx);

    return tx;
  }

  getActiveVotings(address) {
    address = address || 'null';

    return http(`${this.httpNode}/votings/${address}`, 'GET');
  }

  getAnsweredVotings(address) {
    address = address || 'null';

    return http(`${this.httpNode}/votings/answered/${address}`, 'GET');
  }

  getVotingsResults() {
    return http(`${this.httpNode}/votingsres`, 'GET');
  }

  getVotingResults(txHash) {
    return http(`${this.httpNode}/votingres/${txHash}`, 'GET');
  }

  /**
   *
   */
  static async signTX(tx, privateKey) {
    if (typeof tx == 'string') tx = JSON.parse(tx);

    if (privateKey[0] == '0' && privateKey[1] == 'x') {
      privateKey = Array.from(privateKey);
      privateKey = privateKey.slice(2, privateKey.length);
      privateKey = privateKey.join('');
    }
    privateKey = new Buffer(privateKey, 'hex');

    let str = tx.from + tx.publicKey + tx.timestamp,
      msg = CryptoJS.SHA256(str).toString(),
      key = ec.genKeyPair();

    key._importPrivate(privateKey);

    tx._signature = toHexString(
      (await key.sign(new Buffer(msg, 'hex'))).toDER()
    );
    tx.hash = tx.hashTx;

    return tx;
  }
}

function toHexString(byteArray) {
  var s = '';
  byteArray.forEach(function(byte) {
    s += ('0' + (byte & 0xff).toString(16)).slice(-2);
  });
  return s;
}

module.exports = webED;

async function http(url, method, body) {
  let xhr = new XMLHttpRequest();

  xhr.open(method, url, false);

  try {
    body = JSON.parse(body);
  } catch (e) {}
  if (body) {
    body.accessToken = this.accessToken;
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(JSON.stringify(body));
  } else xhr.send();

  if (xhr.status == 200) return xhr.responseText;
  else throw 'Сервер вернул ошибку';
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
      this._signature = signature;
    }
  }

  /**
   * Получение подписи
   *
   * @type {string}
   */
  get signature() {
    return this._signature;
  }

  /**
   * Получение хэша транзакции
   *
   * @type {strign<hex>}
   */
  get hashTx() {
    return CryptoJS.SHA256(
      this.from + this.publicKey + this._signature
    ).toString(CryptoJS.enc.Hex);
  }
}
