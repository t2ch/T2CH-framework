import { connect } from 'react-redux';

import Wallets from '&/shared/components/Wallets';

const mapStateToProps = state => ({
  data: state.transactions.data,
  hasErrored: state.transactions.error,
  isLoading: state.transactions.loading,
});

const ConnectedWallets = connect(mapStateToProps)(Wallets);

export default ConnectedWallets;
