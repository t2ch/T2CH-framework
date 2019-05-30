import React from 'react';
import Chart from 'react-google-charts';
import PropTypes from 'prop-types';

function formatData(data) {
  let blockStats = {};
  data.forEach(item => {
    const key = new Date(item.timestamp * 1000).toLocaleDateString('ru');
    blockStats = {
      ...blockStats,
      // eslint-disable-next-line no-restricted-globals
      [key]: isNaN(blockStats[key]) ? 1 : blockStats[key] + 1,
    };
  });

  return [['date', 'blocks'], ...Object.entries(blockStats)];
}

export default function BlockChart({ data }) {
  return (
    <Chart
      width="100%"
      height="100%"
      chartType="AreaChart"
      data={formatData(data)}
      options={{
        vAxis: { format: '#', minValue: 1 },
        chartArea: { width: '80%', height: '80%' },
        legend: 'none',
      }}
    />
  );
}

BlockChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({}).isRequired).isRequired,
};
