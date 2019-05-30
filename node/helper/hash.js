import { randomBytes } from 'crypto';

/**
 * Генерация соли заданного размера
 *
 * @param {number} length - число знаков соли
 *
 * @returns {String}
 */
export default function genRandomString(length) {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}
