import { connect } from 'react-redux';

import Peers from '&/shared/components/Peers';

const mapStateToProps = state => ({
  data: state.peers.data,
  hasErrored: state.peers.error,
  isLoading: state.peers.loading,
});

const ConnectedPeers = connect(mapStateToProps)(Peers);

export default ConnectedPeers;
