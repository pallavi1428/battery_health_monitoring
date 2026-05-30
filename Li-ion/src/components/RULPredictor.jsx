// D:\Li_ion\Li-ion\src\components\RULPredictor.jsx
import React, { useState } from 'react';

const RULPredictor = ({ batteryData, prediction, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!batteryData || !prediction) {
    return (
      <div className="bg-white border border-[#d0d0d0] rounded p-5">
        <div className="w-full">
          <h3 className="text-[0.95rem] font-semibold text-[#2c3e50] mb-1 font-['Palatino','Georgia',serif]">
            Prediction Results
          </h3>
          <p className="text-[#999] text-center py-8">Select a battery to generate RUL prediction</p>
        </div>
      </div>
    );
  }

  const currentCapacity = batteryData.capacity[batteryData.capacity.length - 1];
  const healthPercentage = (currentCapacity / batteryData.nominal_capacity) * 100;

  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-5">
      <div className="w-full">
        <div className="flex justify-between items-start mb-5 pb-3 border-b border-[#e0e0e0]">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-[#2c3e50] mb-1 font-['Palatino','Georgia',serif]">
              Table 1: RUL Prediction Results
            </h3>
            <p className="text-[0.7rem] font-mono text-[#888]">Model: Linear Regression | Confidence Level: 95%</p>
          </div>
          <button 
            className="px-2 py-1.5 bg-[#f0f0f0] text-[#2c3e50] border border-[#d0d0d0] rounded cursor-pointer text-[0.75rem] font-inherit transition-all duration-200 hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Updating...' : 'Update Prediction'}
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
          <div className="bg-[#fafafa] p-4 border border-[#e8e8e8] rounded text-center">
            <div className="text-[0.7rem] font-medium text-[#666] uppercase tracking-wide mb-2">
              Predicted Remaining Useful Life (RUL)
            </div>
            <div className="text-3xl font-semibold text-[#2c3e50] leading-tight font-mono">{prediction.rul}</div>
            <div className="text-[0.7rem] text-[#999] mt-1">cycles</div>
            <div className="text-[0.65rem] text-[#888] mt-2">95% CI: ±{prediction.confidence} cycles</div>
          </div>

          <div className="bg-[#fafafa] p-4 border border-[#e8e8e8] rounded text-center">
            <div className="text-[0.7rem] font-medium text-[#666] uppercase tracking-wide mb-2">
              Predicted End-of-Life (EOL) Cycle
            </div>
            <div className="text-3xl font-semibold text-[#2c3e50] leading-tight font-mono">{prediction.eol_cycle}</div>
            <div className="text-[0.7rem] text-[#999] mt-1">cycle number</div>
          </div>

          <div className="bg-[#fafafa] p-4 border border-[#e8e8e8] rounded text-center">
            <div className="text-[0.7rem] font-medium text-[#666] uppercase tracking-wide mb-2">
              Current State of Health (SOH)
            </div>
            <div className="text-3xl font-semibold text-[#2c3e50] leading-tight font-mono">{prediction.current_soh}%</div>
            <div className="text-[0.7rem] text-[#999] mt-1">of nominal capacity</div>
            <div className="text-[0.65rem] text-[#888] mt-2">
              Current: {currentCapacity.toFixed(3)} Ah / Nominal: {batteryData.nominal_capacity} Ah
            </div>
          </div>

          <div className="bg-[#fafafa] p-4 border border-[#e8e8e8] rounded text-center">
            <div className="text-[0.7rem] font-medium text-[#666] uppercase tracking-wide mb-2">
              Estimated Degradation Rate
            </div>
            <div className="text-3xl font-semibold text-[#2c3e50] leading-tight font-mono">{prediction.degradation_rate}</div>
            <div className="text-[0.7rem] text-[#999] mt-1">Ah per cycle</div>
          </div>

          <div className="bg-[#fafafa] p-4 border border-[#e8e8e8] rounded text-center">
            <div className="text-[0.7rem] font-medium text-[#666] uppercase tracking-wide mb-2">
              Model Fit (R²)
            </div>
            <div className="text-3xl font-semibold text-[#2c3e50] leading-tight font-mono">{prediction.r_squared}</div>
            <div className="text-[0.7rem] text-[#999] mt-1">coefficient of determination</div>
          </div>
        </div>

        <div className="my-5 p-4 bg-[#fafafa] border border-[#e8e8e8] rounded">
          <div className="text-[0.75rem] font-medium text-[#555] mb-2">Battery Health Status</div>
          <div className="h-2 bg-[#e0e0e0] rounded overflow-hidden mb-2">
            <div 
              className="h-full bg-[#2c3e50] transition-all duration-300" 
              style={{ width: `${Math.min(100, healthPercentage)}%` }}
            ></div>
          </div>
          <div className="text-[0.75rem] font-medium">
            {healthPercentage > 80 ? (
              <span className="text-[#27ae60]">● Operational (SOH above 80%)</span>
            ) : healthPercentage > 70 ? (
              <span className="text-[#e67e22]">● Degrading (70% below SOH below 80%)</span>
            ) : (
              <span className="text-[#c0392b]">● Critical (SOH below 70%) - Replacement Recommended</span>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#f9f9f5] border-l-[3px] border-l-[#bdc3c7] text-[0.7rem] text-[#666] leading-relaxed">
          <strong>Methodology Note:</strong> RUL prediction is performed using linear regression on the 
          most recent 50 capacity measurements. The model assumes continued linear degradation at the 
          current rate. For enhanced accuracy, consider incorporating electrochemical impedance 
          spectroscopy (EIS) data and advanced ML models (LSTM, XGBoost).
        </div>
      </div>
    </div>
  );
};

export default RULPredictor;