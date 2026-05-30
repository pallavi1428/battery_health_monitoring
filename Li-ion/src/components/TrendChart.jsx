// D:\Li_ion\Li-ion\src\components\TrendChart.jsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TrendChart = ({ liveReadings, batteryData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const voltageHistory = useRef([]);
  const currentHistory = useRef([]);
  const timeLabels = useRef([]);

  useEffect(() => {
    if (!liveReadings) return;

    // Update history
    voltageHistory.current.push(parseFloat(liveReadings.voltage));
    currentHistory.current.push(parseFloat(liveReadings.current));
    timeLabels.current.push(new Date().toLocaleTimeString());

    // Keep last 20 points
    if (voltageHistory.current.length > 20) {
      voltageHistory.current.shift();
      currentHistory.current.shift();
      timeLabels.current.shift();
    }

    if (chartInstance.current) {
      chartInstance.current.data.datasets[0].data = [...voltageHistory.current];
      chartInstance.current.data.datasets[1].data = [...currentHistory.current];
      chartInstance.current.data.labels = [...timeLabels.current];
      chartInstance.current.update();
    }
  }, [liveReadings]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeLabels.current,
        datasets: [
          {
            label: 'Voltage (V)',
            data: voltageHistory.current,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#3b82f6'
          },
          {
            label: 'Current (mA)',
            data: currentHistory.current,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#10b981',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Voltage (V)',
              color: '#3b82f6'
            },
            min: 3.0,
            max: 4.5,
            grid: {
              color: '#e5e7eb'
            }
          },
          y1: {
            position: 'right',
            title: {
              display: true,
              text: 'Current (mA)',
              color: '#10b981'
            },
            min: 0,
            max: 250,
            grid: {
              drawOnChartArea: false
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time',
              color: '#6b7280'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">📈 Real-time Trend</h2>
          <p className="text-xs text-gray-500 mt-1">Last 20 readings - updates every 2 seconds</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Voltage</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Current</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-center text-xs text-gray-500">
        {liveReadings ? (
          <span>🟢 Live data streaming • Voltage {liveReadings.voltage}V • Current {liveReadings.current}mA</span>
        ) : (
          <span>⏳ Waiting for data...</span>
        )}
      </div>
    </div>
  );
};

export default TrendChart;