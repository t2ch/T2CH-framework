import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import Preloader from './Preloader';

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

export default function Mempool(props) {
  const { data, hasErrored, isLoading } = props;
  const [direction, setDirection] = useState(true);
  const [redirect, setRedirect] = useState(false);
  const [hash, setHash] = useState('');

  if (isLoading) return <Preloader />;
  if (hasErrored) return <h1>Error</h1>;
  if (redirect) return <Redirect push to={`/mempool/${hash}`} />;
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
    <Paper style={{ height: '80vh', width: '100%' }}>
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
            isCellHovered={(column, rowData, hoveredColumn, hoveredRowData) =>
              rowData.hash === hoveredRowData.hash
            }
            onHeaderClick={column => {
              if (column.name === 'date') setDirection(!direction);
            }}
            // eslint-disable-next-line no-shadow
            onCellClick={(column, data) => {
              setHash(data.hash);
              setRedirect(true);
            }}
            width={width}
            maxHeight={height}
            fixedRowCount={1}
            includeHeaders
            orderBy="date"
            orderDirection={direction ? 'desc' : 'asc'}
          />
        )}
      </AutoSizer>
    </Paper>
  );
}

Mempool.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
};
