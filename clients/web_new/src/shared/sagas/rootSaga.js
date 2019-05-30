import { takeLatest } from 'redux-saga/effects';
import fetchBlocksSaga from './blocks';
import fetchTransactionsSaga from './transactions';
import fetchMempoolSaga from './mempool';
import fetchBlocksLengthSaga from './blocksLength';
import fetchPeersSaga from './peers';

export default function* watcherSaga() {
  yield takeLatest('FETCH_BLOCKS_LENGTH', fetchBlocksLengthSaga);
  yield takeLatest('FETCH_BLOCKS', fetchBlocksSaga);
  yield takeLatest('FETCH_TRANSACTIONS', fetchTransactionsSaga);
  yield takeLatest('FETCH_MEMPOOL', fetchMempoolSaga);
  yield takeLatest('FETCH_PEERS', fetchPeersSaga);
}
