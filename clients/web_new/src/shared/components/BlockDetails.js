import React, { useState, useEffect } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';

import PrevIcon from '@material-ui/icons/ChevronLeft';

import { fetchBlock } from '&/shared/api';
import Preloader from './Preloader';
import NextBlockButton from '&/shared/containers/NextBlockButton';
import TransactionBarChart from './TransactionBarChart';

function formatData(data) {
  return data.map(item => ({
    hash: item.hash,
    type: item.data.type,
    from: item.from,
    date: new Date(item.timestamp).toLocaleString('ru', {
      minutes: 'numeric',
    }),
    timestamp: item.timestamp,
  }));
}

function sortData(data, direction) {
  return data.sort((a, b) => {
    let result = 0;

    if (a.timestamp > b.timestamp) result = -1;
    if (a.timestamp < b.timestamp) result = 1;
    if (!direction) result = -result;

    return result;
  });
}

const useStyles = makeStyles(theme => ({
  grid: {
    width: '100%',
    margin: 0,
    padding: 0,
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    minHeight: '40vh',
  },
  chart: {
    width: '100%',
    height: '30vh',
  },
  info: {
    padding: theme.spacing.unit,
  },
  dataItem: {
    padding: `0 0 ${theme.spacing.unit * 2}px 0`,
  },
}));

function BlockDetails({ match, history }) {
  const classes = useStyles();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [direction, setDirection] = useState(true);

  const fetchData = async arg => {
    try {
      setData((await fetchBlock(arg)).data);
      setLoading(false);
    } catch (e) {
      setErrored(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(match.params.hash);
  }, [match.params.hash]);

  const redirect = to => {
    history.push(`${match.url}/${to}`);
  };

  if (loading) return <Preloader />;
  if (errored) return <h1>Error</h1>;
  if (data === null || Object.entries(data).length === 0)
    return (
      <Grid container spacing={16} className={classes.grid} justify="center">
        <Grid item xs={12}>
          <Typography align="center" variant="h6">
            The response from the server has no data.
          </Typography>
        </Grid>
      </Grid>
    );

  return (
    <Grid container spacing={16} className={classes.grid} justify="center">
      <Grid item xs={12}>
        <div className={classes.header}>
          <Button
            disabled={data.index === 0}
            component={NavLink}
            to={data.previousHash}
            variant="outlined"
            color="secondary"
          >
            <PrevIcon />
            <Hidden implementation="css" smDown>
              prev
            </Hidden>
          </Button>
          <Typography align="center" variant="h6">
            {`Block #${data.index}${data.txs.length !== 0 ? '' : ' (Empty)'}`}
          </Typography>
          <NextBlockButton to={data.index + 1} />
        </div>
      </Grid>
      <Grid item xs={12} sm={data.txs.length !== 0 ? 6 : 12}>
        <Paper>
          <Typography align="center" variant="subtitle1">
            General Info
          </Typography>
          <Divider />
          <div className={classes.card}>
            <div className={classes.info}>
              {Object.entries(data).map(field => {
                if (field[0] === 'txs') return <div key={field[0]} />;
                return (
                  <React.Fragment key={`${field[0]}__block`}>
                    <Typography
                      variant="body1"
                      style={{
                        width: '100%',
                        wordBreak: 'break-all',
                        fontWeight: '500',
                      }}
                      key={`${field[0]}__name`}
                      color="textPrimary"
                    >
                      {`${field[0]}:`}
                    </Typography>
                    <Typography
                      variant="body1"
                      style={{
                        wordBreak: 'break-all',
                        marginLeft: '10px',
                        marginBottom: '10px',
                      }}
                      key={`${field[0]}__value`}
                      color="textPrimary"
                    >
                      {field[1]}
                    </Typography>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </Paper>
      </Grid>
      {data.txs.length !== 0 && (
        <Grid
          direction="column"
          container
          className={classes.grid}
          spacing={0}
          item
          xs={12}
          sm={6}
        >
          <Grid className={classes.dataItem} item>
            <Paper>
              <Typography align="center" variant="subtitle1">
                Types of transactions
              </Typography>
              <Divider />
              <div className={classes.chart}>
                <TransactionBarChart data={data.txs} />
              </div>
            </Paper>
          </Grid>
          <Grid className={classes.dataItem} item>
            <Paper>
              <Typography align="center" variant="subtitle1">
                Transactions
              </Typography>
              <Divider />
              <div className={classes.card}>
                <AutoSizer>
                  {({ width, height }) => (
                    <MuiTable
                      data={sortData(formatData(data.txs), direction)}
                      columns={[
                        {
                          name: 'type',
                          header: 'Type',
                          width: 150,
                        },
                        {
                          name: 'date',
                          header: 'Date',
                          width: 220,
                        },
                        {
                          name: 'hash',
                          header: 'Hash',
                          width: 550,
                        },
                        {
                          name: 'from',
                          header: 'From',
                        },
                      ]}
                      isCellHovered={(
                        column,
                        rowData,
                        hoveredColumn,
                        hoveredRowData
                      ) => rowData.hash === hoveredRowData.hash}
                      onHeaderClick={column => {
                        if (column.name === 'date') setDirection(!direction);
                      }}
                      // eslint-disable-next-line no-shadow
                      onCellClick={(column, data) => {
                        redirect(data.hash);
                      }}
                      width={width}
                      height={height}
                      fixedRowCount={1}
                      includeHeaders
                      orderBy="date"
                      orderDirection={direction ? 'desc' : 'asc'}
                    />
                  )}
                </AutoSizer>
              </div>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}

BlockDetails.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      hash: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(BlockDetails);
