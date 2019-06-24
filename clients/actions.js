import User from '../node/wallet/user';
import Transaction from '../node/transaction';
import Coin from '../node/chainCode/coin';
import P2P from '../node/p2p/p2p';
import {
  privateToAddress, getPublicFromPrivate, publicToAddress,
} from '../node/wallet/wallet';
import Block from '../node/block';
import Mempool from '../node/mempool';
import Status from '../node/status';
import PeerList from '../node/p2p/PeerList';
import { initConnection } from '../config';
import { txTypes } from '../node/helper/parseObj';
import Forging from '../node/forging';
import Peer from '../node/p2p/Peer';
import start from './rpc/server';
import Moderator from '../node/chainCode/moderator';


const status = new Status();

export function createWallet(password) {
  return User.newWallet(password);
}

export async function getWallets() {
  const wallets = await User.listWallets();

  return wallets;
}

export function selectWallet(walletFile, password) {
  const privateKey = User.readKeystore(walletFile, password);
  const publicKey = getPublicFromPrivate(privateKey);
  const address = publicToAddress(publicKey, false).toString('hex');

  User.selectWallet(`0x${address}`, publicKey.toString('hex'), privateKey);
}

export function startHTTP(port) {
  start(port);
}

export async function startP2P(port) {
  const log = await P2P.startServer(port);
  return log;
}

export async function connect(host) {
  await P2P.connectToHost(host);
}

export async function connectToAll() {
  const hosts = await PeerList.getPeers();
  const ips = [];
  hosts.forEach((host) => {
    ips.push(host.key);
  });

  if (ips.length === 0) {
    P2P.connectToHosts(initConnection);
  }
  P2P.connectToHosts(ips);
}

export async function startForge() {
  const { address, publicKey, privateKey } = User.getSelectedWallet();

  await Forging.enableForge(address, publicKey, privateKey);
}

export async function getAllBlocks(args) {
  switch (args) {
    case 'quantity': {
      const latestBlock = Block.getLatestBlock();

      if (latestBlock) {
        return latestBlock.index + 1;
      }

      return 0;
    }
    default: {
      const blocks = await Block.getAllBlocks();
      return blocks;
    }
  }
}

export async function getPeers() {
  const peers = await PeerList.getPeers();
  return peers;
}

export async function search(args, data) {
  switch (args) {
    case 'a':
      return 'all';
    case 't':
      try {
        const block = await Block.getBlockByTxHash(data);

        return block;
      } catch (err) {
        return err;
      }

    case 'b':
      try {
        const block = await Block.getBlockByHash(data);

        return block;
      } catch (err) {
        return 'Block not found!';
      }
    default:
      return 'command not found';
  }
}

export function getStatus() {
  return `Current status: ${status.state}`;
}

export async function getModers() {
  let list = '';
  const mass = await Moderator.getAllModerators();

  mass.forEach((item, index) => {
    list += `${item}${index !== (mass.length - 1) ? '\n' : ''}`;
  });
  return list;
}

export async function sendTX(type, params) {
  const { address, privateKey, publicKey } = User.getSelectedWallet();

  try {
    const tx = await txTypes[type].genTX(address, publicKey, params);
    await tx.signTX(privateKey.substring(2));

    await Mempool.checkTransaction(tx, false);
    Mempool.addTransaction(tx);

    Peer.sendTX(tx);
  } catch (e) {
    throw e;
  }
}

export async function sendText(message) {
  Peer.sendText(message);
}

export function sendSignedTx(tx) {
  Peer.sendTX(tx);
}

export async function getBalance(address) {
  const balance = await Coin.getBalance(address);
  return balance;
}

export async function banIP(ip) {
  await P2P.banPeerbyIP(ip);
}

export async function unbanAll() {
  await P2P.unban();
}

export function disconnect() {
  P2P.disconnect();
}

export function createKeystore(pk, password) {
  const address = privateToAddress(pk);
  User.createKeystore(
    address.substring(2),
    pk.substring(2),
    password,
  );

  return address;
}

export function getMempool() {
  return Mempool.getTransactions();
}

export function clearMempool() {
  Mempool.removeTransactions(Mempool.getTransactions());
}

export function stopForge() {
  Forging.stopForge();
}

export async function getTransactions(searchOpts) {
  const transactions = await Transaction.getTransactions(searchOpts);
  return transactions;
}

export async function testDoubleSpent() {
  const { address, privateKey, publicKey } = User.getSelectedWallet();

  try {
    const tx = await txTypes.coin.genTX(address, publicKey, {
      type: 'coin',
      recipient: '0x42117b13c36550fe27bf6790466906a2f16d8ef8',
      amount: 100,
    });
    await tx.signTX(privateKey.substring(2));

    let tx2 = new Transaction();
    tx2 = await txTypes.coin.genTX(address, publicKey, {
      type: 'coin',
      recipient: '0x42117b13c36550fe27bf6790466906a2f16d8ef8',
      amount: 222,
    });
    tx2.data.inputs[0] = { txHash: 'c8b4602f69d6357696f644de7c32581b95ebd6f7231e2907da8c803b530d5913', index: 0, amount: 250000000000 };
    await tx2.signTX(privateKey.substring(2));

    Mempool.checkTransaction(tx);
    Mempool.checkTransaction(tx2);

    Mempool.addTransaction(tx);
    Mempool.addTransaction(tx2);
  } catch (e) {
    throw e;
  }
}
