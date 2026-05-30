// D:\Li_ion\Li-ion\src\components\LiveMetrics.jsx
import React from 'react';

const LiveMetrics = ({ liveData }) => {
  const { 
    voltage = 0, 
    current = 0, 
    temperature = 0, 
    status = 'WAITING',
    power = 0 
  } = liveData;
  
  const getStatusColor = () => {
    if (status === 'ACTIVE') return 'text-[#27ae60]';
    if (status === 'CONNECTED') return 'text-[#27ae60]';
    if (status === 'DISCONNECTED') return 'text-[#c0392b]';
    if (status === 'ERROR') return 'text-[#c0392b]';
    if (status === 'CONNECTING...') return 'text-[#e67e22]';
    return 'text-[#999]';
  };
  
  const getStatusText = () => {
    if (status === 'ACTIVE' || status === 'CONNECTED') return 'LIVE';
    if (status === 'DISCONNECTED') return 'DISCONNECTED';
    if (status === 'ERROR') return 'ERROR';
    if (status === 'CONNECTING...') return 'CONNECTING...';
    return status;
  };

  // Format values for display
  const formattedVoltage = typeof voltage === 'number' ? voltage.toFixed(3) : voltage;
  const formattedCurrent = typeof current === 'number' ? current.toFixed(2) : current;
  const formattedTemperature = typeof temperature === 'number' ? temperature.toFixed(1) : temperature;
  const formattedPower = typeof power === 'number' ? power.toFixed(3) : power;

  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-5 h-full">
      <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide mb-4 font-['Palatino','Georgia',serif]">
        Live Monitoring
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Voltage */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[#2c3e50] font-mono">
            {formattedVoltage}
          </div>
          <div className="text-[0.7rem] text-[#888] mt-1">Voltage (V)</div>
        </div>
        
        {/* Current */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[#2c3e50] font-mono">
            {formattedCurrent}
          </div>
          <div className="text-[0.7rem] text-[#888] mt-1">Current (mA)</div>
        </div>
        
        {/* Power */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[#2c3e50] font-mono">
            {formattedPower}
          </div>
          <div className="text-[0.7rem] text-[#888] mt-1">Power (W)</div>
        </div>
        
        {/* Temperature */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[#2c3e50] font-mono">
            {formattedTemperature}
          </div>
          <div className="text-[0.7rem] text-[#888] mt-1">Temperature (°C)</div>
        </div>
      </div>
      
      {/* Status */}
      <div className="text-center pt-3 border-t border-[#e8e8e8]">
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${getStatusColor()}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          {getStatusText()}
        </span>
      </div>

      {/* Additional Info for Disconnected State */}
      {status === 'DISCONNECTED' && (
        <div className="mt-4 p-2 bg-[#ffebee] rounded text-center">
          <div className="text-[0.7rem] text-[#c0392b]">
            ⚠️ ESP32 not connected. Check serial connection on COM8.
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMetrics;