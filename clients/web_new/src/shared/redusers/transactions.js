import { createReducer } from 'redux-act';

import {
  transactionsLoading,
  transactionsSuccess,
  transactionsError,
} from '&/shared/actions/actions';

const initial = {
  transactions: {
    data: [],
    loading: true,
    error: false,
  },
};

export default createReducer(
  {
    [transactionsSuccess]: (state, data) => ({
      ...state,
      loading: false,
      data,
    }),
    [transactionsLoading]: state => ({ ...state, loading: true }),
    [transactionsError]: state => ({ ...state, loading: false, error: true }),
  },
  initial.transactions
);
