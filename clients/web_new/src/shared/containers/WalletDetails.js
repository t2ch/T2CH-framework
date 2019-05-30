import { connect } from 'react-redux';

import WalletDetails from '&/shared/components/WalletDetails';

const mapStateToProps = state => ({
  txs: state.transactions.data,
  blocks: state.blocks.data,
  hasErrored: state.transactions.error,
  isLoading: state.transactions.loading,
});

const ConnectedWalletDetails = connect(mapStateToProps)(WalletDetails);

export default ConnectedWalletDetails;
