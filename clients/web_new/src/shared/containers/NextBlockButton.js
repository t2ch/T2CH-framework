import { connect } from 'react-redux';

import NextBlockButton from '&/shared/components/NextBlockButton';

const mapStateToProps = state => ({
  length: state.blocksLength.length,
});

const ConnectedNextBlockButton = connect(mapStateToProps)(NextBlockButton);

export default ConnectedNextBlockButton;
