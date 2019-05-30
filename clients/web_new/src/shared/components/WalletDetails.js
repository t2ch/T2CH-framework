import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';

import Preloader from './Preloader';

const UNDEF_ALIAS = '---';

function checkTx(wallet, genHash, tx) {
  if (tx === undefined || tx.data === undefined || tx.data.type !== 'coin')
    return {
      amount: UNDEF_ALIAS,
      isFrom: false,
      isTo: false,
      isElse: tx !== undefined && tx.from === wallet,
    };

  let amount = 0;
  let isFrom = false;
  let isTo = false;

  // условие отнимать инпуты транзакции от баланса
  // (источник средств - сам этот кошелек)
  if (tx.from === wallet && tx.hash !== genHash) {
    if (tx.data.inputs !== undefined) {
      tx.data.inputs.forEach(input => {
        if (input.amount !== undefined) amount -= input.amount;
      });
    }
  }

  // прибавить все аутпуты с адресом этого кошелька к балансу
  if (tx.data.outputs !== undefined) {
    tx.data.outputs.forEach(output => {
      if (output.amount !== undefined) {
        if (output.address === wallet) {
          amount += output.amount;

          // не считать поступление от себя же входящим, кроме генезисного
          if (tx.hash === genHash || tx.from !== wallet) isTo = true;
        } else if (tx.from === wallet) isFrom = true; // от себя куда-то - считать исходящим
      }
    });
  }

  return {
    amount,
    isFrom,
    isTo,
    isElse: !(isFrom || isTo) && tx.from === wallet,
  };
}

function formatData(wallet, blocks, txs, showFrom, showTo, showElse) {
  let balance = 0;
  const rows = [];

  const genBlock = blocks.find(block => block.index === 0);
  const genHash = genBlock === undefined ? undefined : genBlock.txs[0].hash;

  if (genHash === undefined) {
    balance = UNDEF_ALIAS;
    console.log(
      'Could not calculate the balance and amounts properly as the genesis tx was not found.'
    );
  }

  txs.forEach(tx => {
    const { amount, isFrom, isTo, isElse } = checkTx(wallet, genHash, tx);

    if (balance !== UNDEF_ALIAS && amount !== UNDEF_ALIAS) balance += amount;

    if ((showFrom && isFrom) || (showTo && isTo) || (showElse && isElse)) {
      rows.push({
        type: tx.data.type !== undefined ? tx.data.type : UNDEF_ALIAS,
        amount,
        hash: tx.hash !== undefined ? tx.hash : UNDEF_ALIAS,
        from: tx.from !== undefined ? tx.from : UNDEF_ALIAS,
        timestamp: tx.timestamp !== undefined ? tx.timestamp : UNDEF_ALIAS,
        date:
          tx.timestamp !== undefined
            ? new Date(tx.timestamp).toLocaleString('ru', {
                minutes: 'numeric',
              })
            : UNDEF_ALIAS,
      });
    }
  });

  return [balance, rows];
}

function sortData(data, orderBy, direction) {
  const criterion = obj => {
    let returns;

    if (orderBy === 'date') returns = obj.timestamp;
    else returns = obj[orderBy];

    if (returns !== undefined) returns = returns.toString();
    else returns = '';

    return returns;
  };

  return data.sort((a, b) => {
    let result = 0;

    const [A, B] = [criterion(a), criterion(b)];

    // eslint-disable-next-line no-constant-condition
    if ([A, B] === [UNDEF_ALIAS, UNDEF_ALIAS]) return 0;
    if (A === UNDEF_ALIAS) return 1;
    if (B === UNDEF_ALIAS) return -1;

    result = criterion(b).localeCompare(criterion(a));
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
  content: {
    width: '100%',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    minHeight: '75vh',
  },
  info: {
    padding: theme.spacing.unit,
  },
  dataItem: {
    padding: `${theme.spacing.unit}px 0 ${theme.spacing.unit}px 0`,
  },
  chip: {
    margin: `${theme.spacing.unit}px 0 ${theme.spacing.unit}px ${
      theme.spacing.unit
    }px`,
  },
}));

export default function WalletDetails({
  match: {
    params: { wallet },
  },
  txs,
  blocks,
  hasErrored,
  isLoading,
  history,
}) {
  const classes = useStyles();

  const [direction, setDirection] = useState(true);
  const [showFrom, setShowFrom] = useState(true);
  const [showTo, setShowTo] = useState(true);
  const [showElse, setShowElse] = useState(true);
  const [orderBy, setOrderBy] = useState('date');

  const redirect = tx => {
    history.push(`/wallets/${wallet}/${tx}`);
  };

  if (isLoading) return <Preloader />;
  if (hasErrored) return <h1>Error</h1>;
  if (
    txs === null ||
    Object.entries(txs).length === 0 ||
    txs === null ||
    Object.entries(txs).length === 0
  )
    return (
      <Grid container spacing={16} className={classes.grid} justify="center">
        <Grid item xs={12}>
          <Typography align="center" variant="h6">
            The response from the server has no data.
          </Typography>
        </Grid>
      </Grid>
    );

  const [balance, rows] = formatData(
    wallet,
    blocks,
    txs,
    showFrom,
    showTo,
    showElse
  );

  return (
    <Grid container spacing={16} className={classes.grid} justify="center">
      <Grid item xs={12} sm={6} style={{ minWidth: '75vw' }}>
        <Paper>
          <Typography align="center" variant="h6" style={{ padding: '5px' }}>
            Wallet Details
          </Typography>
          <Divider />

          <div className={classes.info}>
            <Typography
              variant="body1"
              style={{
                width: '100%',
                wordBreak: 'break-all',
                fontWeight: '500',
              }}
              color="textPrimary"
            >
              ID:
            </Typography>
            <Typography
              variant="body1"
              style={{
                wordBreak: 'break-all',
                marginLeft: '10px',
                marginBottom: '10px',
              }}
              color="textPrimary"
            >
              {wallet}
            </Typography>
            <Typography
              variant="body1"
              style={{
                width: '100%',
                wordBreak: 'break-all',
                fontWeight: '500',
              }}
              color="textPrimary"
            >
              Balance:
            </Typography>
            <Typography
              variant="body1"
              style={{
                wordBreak: 'break-all',
                marginLeft: '10px',
                marginBottom: '0px',
              }}
              color="textPrimary"
            >
              {balance}
            </Typography>
          </div>

          <Chip
            label="Show outgoing transactions"
            clickable
            className={classes.chip}
            variant="outlined"
            color={showFrom ? 'secondary' : 'default'}
            deleteIcon={showFrom ? <DoneIcon /> : <ClearIcon />}
            onClick={() => setShowFrom(!showFrom)}
            onDelete={() => {}}
          />
          <Chip
            label="Show incoming transactions"
            clickable
            className={classes.chip}
            variant="outlined"
            color={showTo ? 'secondary' : 'default'}
            deleteIcon={showTo ? <DoneIcon /> : <ClearIcon />}
            onClick={() => setShowTo(!showTo)}
            onDelete={() => {}}
          />
          <Chip
            label="Show other transactions"
            clickable
            className={classes.chip}
            variant="outlined"
            color={showElse ? 'secondary' : 'default'}
            deleteIcon={showElse ? <DoneIcon /> : <ClearIcon />}
            onClick={() => setShowElse(!showElse)}
            onDelete={() => {}}
          />

          <Divider />

          <div className={classes.card}>
            <AutoSizer>
              {({ width, height }) => (
                <MuiTable
                  data={sortData(rows, orderBy, direction)}
                  columns={[
                    {
                      name: 'date',
                      header: 'Date',
                      width: 220,
                    },
                    {
                      name: 'type',
                      header: 'Type',
                      width: 150,
                    },
                    {
                      name: 'amount',
                      header: 'Total amount',
                      width: 220,
                    },
                    {
                      name: 'from',
                      header: 'From',
                      width: 380,
                    },
                    {
                      name: 'hash',
                      header: 'Hash',
                      width: 530,
                    },
                  ]}
                  isCellHovered={(
                    column,
                    rowData,
                    hoveredColumn,
                    hoveredRowData
                  ) => rowData.hash === hoveredRowData.hash}
                  onHeaderClick={column => {
                    if (column.name === orderBy) setDirection(!direction);
                    else setOrderBy(column.name);
                  }}
                  // eslint-disable-next-line no-shadow
                  onCellClick={(column, data) => {
                    if (data.hash !== UNDEF_ALIAS) redirect(data.hash);
                  }}
                  width={width}
                  height={height}
                  fixedRowCount={1}
                  includeHeaders
                  orderBy={orderBy}
                  orderDirection={direction ? 'desc' : 'asc'}
                />
              )}
            </AutoSizer>
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
}

WalletDetails.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasErrored: PropTypes.bool.isRequired,
  txs: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
  blocks: PropTypes.arrayOf(PropTypes.any.isRequired).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      wallet: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};
