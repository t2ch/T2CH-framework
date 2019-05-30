import { randomBytes } from 'crypto';
import { publicKeyConvert, publicKeyCreate } from 'secp256k1';
import assert from 'assert';
import SHA3 from 'keccakjs';


function isHexPrefixed(str) {
  return str.slice(0, 2) === '0x';
}

function padToEven(_a) {
  let a = _a;
  if (_a.length % 2) a = `0${_a}`;
  return a;
}

function stripHexPrefix(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return isHexPrefixed(str) ? str.slice(2) : str;
}

/**
 * Перевод из Int в Hex
 *
 * @param {number} i
 *
 * @returns {string<hex>}
 */
export function intToHex(i) {
  assert(i % 1 === 0, 'number is not a integer');
  assert(i >= 0, 'number must be positive');
  let hex = i.toString(16);
  if (hex.length % 2) {
    hex = `0${hex}`;
  }

  return `0x${hex}`;
}

function intToBuffer(i) {
  const hex = intToHex(i);
  return Buffer.from(hex.slice(2), 'hex');
}

function toBuffer(_v) {
  let v = _v;
  if (!Buffer.isBuffer(_v)) {
    if (Array.isArray(_v)) {
      v = Buffer.from(_v);
    } else if (typeof _v === 'string') {
      if (isHexPrefixed(_v)) {
        v = Buffer.from(padToEven(stripHexPrefix(_v)), 'hex');
      } else {
        v = Buffer.from(_v);
      }
    } else if (typeof _v === 'number') {
      v = intToBuffer(_v);
    } else if (_v === null || _v === undefined) {
      v = Buffer.from([]);
    } else if (_v.toArray) {
      // бинарники => буфер
      v = Buffer.from(_v.toArray());
    } else {
      throw new Error('invalid type');
    }
  }
  return v;
}

/**
 * Получение публичного ключа из приватного
 *
 * @param {string} priv приватный ключ
 *
 * @returns {string} публичный ключ
 */
export function getPublicFromPrivate(priv) {
  return publicKeyCreate(toBuffer(priv), false).slice(1);
}

function sha3(_a, _bytes) {
  const a = toBuffer(_a);
  let bytes = _bytes;
  if (!_bytes) bytes = 256;

  const h = new SHA3(bytes);
  if (a) {
    h.update(a);
  }
  return Buffer.from(h.digest('hex'), 'hex');
}


/**
 * Перевод публичного ключа в адрес
 *
 * @param {string} pubKey публичный ключ
 * @param {boolean} sanitize
 *
 * @returns {string}
 */
export function publicToAddress(_pubKey, sanitize) {
  let pubKey = toBuffer(_pubKey);
  if (sanitize && pubKey.length !== 64) {
    pubKey = publicKeyConvert(pubKey, false).slice(1);
  }
  assert(pubKey.length === 64);
  // Рекомендуется использовать только хешы меньшие 160 бит
  return sha3(pubKey).slice(-20);
}

/**
 * Генерация данных кошелька
 *
 * @returns {{PrivateKey: string, PublicKey: string, Address: string}}
 */
export function generate() {
  const priv = randomBytes(32);
  const pub = publicToAddress(getPublicFromPrivate(priv));
  return {
    PrivateKey: priv.toString('hex'),
    PublicKey: publicKeyCreate(toBuffer(priv), false)
      .slice(1)
      .toString('hex'),
    Address: pub.toString('hex'),
  };
}

/**
 * Перевод приватного ключа в адрес
 *
 * @param {string} priv приватный ключ
 *
 * @returns {string<hex>}
 */
export function privateToAddress(priv) {
  const address = publicToAddress(getPublicFromPrivate(priv));
  return `0x${address.toString('hex')}`;
}

/**
 * Проверка правильности адреса
 *
 * @param {string} address
 *
 * @returns {boolean}
 */
export function isValidAddress(address) {
  if (address[0] === '0' && address[1] === 'x') { if (address.length === 42) return true; }

  return false;
}
