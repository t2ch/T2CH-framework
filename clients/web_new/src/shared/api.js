import axios from 'axios';

import config from '~/config';

axios.defaults.baseURL = config.api;

export function fetchBlocks() {
  return axios.get('/blocks');
}

export function fetchBlocksLength() {
  return axios.get('/blocks/length');
}

export function fetchBlock(hash) {
  return axios.get(`/blocks/${hash}`);
}

export function fetchTransactions() {
  return axios.get('/transactions');
}

export function fetchTransaction(hash) {
  return axios.get(`/transactions/${hash}`);
}

export function fetchMempool() {
  return axios.get('/mempool');
}

export function fetchMempoolTx(hash) {
  return axios.get(`/mempool/${hash}`);
}

export function search(key) {
  return axios.get(`/search/${key}`);
}

export function fetchPeers() {
  return axios.get('/peers');
}
