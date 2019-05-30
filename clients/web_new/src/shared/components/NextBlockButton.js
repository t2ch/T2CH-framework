import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Button from '@material-ui/core/Button';
import NextIcon from '@material-ui/icons/ChevronRight';
import Hidden from '@material-ui/core/Hidden';

export default function NextBlockButton(props) {
  const { length, to } = props;

  return (
    <Button
      variant="outlined"
      color="secondary"
      disabled={to === length}
      component={NavLink}
      to={`${to}`}
    >
      <Hidden implementation="css" smDown>
        next
      </Hidden>
      <NextIcon />
    </Button>
  );
}

NextBlockButton.propTypes = {
  length: PropTypes.number.isRequired,
  to: PropTypes.number.isRequired,
};
