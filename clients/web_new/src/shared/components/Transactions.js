import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Paper, Grid, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';

import Preloader from './Preloader';
import TransactionAreaChart from './TransactionAreaChart';
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
    // eslint-disable-next-line no-param-reassign
    if (!direction) [a, b] = [b, a];
    if (a.timestamp > b.timestamp) return -1;
    if (a.timestamp < b.timestamp) return 1;
    return 0;
  });
}

const useStyles = makeStyles({
  grid: {
    width: '100%',
    margin: 0,
    padding: 0,
  },
  chart: {
    width: '100%',
    height: '30vh',
  },
});

function Transactions(props) {
  const { data, hasErrored, isLoading, history } = props;
  const classes = useStyles();
  const [direction, setDirection] = useState(true);

  const redirect = to => {
    history.push(`/transactions/${to}`);
  };

  if (isLoading) return <Preloader />;
  if (hasErrored) return <h1>Error</h1>;
  if (data === null || Object.entries(data).length === 0)
    return (
      <Grid container spacing={16} justify="center">
        <Grid item xs={12}>
          <Typography align="center" variant="h6">
            The response from the server has no data.
          </Typography>
        </Grid>
      </Grid>
    );

  return (
    <Grid container spacing={16} className={classes.grid} justify="center">
      <Grid item xs={12} sm={6}>
        <Paper>
          <Typography align="center" variant="subtitle1">
            Timeline
          </Typography>
          <Divider />
          <div className={classes.chart}>
            <TransactionAreaChart data={data} />
          </div>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Typography align="center" variant="subtitle1">
            Types of transactions
          </Typography>
          <Divider />
          <div className={classes.chart}>
            <TransactionBarChart data={data} />
          </div>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper style={{ height: '45vh', width: '100%' }}>
          <AutoSizer>
            {({ width, height }) => (
              <MuiTable
                data={sortData(formatData(data), direction)}
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
        </Paper>
      </Grid>
    </Grid>
  );
}

Transactions.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(Transactions);
