import React from 'react';
import Chart from 'react-google-charts';
import PropTypes from 'prop-types';

function formatData(data) {
  let txStats = {};
  data.forEach(item => {
    const key = item.data.type;
    txStats = {
      ...txStats,
      // eslint-disable-next-line no-restricted-globals
      [key]: txStats[key] === undefined ? 1 : txStats[key] + 1,
    };
  });

  return [['date', 'txs'], ...Object.entries(txStats)];
}

export default function TransactionBarChart({ data }) {
  return (
    <Chart
      width="100%"
      height="100%"
      chartType="ColumnChart"
      data={formatData(data)}
      options={{
        chartArea: { width: '80%', height: '80%' },
        legend: 'none',
        hAxis: {
          minValue: 0,
        },
        vAxis: {
          format: '#',
          title: 'Transactions',
        },
      }}
      legendToggle
    />
  );
}

TransactionBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({}).isRequired).isRequired,
};
