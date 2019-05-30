import { connect } from 'react-redux';

import Mempool from '&/shared/components/Mempool';

const mapStateToProps = state => ({
  data: state.mempool.data,
  hasErrored: state.mempool.error,
  isLoading: state.mempool.loading,
});

const ConnectedMempool = connect(mapStateToProps)(Mempool);

export default ConnectedMempool;
