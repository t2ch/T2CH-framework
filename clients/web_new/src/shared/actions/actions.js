import { createAction } from 'redux-act';

export const fetchBlocks = createAction('FETCH_BLOCKS');
export const blocksLoading = createAction('BLOCKS_LOADING');
export const blocksSuccess = createAction('BLOCKS_SUCCESS');
export const blocksError = createAction('BLOCKS_FAIL');

export const fetchTransactions = createAction('FETCH_TRANSACTIONS');
export const transactionsLoading = createAction('TRANSACTIONS_LOADING');
export const transactionsSuccess = createAction('TRANSACTIONS_SUCCESS');
export const transactionsError = createAction('TRANSACTIONS_FAIL');

export const fetchMempool = createAction('FETCH_MEMPOOL');
export const mempoolLoading = createAction('MEMPOOL_LOADING');
export const mempoolSuccess = createAction('MEMPOOL_SUCCESS');
export const mempoolError = createAction('MEMPOOL_FAIL');

export const fetchBlocksLength = createAction('FETCH_BLOCKS_LENGTH');
export const blocksLengthLoading = createAction('BLOCKS_LENGTH_LOADING');
export const blocksLengthSuccess = createAction('BLOCKS_LENGTH_SUCCESS');
export const blocksLengthError = createAction('BLOCKS_LENGTH_FAIL');

export const fetchPeers = createAction('FETCH_PEERS');
export const peersLoading = createAction('PEERS_LOADING');
export const peersSuccess = createAction('PEERS_SUCCESS');
export const peersError = createAction('PEERS_FAIL');
