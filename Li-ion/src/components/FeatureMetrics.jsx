// D:\Li_ion\Li-ion\src\components\FeatureMetrics.jsx
import React from 'react';

const FeatureMetrics = ({ features, liveData }) => {
  // Get status color and text based on connection state
  const getStatusColor = () => {
    const status = liveData?.status || 'WAITING';
    if (status === 'ACTIVE') return 'text-[#27ae60]';
    if (status === 'CONNECTED') return 'text-[#27ae60]';
    if (status === 'DISCONNECTED') return 'text-[#c0392b]';
    if (status === 'ERROR') return 'text-[#c0392b]';
    if (status === 'CONNECTING...') return 'text-[#e67e22]';
    return 'text-[#999]';
  };
  
  const getStatusText = () => {
    const status = liveData?.status || 'WAITING';
    if (status === 'ACTIVE' || status === 'CONNECTED') return 'ESP32 CONNECTED';
    if (status === 'DISCONNECTED') return 'ESP32 DISCONNECTED';
    if (status === 'ERROR') return 'ESP32 ERROR';
    if (status === 'CONNECTING...') return 'ESP32 CONNECTING...';
    return 'ESP32 WAITING';
  };

  // Format uptime if available
  const formatUptime = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="bg-white border border-[#d0d0d0] rounded p-4">
      {/* Header with ESP32 Status */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[0.75rem] font-semibold text-[#666] uppercase tracking-wide font-['Palatino','Georgia',serif]">
          LIVE MONITORING
        </h3>
        <div className={`flex items-center gap-1.5 text-[0.65rem] font-medium ${getStatusColor()}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          {getStatusText()}
        </div>
      </div>
      
      {/* Live Sensor Readings Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#fafafa] rounded p-2 text-center">
          <div className="text-[0.6rem] text-[#666]">Voltage</div>
          <div className="text-lg font-bold text-[#2c3e50] font-mono">
            {liveData.voltage?.toFixed(3) || '0.000'} V
          </div>
          <div className="text-[0.55rem] text-[#888]">Real-time reading</div>
        </div>
        <div className="bg-[#fafafa] rounded p-2 text-center">
          <div className="text-[0.6rem] text-[#666]">Current</div>
          <div className="text-lg font-bold text-[#2c3e50] font-mono">
            {liveData.current?.toFixed(1) || '0.0'} mA
          </div>
          {/* <div className="text-[0.55rem] text-[#888]">
            {liveData.state === 'DISCHARGE' ? '⬇ Discharging' : liveData.state === 'CHARGE' ? '⬆ Charging' : 'Idle'}
          </div> */}
        </div>
        <div className="bg-[#fafafa] rounded p-2 text-center">
          <div className="text-[0.6rem] text-[#666]">Temperature</div>
          <div className="text-lg font-bold text-[#2c3e50] font-mono">
            {liveData.temperature?.toFixed(1) || '0.0'} °C
          </div>
          <div className="text-[0.55rem] text-[#888]">Cell surface temp</div>
        </div>
        <div className="bg-[#fafafa] rounded p-2 text-center">
          <div className="text-[0.6rem] text-[#666]">Power</div>
          <div className="text-lg font-bold text-[#2c3e50] font-mono">
            {liveData.power?.toFixed(2) || '0.00'} W
          </div>
          <div className="text-[0.55rem] text-[#888]">Instantaneous power</div>
        </div>
      </div>
      
      {/* Additional derived metrics */}
      <div className="mt-3 pt-3 border-t border-[#eee]">
        <div className="flex justify-between items-center text-[0.65rem]">
          <span className="text-[#666]">State of Health (SOH):</span>
          <span className="font-mono font-bold">{features.soh_percent?.toFixed(1) || '--'}%</span>
        </div>
        <div className="flex justify-between items-center text-[0.65rem] mt-1">
          <span className="text-[#666]">Estimated Internal Resistance:</span>
          <span className="font-mono font-bold">{features.internal_resistance_ohm?.toFixed(4) || '--'} Ω</span>
        </div>
        <div className="flex justify-between items-center text-[0.65rem] mt-1">
          <span className="text-[#666]">Voltage Drop Rate:</span>
          <span className="font-mono font-bold">{features.degradation_rate?.toFixed(6) || '--'} V/s</span>
        </div>
        <div className="flex justify-between items-center text-[0.65rem] mt-1">
          <span className="text-[#666]">Power Efficiency:</span>
          <span className="font-mono font-bold">
            {liveData.power > 0 && liveData.voltage > 0 && liveData.current > 0 
              ? ((features.power_watts / (liveData.voltage * (liveData.current/1000))) * 100).toFixed(1) 
              : '--'}%
          </span>
        </div>
        {liveData.uptime_seconds > 0 && (
          <div className="flex justify-between items-center text-[0.65rem] mt-1">
            <span className="text-[#666]">ESP32 Uptime:</span>
            <span className="font-mono font-bold">{formatUptime(liveData.uptime_seconds)}</span>
          </div>
        )}
      </div>

      {/* Timestamp of last update */}
      {liveData.timestamp && (
        <div className="mt-2 pt-2 border-t border-[#eee] text-[0.55rem] text-[#999] text-center">
          Last update: {new Date(liveData.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* Disconnected warning */}
      {liveData.status === 'DISCONNECTED' && (
        <div className="mt-3 p-2 bg-[#ffebee] rounded text-center">
          <div className="text-[0.65rem] text-[#c0392b]">
            ⚠️ ESP32 disconnected. Check serial connection.
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureMetrics;