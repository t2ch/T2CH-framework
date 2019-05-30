import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { withSnackbar } from 'notistack';
import { makeStyles, useTheme } from '@material-ui/styles';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { unstable_useMediaQuery as useMediaQuery } from '@material-ui/core/useMediaQuery';
import InputBase from '@material-ui/core/InputBase';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import SearchIcon from '@material-ui/icons/Search';

import { search } from '&/shared/api';

const useStyles = makeStyles(theme => ({
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing.unit,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '60vw',
    },
  },
  searchIcon: {
    padding: `0 ${theme.spacing.unit}px 0 0`,
    color: 'white',
  },
  searchButtonContainer: {
    width: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: theme.spacing.unit,
  },
  progress: {
    color: 'white',
  },
}));

function SearchBar({ history, enqueueSnackbar }) {
  const classes = useStyles();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  const inputEl = useRef(null);
  const [loading, setLoading] = useState(false);

  const find = async () => {
    if (inputEl.current.value !== '') {
      try {
        setLoading(true);
        const res = await search(inputEl.current.value);
        history.push(`/${res.data}`);
        inputEl.current.value = '';
      } catch (e) {
        enqueueSnackbar('No match data', {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    find();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={classes.search}>
        <InputBase
          placeholder={matches ? 'Search by Tx/Block/Wallet' : 'Search...'}
          inputRef={inputEl}
          classes={{
            root: classes.inputRoot,
            input: classes.inputInput,
          }}
          endAdornment={
            loading ? (
              <div className={classes.searchButtonContainer}>
                <CircularProgress className={classes.progress} size={24} />
              </div>
            ) : (
              <div className={classes.searchButtonContainer}>
                <IconButton onClick={find} className={classes.searchIcon}>
                  <SearchIcon />
                </IconButton>
              </div>
            )
          }
        />
      </div>
    </form>
  );
}

SearchBar.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
};

export default withRouter(withSnackbar(SearchBar));
