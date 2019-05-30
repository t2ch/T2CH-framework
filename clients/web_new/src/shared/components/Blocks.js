import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Paper, Grid, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Preloader from './Preloader';
import BlockChart from './BlockChart';

function formatData(data) {
  return data.map(item => ({
    index: item.index,
    hash: item.hash,
    generator: item.generator,
    txs: item.txs.length,
    date: new Date(item.timestamp * 1000).toLocaleString('ru', {
      minutes: 'numeric',
    }),
  }));
}

function sortData(data, direction) {
  if (direction) return data.reverse();
  return data;
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

function Blocks(props) {
  const { data, hasErrored, isLoading, history } = props;
  const classes = useStyles();
  const [direction, setDirection] = useState(true);

  const redirect = to => {
    history.push(`/blocks/${to}`);
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
      <Grid item xs={12}>
        <Paper>
          <Typography align="center" variant="subtitle1">
            Timeline
          </Typography>
          <Divider />
          <div className={classes.chart}>
            <BlockChart data={data} />
          </div>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper style={{ height: '50vh', width: '100%' }}>
          <AutoSizer>
            {({ width, height }) => (
              <MuiTable
                data={sortData(formatData(data), direction)}
                columns={[
                  {
                    name: 'index',
                    header: 'Index',
                    width: 150,
                  },
                  {
                    name: 'hash',
                    header: 'Hash',
                    width: 550,
                  },
                  {
                    name: 'date',
                    header: 'Date',
                    width: 250,
                  },
                  {
                    name: 'generator',
                    header: 'Generator',
                    width: 450,
                  },
                  {
                    name: 'txs',
                    header: 'Txs',
                    minWidth: 150,
                  },
                ]}
                isCellHovered={(
                  column,
                  rowData,
                  hoveredColumn,
                  hoveredRowData
                ) => rowData.index === hoveredRowData.index}
                onHeaderClick={column => {
                  if (column.name === 'index') setDirection(!direction);
                }}
                // eslint-disable-next-line no-shadow
                onCellClick={(column, data) => {
                  redirect(data.hash);
                }}
                width={width}
                height={height}
                fixedRowCount={1}
                fixedColumnCount={1}
                includeHeaders
                orderBy="index"
                orderDirection={direction ? 'desc' : 'asc'}
              />
            )}
          </AutoSizer>
        </Paper>
      </Grid>
    </Grid>
  );
}

Blocks.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(Blocks);
