import { call, put } from 'redux-saga/effects';

import { fetchBlocks } from '&/shared/api';
import {
  blocksLoading,
  blocksSuccess,
  blocksError,
} from '&/shared/actions/actions';

export default function* fetchBlocksSaga() {
  yield put(blocksLoading());
  try {
    const response = yield call(fetchBlocks);
    const { data } = response;
    yield put(blocksSuccess(data));
  } catch (error) {
    yield put(blocksError());
  }
}
