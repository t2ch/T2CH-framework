import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import ChevronRight from '@material-ui/icons/ChevronRight';

const splitPath = _path => {
  const crumbs = [];

  let path = _path;
  if (path[path.length - 1] !== '/') path += '/';

  let title = '';
  let sub = '';

  [...path].forEach(c => {
    if (c === '/') {
      crumbs.push({
        title,
        path: sub,
      });
      title = '';
      sub += '/';
    } else {
      title += c;
      sub += c;
    }
  });

  crumbs[0].title = 'home';
  crumbs[crumbs.length - 1].last = true;

  if (crumbs.length > 2)
    switch (crumbs[1].title) {
      case 'blocks':
        crumbs[2].title = 'block';

        if (crumbs.length > 3) {
          crumbs[3].title = 'transaction';
        }

        break;

      case 'transactions':
        crumbs[2].title = 'transaction';
        break;

      case 'mempool':
        crumbs[2].title = 'transaction';
        break;

      case 'wallets':
        crumbs[2].title = 'wallet';

        if (crumbs.length > 3) {
          crumbs[3].title = 'transaction';
        }

        break;

      default:
        break;
    }

  return crumbs;
};

const mapCrumbs = crumbs => {
  let i = 0;
  const row = [];

  crumbs.forEach(crumb => {
    row.push(
      <Button
        size="small"
        key={i}
        color="secondary"
        disabled={crumb.last}
        component={Link}
        to={crumb.path}
      >
        {crumb.title}
      </Button>
    );
    i += 1;
    if (!crumb.last) {
      row.push(<ChevronRight color="secondary" key={i} />);
      i += 1;
    }
  });

  return row;
};

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    padding: theme.spacing.unit,
  },
}));

function Breadcrumbs({ location }) {
  const classes = useStyles();
  const crumbs = splitPath(location.pathname);

  return <div className={classes.root}>{mapCrumbs(crumbs)}</div>;
}

Breadcrumbs.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default withRouter(Breadcrumbs);
