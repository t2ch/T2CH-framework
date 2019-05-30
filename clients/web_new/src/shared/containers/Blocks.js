import { connect } from 'react-redux';

import Blocks from '&/shared/components/Blocks';

const mapStateToProps = state => ({
  data: state.blocks.data,
  hasErrored: state.blocks.error,
  isLoading: state.blocks.loading,
});

const ConnectedBlocks = connect(mapStateToProps)(Blocks);

export default ConnectedBlocks;
