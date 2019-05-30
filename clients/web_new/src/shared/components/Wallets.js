import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import Preloader from './Preloader';

function analizeData(data) {
  const wallets = [];

  data.forEach(tx => {
    if (tx.from !== undefined) {
      const wallet = wallets.find(w => w.wallet === tx.from);

      if (wallet === undefined) wallets.push({ wallet: tx.from, txs: 1 });
      else wallet.txs += 1;

      if (
        tx.data !== undefined &&
        tx.data.type === 'coin' &&
        tx.data.outputs !== undefined &&
        tx.data.outputs.forEach !== undefined
      ) {
        tx.data.outputs.forEach(output => {
          if (output.address !== undefined && output.address !== tx.from) {
            const _wallet = wallets.find(w => w.wallet === output.address);

            if (_wallet === undefined)
              wallets.push({ wallet: output.address, txs: 1 });
            else _wallet.txs += 1;
          }
        });
      }
    }
  });

  return wallets;
}

export default function Wallets({ data, hasErrored, isLoading, history }) {
  const redirect = to => {
    history.push(`/wallets/${to}`);
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
    <Paper style={{ height: '80vh', width: '100%' }}>
      <AutoSizer>
        {({ width, height }) => (
          <MuiTable
            data={analizeData(data)}
            columns={[
              {
                name: 'wallet',
                header: 'Wallet',
                width: 650,
              },
              {
                name: 'txs',
                header: 'Transactions',
                width: 350,
              },
            ]}
            onCellClick={(column, cellData) => {
              redirect(cellData.wallet);
            }}
            isCellHovered={(column, rowData, hoveredColumn, hoveredRowData) =>
              rowData.wallet === hoveredRowData.wallet
            }
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

Wallets.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  data: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};
