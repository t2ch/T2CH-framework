
import Coin from '../chainCode/coin';

/**
 * Список поддерживаемых типов траназкций
 *
 * @constant {Object}
 */
export const txTypes = {
  coin: Coin,
};

/**
 * Парсинг объекта транзакции в объект класса
 *
 * @param {Object} obj
 * @param {string} obj.hash
 * @param {string} obj.from
 * @param {Object} obj.data
 * @param {string} obj.publicKey
 * @param {string} obj.signature
 * @param {number} obj.timestamp
 */
export default function parseTXObj(obj) {
  if (!obj.data) {
    throw new Error('parseTXObj error: Object doesn\'t have data field');
  }

  const txType = obj.data.type;
  if (!txType) {
    throw new Error('parseTXObj error: Object doesn\'t have type field');
  }

  if (!txTypes[txType]) {
    throw new Error(`parseTXObj error: Transaction of type ${txType} doesn't point in the list of supported transactions`);
  }

  const parsedTX = new txTypes[txType](
    obj.hash,
    obj.from,
    obj.data,
    obj.publicKey,
    obj.signature,
    obj.timestamp,
  );

  return parsedTX;
}
