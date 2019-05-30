import DB from '../db';

const PeerDb = DB.getInstance('peers');
/**
 * Класс, описывающий взаимодействие со списком пиров из базы данных
 * @class
 */
class PeerList {
  /**
   * Возвращает список пиров, хранимых в БД
   * @async
   *
   * @returns {Promise}
   */
  static getPeers() {
    const peers = [];

    return new Promise((resolve) => {
      PeerDb.createReadStream({})
        .on('data', (data) => {
          peers.push(data);
        })
        .on('end', () => {
          resolve(peers);
        });
    });
  }
  /**
   * Возвращает список пиров, которые необходимо отправить другой ноде
   * @async
   *
   * @param {string} to -- адрес ноды, куда отправляется список
   *
   * @returns {Promise}
   */

  static getSendList(to) {
    const list = [];

    return new Promise((resolve) => {
      PeerDb.createReadStream({})
        .on('data', (data) => {
          if (data.key !== to) {
            list.push(data.key);
          }
        })
        .on('end', () => {
          resolve(list);
        });
    });
  }

  /**
   * Возвращает состояние соединения пира
   * @async
   *
   * @param {string} ip -- адрес пира
   *
   * @returns {Promise}
   */
  static getPeerStateByIp(ip) {
    return new Promise((resolve, reject) => {
      PeerDb.createReadStream({})
        .on('data', (data) => {
          if (data.key === ip) {
            resolve(data.value);
          }
        })
        .on('end', () => {
          reject(new Error('Peer not found!'));
        });
    });
  }

  /**
   * Добавляет пир в список или Обновляет его состояние
   * @async
   *
   * @param {string} addr -- ip
   * @param {string} state -- состояние подключения
   *
   * @returns {Promise}
   */
  static async setPeer(addr, state) {
    await PeerDb.put(addr, state);
  }

  /**
   * Разблокировать все пиры
   * @async
   *
   * @param {Object} current
   * @param {Object} target
   *
   * @returns {Promise}
   */
  static async changeStateforAll(current, target) {
    return new Promise((resolve) => {
      PeerDb.createReadStream({})
        .on('data', (data) => {
          if (data.value === current) {
            this.setPeer(data.key, target);
          }
        })
        .on('end', () => {
          resolve();
        });
    });
  }
}

export default PeerList;
