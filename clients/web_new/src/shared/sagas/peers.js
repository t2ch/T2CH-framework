import { call, put } from 'redux-saga/effects';

import { fetchPeers } from '&/shared/api';
import {
  peersLoading,
  peersSuccess,
  peersError,
} from '&/shared/actions/actions';

export default function* fetchPeersSaga() {
  yield put(peersLoading());
  try {
    const response = yield call(fetchPeers);
    const { data } = response;
    yield put(peersSuccess(data));
  } catch (error) {
    yield put(peersError());
  }
}
