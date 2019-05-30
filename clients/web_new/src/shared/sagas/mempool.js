import { call, put } from 'redux-saga/effects';

import { fetchMempool } from '&/shared/api';
import {
  mempoolLoading,
  mempoolSuccess,
  mempoolError,
} from '&/shared/actions/actions';

export default function* fetchMempoolSaga() {
  yield put(mempoolLoading());
  try {
    const response = yield call(fetchMempool);
    const { data } = response;
    yield put(mempoolSuccess(data));
  } catch (error) {
    yield put(mempoolError());
  }
}
