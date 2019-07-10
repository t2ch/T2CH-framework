import { v4 } from 'public-ip';
import WebSocket, { Server } from 'ws';
import PQueue from 'p-queue';
import Mempool from '../mempool';
import Peer, { peers } from './Peer';
import PeerList from './PeerList';
import messageTypes from './message-type';
import peerStates from './peer-state';

// Типы сообщений
import Messages from './Messages';

import config from '../helper/config'; // Сформированный JSON для всех типов сообщений передаваемых в сети
import Block from '../block';
import Forging from '../forging';
import Transaction from '../transaction';
import parseTXObj from '../helper/parseObj';

const {
  RECEIVE_TX,
  RECEIVE_BLOCKCHAIN,
  RECEIVE_HOSTS,
  RECEIVE_LATEST_BLOCK,
  RECEIVE_MEMPOOL,
  RECEIVE_TEXT,
  REQUEST_BLOCKCHAIN,
  REQUEST_HOSTS,
  REQUEST_LATEST_BLOCK,
  REQUEST_MEMPOOL,
  RECEIVE_REVERSE_CONNECTION,
} = messageTypes;

const {
  CONNECTED,
  DISCONNECTED,
  BANNED,
} = peerStates;

const stun = {};

const queue = new PQueue({ concurrency: 1 });

/**
 * Peer-to-peer
 * @class
 */
class P2P {
  /**
   * Открыть сокет для входяших сообщений
   * @async
   *
   * @param {number} p2pPort порт
   *
   * @returns {{ip: string, port: number}}
   */
  static async startServer(p2pPort) {
    const serverIp = await v4();

    try {
      stun.socket = await P2P.connectToSTUN(config.STUN, 6001);
      stun.state = 'connected';
    } catch (err) {
      stun.state = 'disconnected';
    }

    const server = new Server({
      port: p2pPort,
      verifyClient: async (info, done) => {
        const incomming = await P2P.isSocketOpen(
          Peer.normalizeAddress(info.req.connection.remoteAddress),
        );
        console.log(incomming);
        done(!incomming);
      },
    });

    server.on('connection', async (ws) => {
      const newPeer = Peer.generatePeerByWs(ws);
      if (await P2P.validatePeer(newPeer.addr)) {
        if (serverIp !== newPeer.addr) {
          await PeerList.setPeer(newPeer.addr, CONNECTED);
          await P2P.initConnection(newPeer);
        } else {
          newPeer.socket.close();
        }
      } else {
        newPeer.socket.close();
      }
    });
    return {
      ip: serverIp,
      port: p2pPort,
      stun: stun.state,
    };
  }

  /**
   * Подключиться к STUN серверу
   *
   * @param {string} addr адрес сервера
   * @param {number} port порт сервера
   *
   * @returns {Promise}
   */
  static connectToSTUN(addr, port) {
    return new Promise((resolve, reject) => {
      const stunws = new WebSocket(`ws://${addr}:${port}`);
      stunws.on('open', async () => {
        await P2P.initSTUNMessageHandler(stunws);
        resolve(stunws);
      });
      stunws.on('error', () => {
        reject();
      });
    });
  }

  /**
   * Обработать входящее сообщение от STUN сервера
   *
   * @param {Object} _stun
   */
  static async initSTUNMessageHandler(_stun) {
    _stun.on('message', async (_message) => {
      const message = JSON.parse(_message.toString('utf8'));
      if (message.type === RECEIVE_REVERSE_CONNECTION) {
        await P2P.connectToHost(message.data);
      }
    });
  }

  /**
   * Проверяет, успановлено ли соединение с сококетом
   * @async
   *
   * @param {string} ip
   *
   * @returns {Promise<boolean>}
   */
  static async isSocketOpen(ip) {
    return new Promise(async (resolve) => {
      await PeerList.getPeerStateByIp(ip)
        .then((data) => {
          resolve(data === CONNECTED);
        })
        .catch(async () => {
          await PeerList.setPeer(ip, DISCONNECTED);
          resolve(false);
        });
    });
  }

  /**
   * Присоединиться к пиру по ip
   *
   * @param {string} host ip пира
   *
   * @returns {Promise<any>}
   */
  static async connectToHost(host) {
    return new Promise(async (resolve) => {
      const newPeer = Peer.generatePeerByIp(host);

      newPeer.socket.on('open', async () => {
        await PeerList.setPeer(newPeer.addr, CONNECTED);
        await P2P.initConnection(newPeer);
        resolve();
      });

      newPeer.socket.on('error', async () => {
        await PeerList.getPeerStateByIp(newPeer.addr)
          .then((state) => {
            if (state === DISCONNECTED) {
              P2P.requestReverseConnection(newPeer.addr);
            }
          })
          .catch(async () => {
            await PeerList.setPeer(newPeer.addr, DISCONNECTED).then(
              () => {
                P2P.requestReverseConnection(newPeer.addr);
              },
            );
          });
        resolve();
      });
    });
  }

  /**
   * Присоединиться к пирам по ip перечисленным в массиве
   *
   * @param {[string]} host ip пира
   *
   * @returns {void}
   */
  static connectToHosts(hosts) {
    hosts.forEach(async (host) => {
      try {
        await P2P.connectToHost(host);
      } catch (err) {
        // do nothing
      }
    });
  }

  /**
   * Инициализировать подключенный пир
   *
   * @param {Object} peer
   */
  static async initConnection(peer) {
    peers.push(peer.socket);
    P2P.initMessageHandler(peer);
    P2P.initErrorHandler(peer);
    Peer.write(peer.socket, Messages.getHosts());
    Peer.write(peer.socket, Messages.getLatestBlock());
    Peer.write(peer.socket, Messages.getMempool());
  }

  /**
   * Инициализировать обработку входящего сообщение
   *
   * @param {Object} connection
   */
  static async initMessageHandler(connection) {
    connection.socket.on('message', (data) => {
      const message = JSON.parse(data.toString('utf8'));
      P2P.handleMessage(connection, message);
    });
  }

  /**
   * Запросить реверсное подключение
   *
   * @param {string} ip
   */
  static requestReverseConnection(ip) {
    if (stun.state !== 'disconnected') {
      Peer.write(stun.socket, Messages.getReverseConnection(ip));
    }
  }

  /**
   * Инициализировать обработку входящего сообщения об ошибке
   *
   * @param {Object} connection
   */
  static initErrorHandler(connection) {
    const closeConnection = (socket) => {
      peers.splice(peers.indexOf(socket), 1);
    };
    connection.socket.on('error', async () => {
      await PeerList.setPeer(connection.addr, DISCONNECTED);
      closeConnection(connection.socket);
    });
    connection.socket.on('close', async () => {
      await PeerList.setPeer(connection.addr, DISCONNECTED);
      closeConnection(connection.socket);
    });
  }

  /**
   * Обработать входящее сообщение
   * @async
   *
   * @param {Object} peer
   * @param {string} message
   */
  static async handleMessage(peer, message) {
    switch (message.type) {
      case RECEIVE_TX: {
        console.log('получил транзакцию');

        queue.add(() => P2P.handleTX(message));

        break;
      }
      case REQUEST_LATEST_BLOCK:
        console.log('отправил последний блок');
        Peer.write(
          peer.socket,
          Messages.sendLatestBlock(Block.getLatestBlock()),
        );
        break;
      case REQUEST_BLOCKCHAIN:
        console.log('отправил блокчейн');
        Peer.write(
          peer.socket,
          Messages.sendBlockchain(await Block.getAllBlocks()),
        );
        break;
      case REQUEST_MEMPOOL:
        console.log('отправил мемпул');
        Peer.write(peer.socket, Messages.sendMempool(Mempool.getTransactions()));
        break;
      case RECEIVE_LATEST_BLOCK:
        console.log('получил последний блок');
        P2P.handleReceivedLatestBlock(message, peer);
        break;
      case RECEIVE_BLOCKCHAIN:
        console.log('получил блокчейн');
        P2P.handleReceivedBlockchain(message, peer);
        break;
      case RECEIVE_MEMPOOL:
        console.log('получил мемпул');
        P2P.handleReceivedMempool(message);
        break;
      case REQUEST_HOSTS:
        console.log('отправил пиры');
        Peer.sendHosts(peer);
        break;
      case RECEIVE_HOSTS:
        console.log('получил пиры');
        P2P.handleReceivedHosts(message);
        break;
      case RECEIVE_TEXT:
        console.log('получил сообщение');
        P2P.handleText(message);
        break;
      default:
        await PeerList.setPeer(peer.addr, BANNED);
        peer.socket.close();
    }
  }

  /**
   * Обработать входящее текстовое сообщение
   *
   * @param {string} message
   */
  static handleText(message) {
    console.log(message.data);
  }

  /**
   * Обработать входящую транзакцию
   *
   * @param {Object} message
   * @param {Transaction} message.data
   */
  static handleTX(message) {
    return new Promise(async (resolve) => {
      const incomingTx = parseTXObj(message.data);
      if (Mempool.alreadyInMempool(incomingTx.hash)) resolve();

      await Mempool.checkTransaction(incomingTx);
      await Mempool.addTransaction(incomingTx);

      // this.sendTX(incomingTx);
      resolve();
    });
  }

  /**
   * Обработать входящий блок
   * @async
   *
   * @param {Object} message
   * @param {Block} message.data
   * @param {Object} peer
   */
  static async handleReceivedLatestBlock(message, peer) {
    const receivedBlock = message.data;
    const latestBlock = Block.getLatestBlock();
    if (latestBlock.hash === receivedBlock.previousHash) {
      try {
        const parsedBlock = Block.parseBlock(receivedBlock);

        await Block.isValidNextBlock(parsedBlock, latestBlock);
        await Transaction.saveTXs(parsedBlock.txs);

        Block.setLastBlock(parsedBlock);
        parsedBlock.saveBlock();

        Forging.enableForge();
        Peer.broadcast(
          Messages.sendLatestBlock(Block.getLatestBlock()),
        );
      } catch (err) {
        await PeerList.setPeer(peer.addr, BANNED);
        peer.socket.close();
        console.log(err);
      }

      return;
    }

    if (receivedBlock.index > latestBlock.index) {
      Peer.write(peer.socket, Messages.getBlockchain());
    }
  }

  /**
   * Обработать входящий чейн
   * @async
   *
   * @param {string} message
   * @param {Object} peer
   */
  static async handleReceivedBlockchain(message, peer) {
    const ownChain = await Block.getAllBlocks();
    const receivedChain = message.data;
    try {
      await P2P.compareChains(receivedChain, ownChain, peer);
    } catch (e) {
      console.log('ERROR handleReceivedBlockchain');
      console.log(e);
    }
  }

  /**
   * Функция сравнивающая входящий и хранимый чейн
   * После сравнения решает какой из них сохранить
   * @async
   *
   * @param {Block[]} receivedChain -- входящий чейн
   * @param {Block[]} ownChain -- хранимый чейн
   *
   * @returns {Promise<void>}
   */
  static async compareChains(receivedChain, ownChain) {
    if (ownChain.length > receivedChain.length) return;

    let commonBlockInd = 0;
    for (let i = ownChain.length - 1; i > 0; i -= 1) {
      if (receivedChain[i].hash === ownChain[i].hash) {
        commonBlockInd = i;
        break;
      }

      Block.deleteBlocks([ownChain[i]]);
      Block.setLastBlock(ownChain[i - 1]);
    }

    await P2P.addBlockDiff(receivedChain.slice(commonBlockInd + 1));
  }

  /**
   * Добавляет массив пришедших блоков
   * @async
   *
   * @param {Object[]} diff
   * @param {Object} peer
   * @returns {Promise<void>}
   */
  static async addBlockDiff(diff) {
    try {
      for (let i = 0; i < diff.length; i += 1) {
        const block = Block.parseBlock(diff[i]);
        const latestBlock = Block.getLatestBlock();

        // eslint-disable-next-line no-await-in-loop
        await Block.isValidNextBlock(block, latestBlock);
        Transaction.saveTXs(block.txs);
        block.saveBlock();
        Block.setLastBlock(block);
      }
    } catch (err) {
      console.log('ERROR addBlockDiff');
      throw err;
    }

    Forging.enableForge();
  }

  /**
   * Обработка мемпула
   * @async
   *
   * @param {Object} message
   * @param {Transaction[]} message.data
   *
   * @returns {Promise}
   */
  static async handleReceivedMempool(message) {
    const receivedMempool = message.data;
    const addingTXs = [];
    receivedMempool.forEach((transaction) => {
      const addTransaction = new Promise(async (resolve) => {
        if (Mempool.alreadyInMempool(transaction)) return;

        await Mempool.checkTransaction(transaction);
        await Mempool.addTransaction(transaction);

        // Peer.sendTX(transaction);
        resolve();
      });

      addingTXs.push(addTransaction);
    });

    await Promise.all(addingTXs);
  }

  /**
   * Обработать входящй список хостов
   *
   * @param {string} message
   */
  static handleReceivedHosts(message) {
    message.data.forEach(async (ip) => {
      await PeerList.getPeerStateByIp(ip).catch(async () => {
        await PeerList.setPeer(ip, DISCONNECTED);
        await P2P.connectToHost(ip);
        // Peer.broadcast(Messages.sendHosts([ip]));
      });
    });
  }

  /**
   * Проверка, не находится ли пир в бане
   * @async
   *
   * @param {string} ip
   *
   * @returns {Promise<boolean>}
   */
  static async validatePeer(ip) {
    return new Promise(async (resolve) => {
      await PeerList.getPeerStateByIp(ip)
        .then((state) => {
          resolve(state !== BANNED);
        })
        .catch(async () => {
          resolve(true);
        });
    });
  }

  /**
   * Заблокировать пир по ip
   * @async
   *
   * @param {string} ip
   *
   * @returns {Promise<void>}
   */
  static async banPeerbyIP(ip) {
    await PeerList.setPeer(ip, BANNED);
  }

  /**
   * Разблокировать всех
   * @async
   *
   * @returns {Promise<void>}
   */
  static async unban() {
    await PeerList.changeStateforAll(BANNED, DISCONNECTED);
  }

  /**
   * Закрыть все соединения
   */
  static disconnect() {
    peers.forEach((socket) => {
      socket.close();
    });
  }
}

export default P2P;
