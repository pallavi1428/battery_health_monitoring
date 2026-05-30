// D:\Li_ion\Li-ion\src\components\RealTimeTrend.jsx
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const RealTimeTrend = ({ liveData, batteryData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize data history with proper values
  const dataHistory = useRef(Array(60).fill(parseFloat(liveData?.voltage) || 3.7));
  
  // Update data history when live data changes
  useEffect(() => {
    if (liveData && liveData.voltage) {
      const newVoltage = parseFloat(liveData.voltage);
      if (!isNaN(newVoltage)) {
        dataHistory.current.push(newVoltage);
        if (dataHistory.current.length > 60) dataHistory.current.shift();
        
        if (chartInstance.current && isInitialized) {
          chartInstance.current.data.datasets[0].data = [...dataHistory.current];
          chartInstance.current.update('none');
        }
      }
    }
  }, [liveData, isInitialized]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Cleanup previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    
    // Ensure we have valid data
    const initialData = dataHistory.current.length === 60 ? 
      dataHistory.current : 
      Array(60).fill(parseFloat(liveData?.voltage) || 3.7);
    
    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(60).fill(''),
        datasets: [{
          label: 'Voltage',
          data: initialData,
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.05)',
          borderWidth: 2,
          fill: true,
          pointRadius: 0,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw?.toFixed(2) || '0.00'} V`
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Last 60 seconds →',
              color: '#888',
              font: { size: 9 }
            },
            ticks: { display: false }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Voltage (V)',
              color: '#888',
              font: { size: 9 }
            },
            min: 3.0,
            max: 4.3,
            grid: { color: '#e8e8e8' }
          }
        }
      }
    });
    
    setIsInitialized(true);
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      setIsInitialized(false);
    };
  }, []); // Only run once on mount
  
  // Safeguard: if no liveData, show placeholder
  if (!liveData) {
    return (
      <div className="bg-white border border-[#d0d0d0] rounded p-4">
        <div className="h-[140px] flex items-center justify-center text-[#999]">
          Waiting for data...
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide font-['Palatino','Georgia',serif]">
          Real-Time Trend
        </h3>
      </div>
      <div className="h-[140px] relative">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default RealTimeTrend;