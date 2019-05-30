import { createReducer } from 'redux-act';

import {
  blocksLengthLoading,
  blocksLengthSuccess,
  blocksLengthError,
} from '&/shared/actions/actions';

const initial = {
  blocksLength: {
    length: 0,
    loading: true,
    error: false,
  },
};

export default createReducer(
  {
    [blocksLengthSuccess]: (state, length) => ({
      ...state,
      loading: false,
      length,
    }),
    [blocksLengthLoading]: state => ({ ...state, loading: true }),
    [blocksLengthError]: state => ({ ...state, loading: false, error: true }),
  },
  initial.blocksLength
);
