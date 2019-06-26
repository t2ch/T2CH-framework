import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';

import Breadcrumbs from '&/shared/components/Breadcrumbs';
import DrawerList from '&/shared/components/DrawerList';
import SearchBar from '&/shared/components/SearchBar';

import routes from '&/shared/routes';
import {
  fetchBlocks as fetchBlocksAction,
  fetchTransactions as fetchTransactionsAction,
  fetchMempool as fetchMempoolAction,
  fetchBlocksLength as fetchBlocksLengthAction,
  fetchPeers as fetchPeersAction,
} from '&/shared/actions/actions';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: theme.drawerWidth,
      flexShrink: 0,
    },
  },
  header: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: theme.drawerWidth,
  },
  content: {
    minWidth: 250,
    width: '100%',
    padding: theme.spacing.unit * 3,
  },
  grow: {
    flexGrow: 1,
  },
}));

function App(props) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const {
    fetchBlocks,
    fetchTransactions,
    fetchMempool,
    fetchBlocksLength,
    fetchPeers,
  } = props;

  useEffect(() => {
    fetchBlocksLength();
  }, []);
  useEffect(() => {
    fetchBlocks();
  }, []);
  useEffect(() => {
    fetchTransactions();
  }, []);
  useEffect(() => {
    fetchMempool();
  }, []);
  useEffect(() => {
    fetchPeers();
  }, []);

  return (
    <div className={classes.root}>
      <AppBar className={classes.header} position="fixed" color="primary">
        <Toolbar>
          <IconButton
            className={classes.menuButton}
            color="inherit"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Hidden implementation="css" smDown>
            <Typography variant="h6" color="inherit">
              Smart-tips Block Explorer
            </Typography>
          </Hidden>
          <div className={classes.grow} />
          <SearchBar />
        </Toolbar>
      </AppBar>
      <Hidden implementation="css" mdUp>
        <Drawer
          className={classes.drawer}
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="temporary"
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
        >
          <Toolbar>
            <div style={{ flexGrow: 1 }} />
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <DrawerList handleClose={() => setOpen(false)} />
        </Drawer>
      </Hidden>
      <Hidden implementation="css" smDown>
        <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.toolbar} />
          <DrawerList />
        </Drawer>
      </Hidden>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Breadcrumbs />
        <Switch>
          {routes.map(({ path, exact, component: Component, ...rest }) => (
            <Route
              key={path}
              path={path}
              exact={exact}
              // eslint-disable-next-line no-shadow
              render={props => <Component {...props} {...rest} />}
            />
          ))}
        </Switch>
      </main>
    </div>
  );
}

App.propTypes = {
  fetchBlocks: PropTypes.func.isRequired,
  fetchTransactions: PropTypes.func.isRequired,
  fetchMempool: PropTypes.func.isRequired,
  fetchBlocksLength: PropTypes.func.isRequired,
  fetchPeers: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  fetchBlocks: () => dispatch(fetchBlocksAction()),
  fetchTransactions: () => dispatch(fetchTransactionsAction()),
  fetchMempool: () => dispatch(fetchMempoolAction()),
  fetchBlocksLength: () => dispatch(fetchBlocksLengthAction()),
  fetchPeers: () => dispatch(fetchPeersAction()),
});

export default withRouter(
  connect(
    null,
    mapDispatchToProps
  )(App)
);
