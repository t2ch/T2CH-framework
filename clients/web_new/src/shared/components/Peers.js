import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import Preloader from './Preloader';

function formatData(data) {
  return data.map(({ key, value }) => ({
    ip: key,
    status: value === 0 ? 'Online' : 'Offline',
  }));
}

export default function Peers(props) {
  const { data, hasErrored, isLoading } = props;

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
    <Paper style={{ height: '80vh', width: '100%' }}>
      <AutoSizer>
        {({ width, height }) => (
          <MuiTable
            data={formatData(data)}
            columns={[
              {
                name: 'ip',
                header: 'IP',
                width: 250,
              },
              {
                name: 'status',
                header: 'Status',
                width: 150,
              },
            ]}
            width={width}
            maxHeight={height}
            fixedRowCount={1}
            includeHeaders
          />
        )}
      </AutoSizer>
    </Paper>
  );
}

Peers.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
};
