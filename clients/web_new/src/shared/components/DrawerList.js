import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, withRouter } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

function DrawerList(props) {
  const { location, handleClose } = props;
  return (
    <>
      <List>
        <ListItem
          button
          onClick={handleClose}
          component={NavLink}
          selected={location.pathname === '/'}
          key="Home"
          to="/"
        >
          <ListItemText>Home</ListItemText>
        </ListItem>
        {['Blocks', 'Transactions', 'Mempool', 'Peers', 'Wallets'].map(item => {
          return (
            <ListItem
              button
              onClick={handleClose}
              component={NavLink}
              selected={location.pathname.startsWith(`/${item.toLowerCase()}`)}
              key={item}
              to={`/${item.toLowerCase()}`}
            >
              <ListItemText>{item}</ListItemText>
            </ListItem>
          );
        })}
      </List>
    </>
  );
}

DrawerList.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
  handleClose: PropTypes.func,
};

DrawerList.defaultProps = {
  handleClose: () => {},
};

export default withRouter(DrawerList);
