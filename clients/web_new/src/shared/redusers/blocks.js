import { createReducer } from 'redux-act';

import {
  blocksLoading,
  blocksSuccess,
  blocksError,
} from '&/shared/actions/actions';

const initial = {
  blocks: {
    data: [],
    loading: true,
    error: false,
  },
};

export default createReducer(
  {
    [blocksSuccess]: (state, data) => ({
      ...state,
      loading: false,
      data,
    }),
    [blocksLoading]: state => ({ ...state, loading: true }),
    [blocksError]: state => ({ ...state, loading: false, error: true }),
  },
  initial.blocks
);
