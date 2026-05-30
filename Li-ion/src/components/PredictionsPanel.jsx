// D:\Li_ion\Li-ion\src\components\PredictionsPanel.jsx
import React from 'react';

const PredictionsPanel = ({ prediction, batteryData, liveData }) => {
  if (!prediction) {
    return (
      <div className="bg-white border border-[#d0d0d0] rounded p-5 h-full">
        <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide mb-4 font-['Palatino','Georgia',serif]">
          RUL Prediction
        </h3>
        <div className="flex items-center justify-center h-40 text-[#999]">
          Waiting for data...
        </div>
      </div>
    );
  }

  const confidenceColor = prediction.confidence > 85 ? '#27ae60' : prediction.confidence > 70 ? '#e67e22' : '#c0392b';

  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-5 h-full">
      <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide mb-4 font-['Palatino','Georgia',serif]">
        RUL Prediction
      </h3>
      
      {/* Main RUL Number */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold text-[#2c3e50] font-mono">
          {prediction.rul_cycles}
        </div>
        <div className="text-[0.7rem] text-[#888]">cycles remaining</div>
      </div>
      
      {/* Time Equivalent */}
      <div className="text-center mb-4 p-2 bg-[#f0f4f8] rounded">
        <div className="text-lg font-semibold text-[#2c3e50]">
          ≈ {prediction.time_remaining_hours} hours
        </div>
        <div className="text-[0.6rem] text-[#888]">at current discharge rate</div>
      </div>
      
      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[0.65rem] mb-1">
          <span>Confidence</span>
          <span>{prediction.confidence}%</span>
        </div>
        <div className="w-full bg-[#e0e0e0] rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${prediction.confidence}%`, backgroundColor: confidenceColor }}
          ></div>
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-[#fafafa] rounded">
          <div className="text-[0.6rem] text-[#666]">EOL Cycle</div>
          <div className="text-lg font-bold text-[#2c3e50]">{prediction.eol_cycle}</div>
        </div>
        <div className="text-center p-2 bg-[#fafafa] rounded">
          <div className="text-[0.6rem] text-[#666]">Current SOH</div>
          <div className="text-lg font-bold text-[#2c3e50]">{prediction.current_soh}%</div>
        </div>
        <div className="text-center p-2 bg-[#fafafa] rounded">
          <div className="text-[0.6rem] text-[#666]">Degradation Rate</div>
          <div className="text-sm font-bold text-[#2c3e50]">{(prediction.degradation_rate * 100).toFixed(4)}%/s</div>
        </div>
        <div className="text-center p-2 bg-[#fafafa] rounded">
          <div className="text-[0.6rem] text-[#666]">Model Used</div>
          <div className="text-xs font-bold text-[#2c3e50] uppercase">{prediction.model_used}</div>
        </div>
      </div>
      
      {/* Status Message */}
      <div className={`text-center p-2 rounded text-[0.7rem] ${
        prediction.rul_cycles > 50 ? 'bg-green-50 text-green-700' :
        prediction.rul_cycles > 20 ? 'bg-yellow-50 text-yellow-700' :
        'bg-red-50 text-red-700'
      }`}>
        {prediction.rul_cycles > 50 ? '✅ Battery is in good health' :
         prediction.rul_cycles > 20 ? '⚠️ Battery showing degradation' :
         '🔴 Battery near end of life - Consider replacement'}
      </div>
    </div>
  );
};

export default PredictionsPanel;