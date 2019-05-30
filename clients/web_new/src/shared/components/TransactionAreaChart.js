import React from 'react';
import Chart from 'react-google-charts';
import PropTypes from 'prop-types';

function formatData(data) {
  let txStats = {};
  data.forEach(item => {
    const key = new Date(item.timestamp).toLocaleDateString('ru');
    txStats = {
      ...txStats,
      // eslint-disable-next-line no-restricted-globals
      [key]: isNaN(txStats[key]) ? 1 : txStats[key] + 1,
    };
  });

  console.log(txStats);

  return [['date', 'txs'], ...Object.entries(txStats)];
}

function sortData(data) {
  return data.sort((a, b) => {
    if (a.timestamp > b.timestamp) return 1;
    if (a.timestamp < b.timestamp) return -1;
    return 0;
  });
}

export default function TransactionAreaChart({ data }) {
  return (
    <Chart
      width="100%"
      height="100%"
      chartType="AreaChart"
      data={formatData(sortData(data))}
      options={{
        vAxis: { format: '#', minValue: 1 },
        chartArea: { width: '80%', height: '80%' },
        legend: 'none',
      }}
    />
  );
}

TransactionAreaChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({}).isRequired).isRequired,
};
