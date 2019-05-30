import { createReducer } from 'redux-act';

import {
  mempoolLoading,
  mempoolSuccess,
  mempoolError,
} from '&/shared/actions/actions';

const initial = {
  mempool: {
    data: [],
    loading: true,
    error: false,
  },
};

export default createReducer(
  {
    [mempoolSuccess]: (state, data) => ({
      ...state,
      loading: false,
      data,
    }),
    [mempoolLoading]: state => ({ ...state, loading: true }),
    [mempoolError]: state => ({ ...state, loading: false, error: true }),
  },
  initial.mempool
);
