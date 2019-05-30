import { connect } from 'react-redux';

import Transactions from '&/shared/components/Transactions';

const mapStateToProps = state => ({
  data: state.transactions.data,
  hasErrored: state.transactions.error,
  isLoading: state.transactions.loading,
});

const ConnectedTransactions = connect(mapStateToProps)(Transactions);

export default ConnectedTransactions;
