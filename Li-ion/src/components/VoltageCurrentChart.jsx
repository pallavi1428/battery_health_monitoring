// D:\Li_ion\Li-ion\src\components\VoltageCurrentChart.jsx
import React, { useRef, useEffect } from 'react';

const VoltageCurrentChart = ({ voltageHistory = [], currentHistory = [], title }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || voltageHistory.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const width = container.clientWidth - 32;
    const height = 280;
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#d0d0d0';
    ctx.strokeRect(0, 0, width, height);
    
    if (voltageHistory.length < 2) return;
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Y-axis grid (voltage)
    for (let i = 0; i <= 5; i++) {
      const y = 30 + (i / 5) * (height - 60);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
      
      const voltage = 4.5 - (i / 5) * 2.0;
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.fillText(voltage.toFixed(1) + 'V', 5, y + 3);
    }
    
    // X-axis labels
    const step = Math.max(1, Math.floor(voltageHistory.length / 10));
    for (let i = 0; i < voltageHistory.length; i += step) {
      const x = 50 + (i / (voltageHistory.length - 1)) * (width - 60);
      ctx.fillStyle = '#888';
      ctx.font = '8px monospace';
      ctx.fillText(`${i}`, x - 5, height - 10);
    }
    
    // Draw Voltage line
    const xStep = (width - 60) / (voltageHistory.length - 1);
    const minVoltage = 2.5;
    const maxVoltage = 4.5;
    
    ctx.beginPath();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    
    voltageHistory.forEach((v, i) => {
      const x = 50 + i * xStep;
      const y = 30 + ((maxVoltage - v) / (maxVoltage - minVoltage)) * (height - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw Current line
    ctx.beginPath();
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 1.5;
    
    const maxCurrent = 200;
    currentHistory.forEach((c, i) => {
      const x = 50 + i * xStep;
      const y = 30 + ((maxCurrent - Math.min(maxCurrent, Math.abs(c))) / maxCurrent) * (height - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Voltage', width - 60, 20);
    ctx.fillStyle = '#27ae60';
    ctx.fillText('Current', width - 60, 35);
    
    // Title on canvas
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(title, 10, 15);
    
  }, [voltageHistory, currentHistory, title]);
  
  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-4">
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }}></canvas>
      <div className="text-[0.6rem] text-[#888] text-center mt-2">
        Last {voltageHistory.length} readings | Updates every 2 seconds
      </div>
    </div>
  );
};

export default VoltageCurrentChart;