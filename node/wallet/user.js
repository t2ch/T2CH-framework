import crypto from 'crypto';
import scrypt from 'scryptsy';
import aes from 'aes-js';
import fs from 'fs';
import genRandomString from '../helper/hash';
import { generate, getPublicFromPrivate } from './wallet';

let selectedWallet;

/**
 * Пользователь
 * @class
 */
class User {
  /**
   * Создание keystore
   * @param {string} address - адрес кошелька
   * @param {string} pk - приватный ключ кошелька
   * @param {string} password - пароль к keystore кошелька
   *
   * @returns {string} Имя keystore файла
   */
  static createKeystore(address, pk, password) {
    const n = 32768;
    const r = 8;
    const p = 1;
    const dklen = 32;

    const salt = genRandomString(64);
    const key = scrypt(password, salt, n, r, p, dklen);

    const textBytes = aes.utils.utf8.toBytes(pk);

    const iv = crypto.randomBytes(16);
    // eslint-disable-next-line new-cap
    const aesCtr = new aes.ModeOfOperation.ctr(key, iv);

    const encryptedBytes = aesCtr.encrypt(textBytes);
    const encryptedHex = aes.utils.hex.fromBytes(encryptedBytes);

    const mac = crypto
      .createHash('sha256')
      .update(encryptedHex + key)
      .digest('hex');

    const keystore = {
      address,
      ciphertext: encryptedHex,
      iv: iv.toString('hex'),
      kdfparams: {
        n,
        r,
        p,
        salt,
        dklen,
      },
      mac,
    };

    if (!fs.existsSync('./keystore')) {
      fs.mkdirSync('./keystore');
    }

    fs.writeFileSync(
      `./keystore/${address}.json`,
      JSON.stringify(keystore, null, 4),
    );

    return `${address}.json`;
  }

  /**
   * Получение приватного ключа по keystore и паролю
   * @param {string} walletFile - путь к keystore файлу
   * @param {string} password - пароль
   *
   * @returns {string} - приватный ключ кошелька
   */
  static readKeystore(walletFile, password) {
    const keystore = JSON.parse(fs.readFileSync(`./keystore/${walletFile}`));
    const { kdfparams } = keystore;

    const key = scrypt(
      password,
      kdfparams.salt,
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen,
    );

    const mac = crypto
      .createHash('sha256')
      .update(keystore.ciphertext + key)
      .digest('hex');
    if (mac !== keystore.mac) throw Error('Invalid key');

    const encryptedBytes = aes.utils.hex.toBytes(keystore.ciphertext);

    const iv = Buffer.from(keystore.iv, 'hex');
    // eslint-disable-next-line new-cap
    const aesCtr = new aes.ModeOfOperation.ctr(key, iv);

    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    const decryptedText = aes.utils.utf8.fromBytes(decryptedBytes);

    const publicKey = getPublicFromPrivate(`0x${decryptedText}`).toString('hex');
    User.selectWallet(`0x${keystore.address}`, publicKey, decryptedText);

    return `0x${decryptedText}`;
  }

  /**
   * Список доступных кошельков
   *
   * @returns {Promise<Array>}
   */
  static listWallets() {
    if (!fs.existsSync('./keystore')) {
      throw new Error('No wallets!');
    }

    return new Promise((resolve, reject) => {
      fs.readdir('./keystore', (err, files) => {
        const wallets = [];
        files.forEach((file) => {
          wallets.push(`0x${file.substring(0, file.length - 5)}`);
        });

        if (!wallets.length) {
          reject(new Error('No wallets!'));
        }

        resolve(wallets);
      });
    });
  }

  /**
   * Создание нового кошелька
   * @param {string} password пароль для keystore
   *
   * @returns {{private: string, address: string}}
   */
  static newWallet(password) {
    this.pair = generate();

    User.createKeystore(this.pair.Address, this.pair.PrivateKey, password);

    User.selectWallet(`0x${this.pair.Address}`, this.pair.PublicKey, this.pair.PrivateKey);

    return {
      private: `0x${this.pair.PrivateKey}`,
      public: this.pair.PublicKey,
      address: `0x${this.pair.Address}`,
    };
  }

  /**
   * Выбор кошелька по умолчанию
   * @param {string} privateKey приватный ключ
   */
  static selectWallet(address, publicKey, privateKey) {
    selectedWallet = {
      address,
      publicKey,
      privateKey,
    };
  }

  /**
   * Проверка на наличие кошелька по умолчанию
   *
   * @returns {boolean}
   */
  static isDefaultWalletSet() {
    return !!selectedWallet;
  }

  /**
   * Получение кошелька по умолчанию
   *
   * @returns {{address: string, privateKey: string}}
   */
  static getSelectedWallet() {
    return selectedWallet;
  }
}

export default User;
