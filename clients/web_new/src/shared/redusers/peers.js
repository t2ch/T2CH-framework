import { createReducer } from 'redux-act';

import {
  peersLoading,
  peersSuccess,
  peersError,
} from '&/shared/actions/actions';

const initial = {
  peers: {
    data: [],
    loading: true,
    error: false,
  },
};

export default createReducer(
  {
    [peersSuccess]: (state, data) => ({
      ...state,
      loading: false,
      data,
    }),
    [peersLoading]: state => ({ ...state, loading: true }),
    [peersError]: state => ({ ...state, loading: false, error: true }),
  },
  initial.peers
);
