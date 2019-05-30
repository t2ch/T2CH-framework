import { call, put } from 'redux-saga/effects';

import { fetchBlocksLength } from '&/shared/api';
import {
  blocksLengthLoading,
  blocksLengthSuccess,
  blocksLengthError,
} from '&/shared/actions/actions';

export default function* fetchBlocksLengthSaga() {
  yield put(blocksLengthLoading());
  try {
    const response = yield call(fetchBlocksLength);
    console.log(response);
    const { data } = response;
    yield put(blocksLengthSuccess(data.length));
  } catch (error) {
    yield put(blocksLengthError());
  }
}
