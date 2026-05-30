// D:\Li_ion\Li-ion\src\components\BatteryParameters.jsx
import React from 'react';

const BatteryParameters = ({ features, liveData, prediction }) => {
  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-4">
      <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide mb-3 font-['Palatino','Georgia',serif]">
        🔋 Battery Parameters
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">State of Health (SOH)</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.soh_percent?.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Capacity Retention</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.capacity_percent?.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Internal Resistance</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.internal_resistance_ohm?.toFixed(4)} Ω
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Degradation Rate</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.degradation_rate?.toFixed(6)} V/s
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Capacity Fade Rate</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {(features.capacity_fade_rate * 100)?.toFixed(2)}% per cycle
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Power Output</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.power_watts?.toFixed(2)} W
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-[#eee]">
          <span className="text-[0.7rem] text-[#666]">Current Cycle</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {features.cycle_count}
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-[0.7rem] text-[#666]">End of Life Cycle</span>
          <span className="text-[0.8rem] font-mono font-bold text-[#2c3e50]">
            {prediction?.eol_cycle || '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BatteryParameters;