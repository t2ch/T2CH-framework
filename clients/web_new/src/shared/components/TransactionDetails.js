import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import MuiTable from 'mui-virtualized-table';
import { AutoSizer } from 'react-virtualized';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';

import { fetchTransaction, fetchMempoolTx } from '&/shared/api';
import Preloader from './Preloader';

function formatGeneral(data) {
  if (data === null || Object.entries(data).length === 0) return {};

  const { data: txData, timestamp, ...rest } = data;

  return {
    date: new Date(timestamp).toLocaleString('ru', {
      minutes: 'numeric',
    }),
    timestamp,
    ...rest,
  };
}

function formatData(data) {
  // eslint-disable-next-line no-param-reassign
  if (data.data === undefined) data.data = [];
  const fields = Object.entries(data.data);

  const nonArrays = [];
  const listArrays = [];
  const tableArrays = [];

  const fieldToObj = field => ({
    name: field[0],
    value: field[1],
  });

  fields.forEach(field => {
    if (Array.isArray(field[1])) {
      if (field[1].length === 0 || !(field[1][0] instanceof Object))
        listArrays.push(fieldToObj(field));
      else tableArrays.push(fieldToObj(field));
    } else {
      nonArrays.push(fieldToObj(field));
    }
  });

  listArrays.forEach(field => {
    // eslint-disable-next-line no-param-reassign
    field.value = field.value.map(item => ({
      value: item,
    }));
  });

  return {
    nonArrays,
    listArrays,
    tableArrays,
  };
}

function formColumns(field) {
  const names = [];
  const lengths = [];

  Object.entries(field.value[0]).forEach(prop => {
    names.push(prop[0]);
    lengths.push(`${prop[0]}`.length);
  });

  const count = names.length;

  for (let i = 0; i < field.value.length; i += 1) {
    const props = Object.entries(field.value[i]);

    for (let j = 0; j < count; j += 1) {
      const { length } = `${props[j][1]}`;
      if (lengths[j] < length) lengths[j] = length;
    }
  }

  const columns = [];
  for (let j = 0; j < count; j += 1) {
    columns.push({
      name: names[j],
      header: names[j],
      width: lengths[j] * 10 + 60,
    });
  }

  return columns;
}

function renderData({ nonArrays, listArrays, tableArrays }, classes) {
  return (
    <Grid
      container
      className={classes.grid}
      direction="column"
      spacing={0}
      item
      xs={12}
      sm={6}
    >
      <Grid className={classes.dataItem} item>
        <Paper>
          <Typography align="center" variant="subtitle1">
            Data
          </Typography>
          <Divider />
          <div className={classes.card}>
            <div className={classes.info}>
              {nonArrays.map(field => (
                <React.Fragment key={field.name}>
                  <Typography
                    variant="body1"
                    style={{
                      width: '100%',
                      wordBreak: 'break-all',
                      fontWeight: '500',
                    }}
                    color="textPrimary"
                  >
                    {`${field.name}:`}
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
                    {field.value}
                  </Typography>
                </React.Fragment>
              ))}
            </div>
          </div>
        </Paper>
      </Grid>

      {listArrays.map(field => (
        <Grid className={classes.dataItem} item key={field.name}>
          <Paper>
            <Typography align="center" variant="subtitle1">
              {field.name}
            </Typography>
            <Divider />
            <div className={classes.card}>
              <AutoSizer>
                {({ width, height }) => (
                  <MuiTable
                    data={field.value}
                    columns={[
                      {
                        name: 'value',
                        header: field.name,
                      },
                    ]}
                    width={width}
                    height={height}
                  />
                )}
              </AutoSizer>
            </div>
          </Paper>
        </Grid>
      ))}

      {tableArrays.map(field => (
        <Grid className={classes.dataItem} item key={field.name}>
          <Paper>
            <Typography align="center" variant="subtitle1">
              {field.name}
            </Typography>
            <Divider />
            <div className={classes.card}>
              <AutoSizer>
                {({ width, height }) => (
                  <MuiTable
                    data={field.value}
                    columns={formColumns(field)}
                    width={width}
                    height={height}
                    includeHeaders
                    fixedRowCount={1}
                  />
                )}
              </AutoSizer>
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
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
    minHeight: '30vh',
  },
  info: {
    padding: theme.spacing.unit,
  },
  dataItem: {
    padding: `${theme.spacing.unit}px 0 ${theme.spacing.unit}px 0`,
  },
}));

export default function TransactionDetails({ match }) {
  const classes = useStyles();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const fetchData = async arg => {
    try {
      if (match.path.slice(1, 8) === 'mempool') {
        setData((await fetchMempoolTx(arg)).data);
      } else {
        setData((await fetchTransaction(arg)).data);
      }
      setLoading(false);
    } catch (e) {
      setErrored(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(match.params.hash);
  }, [match.params.hash]);

  if (loading) return <Preloader />;
  if (errored) return <h1>Error</h1>;
  return (
    <Grid container spacing={16} className={classes.grid} justify="center">
      <Grid item xs={12}>
        <div className={classes.header}>
          <Typography variant="h6" style={{ padding: '5px' }}>
            Transaction Details
          </Typography>
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Typography align="center" variant="subtitle1">
            General Info
          </Typography>
          <Divider />
          <div className={classes.card}>
            <div className={classes.info}>
              {Object.entries(formatGeneral(data)).map(field => (
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
              ))}
            </div>
          </div>
        </Paper>
      </Grid>

      {renderData(formatData(data), classes)}
    </Grid>
  );
}

TransactionDetails.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      hash: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

renderData.propTypes = {
  nonArrays: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  listArrays: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableArrays: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};
