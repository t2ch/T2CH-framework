/**
 * Возврат последней записи в заданной бд
 *
 * @param {DB} db - объект класса DB
 *
 * @returns {Promise<bool>}
 */
export default async function getLastRecord(db) {
  let lastRecord;
  return new Promise((resolve) => {
    db.createReadStream({
      keys: false,
      values: true,
      limit: 1,
      reverse: true,
    }).on('data', (data) => {
      lastRecord = data;
    }).on('end', () => {
      resolve(lastRecord);
    });
  });
}
