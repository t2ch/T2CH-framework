import { combineReducers } from 'redux';
import blocks from './blocks';
import transactions from './transactions';
import mempool from './mempool';
import blocksLength from './blocksLength';
import peers from './peers';

export default combineReducers({
  blocksLength,
  blocks,
  transactions,
  mempool,
  peers,
});
