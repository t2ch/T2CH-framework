import { call, put } from 'redux-saga/effects';

import { fetchTransactions } from '&/shared/api';
import {
  transactionsLoading,
  transactionsSuccess,
  transactionsError,
} from '&/shared/actions/actions';

export default function* fetchTransactionsSaga() {
  yield put(transactionsLoading());
  try {
    const response = yield call(fetchTransactions);
    const { data } = response;
    yield put(transactionsSuccess(data));
  } catch (error) {
    yield put(transactionsError());
  }
}
