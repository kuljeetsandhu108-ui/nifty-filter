import React from 'react';
import ReactECharts from 'echarts-for-react';

const PriceChart = ({ data }) => {
  // --- Data Transformation ---
  // ECharts expects data in a specific format: an array of [timestamp, value] arrays.
  // We transform our backend data to match this structure.
  const chartData = data.map(item => [item.time, item.close]);

  // --- ECHARTS OPTION OBJECT ---
  // This is the heart of an ECharts chart. We define everything about the
  // chart's appearance and behavior in this object.
  const option = {
    // A custom, professional tooltip
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      // Formatter function to show date and price with Rupee symbol
      formatter: function (params) {
        const date = new Date(params[0].axisValue).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const price = params[0].value.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR'
        });
        return `${date}<br /><strong>${price}</strong>`;
      }
    },
    // Define the grid padding
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    // X-Axis (Time)
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    // Y-Axis (Price)
    yAxis: {
      type: 'value',
      scale: true, // Allows the axis to scale nicely to fit the data
      axisLabel: {
        formatter: '₹{value}' // Format axis labels with Rupee symbol
      }
    },
    // The Data Series (The Line and Area)
    series: [
      {
        name: 'Price',
        type: 'line',
        smooth: true, // This creates the beautiful, smooth curves
        showSymbol: false, // Hides the dots on data points for a cleaner look
        
        // --- VIBRANT COLORS AND GRADIENTS ---
        lineStyle: {
          width: 3,
          // A stunning linear gradient for the line itself
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{
                offset: 0, color: '#38bdf8' // Vibrant Sky Blue
            }, {
                offset: 1, color: '#a855f7' // Rich Purple
            }]
          }
        },
        // The gradient area fill for the "glowing" effect
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(168, 85, 247, 0.4)' // Lighter purple at the top
            }, {
              offset: 1,
              color: 'rgba(168, 85, 247, 0)' // Fading to transparent
            }]
          }
        },
        data: chartData,
      },
    ],
  };

  // Render the ECharts component with our options
  return (
    <ReactECharts
      option={option}
      style={{ height: '350px', width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
      theme={"dark"}
    />
  );
};

export default PriceChart;