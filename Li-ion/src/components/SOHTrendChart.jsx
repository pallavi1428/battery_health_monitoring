// D:\Li_ion\Li-ion\src\components\SOHTrendChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const SOHTrendChart = ({ sohHistory, prediction, title }) => {
  // Prepare data for chart
  const chartData = sohHistory.map((soh, index) => ({
    index: index + 1,
    soh: soh,
    rul: prediction?.rul_cycles || 0
  }));

  // Add prediction line
  const currentSOH = sohHistory[sohHistory.length - 1] || 100;
  const predictedSOH = currentSOH - (prediction?.degradation_rate * 100 || 0);
  
  const extendedData = [
    ...chartData,
    { index: chartData.length + 1, soh: predictedSOH, predicted: true }
  ];

  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-4">
      <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide mb-3 font-['Palatino','Georgia',serif]">
        📉 {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={extendedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="index" 
            label={{ value: 'Reading (last 50)', position: 'insideBottom', offset: -5, fontSize: 10 }}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            label={{ value: 'State of Health (%)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ fontSize: '11px', backgroundColor: 'white', border: '1px solid #ccc' }}
            formatter={(value) => [value.toFixed(1), 'SOH (%)']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" label={{ value: 'EOL (70%)', position: 'right', fontSize: 10 }} />
          <ReferenceLine y={80} stroke="orange" strokeDasharray="3 3" label={{ value: 'Warning (80%)', position: 'right', fontSize: 10 }} />
          
          <Area
            type="monotone"
            dataKey="soh"
            fill="#3498db"
            stroke="#2980b9"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="SOH Trend"
          />
          
          {prediction && (
            <Line
              type="monotone"
              dataKey="rul"
              stroke="#e74c3c"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="Predicted RUL"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* SOH Status Summary */}
      <div className="mt-3 pt-3 border-t border-[#eee]">
        <div className="grid grid-cols-3 gap-2 text-center text-[0.65rem]">
          <div>
            <span className="text-[#666]">Current SOH:</span>
            <span className="ml-1 font-bold text-[#2c3e50]">
              {sohHistory[sohHistory.length - 1]?.toFixed(1) || '--'}%
            </span>
          </div>
          <div>
            <span className="text-[#666]">EOL Threshold:</span>
            <span className="ml-1 font-bold text-[#e74c3c]">70%</span>
          </div>
          <div>
            <span className="text-[#666]">Remaining:</span>
            <span className="ml-1 font-bold text-[#27ae60]">
              {((sohHistory[sohHistory.length - 1] || 100) - 70).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2 text-[0.55rem] text-[#888] text-center">
          SOH above 80% = Good | 70-80% = Warning | Below 70% = End of Life
        </div>
      </div>
    </div>
  );
};

export default SOHTrendChart;