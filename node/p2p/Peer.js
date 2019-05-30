import WebSocket from 'ws';
import PeerList from './PeerList';
import Messages from './Messages';

export const peers = [];

/**
 * @class
 */
class Peer {
  /**
   * Добавляет пир по ip
   *
   * @param {string} ip
   *
   * @returns {Object}
   */
  static generatePeerByIp(ip) {
    const addr = Peer.normalizeAddress(ip);
    return {
      addr,
      socket: new WebSocket(`ws://${addr}:6000`),
    };
  }

  /**
   * Добавляет пир по ws
   *
   * @param {WebSocket} ws
   *
   * @returns {Object}
   */
  static generatePeerByWs(ws) {
    return {
      // eslint-disable-next-line no-underscore-dangle
      addr: this.normalizeAddress(ws._socket.remoteAddress),
      socket: ws,
    };
  }

  /**
   * Нормализует ipv4 адрес
   *
   * @param {string} ip
   *
   * @returns {string} ip
   */
  static normalizeAddress(_ip) {
    let ip = _ip;
    if (_ip.substr(0, 7) === '::ffff:') {
      ip = _ip.substr(7);
    }
    return ip;
  }

  /**
   * Отправить сообщения всем пирам
   *
   * @param {string} message сообщение для отправки
   */
  static sendText(message) {
    this.broadcast(Messages.sendText(message));
  }

  /**
   * Транслирование транзакции
   *
   * @param {Transaction} tx - транзакция
   */
  static sendTX(tx) {
    console.log('отправил транзакцию');
    this.broadcast(Messages.sendTX(tx));
  }

  /**
   * Транслирование блока
   *
   * @param {Block} block блок для отправки
   */
  static sendBlock(block) {
    this.broadcast(Messages.sendLatestBlock(block));
  }

  /**
   * Отправить сообщение всем пирам
   *
   * @param {string} message сообщение
   */
  static broadcast(message) {
    peers.forEach((peer) => {
      this.write(peer, message);
    });
  }

  /**
   * Отправить сообщение
   *
   * @param {WebSocket} ws web socket
   * @param {string} message сообщение
   */
  static write(ws, message) {
    ws.send(JSON.stringify(message), (err) => {
      if (err) console.log(err);
    });
  }

  /**
   * Отправить список подключенных пиров, исключая источник запроса
   *
   * @param {Object} connection
   *
   */
  static async sendHosts(connection) {
    const ips = await PeerList.getSendList(connection.addr).catch((err) => {
      throw err;
    });

    this.write(connection.socket, Messages.sendHosts(ips));
  }
}

export default Peer;
