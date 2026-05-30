import React, { useState, useEffect } from 'react';
import RealTimeTrend from './components/RealTimeTrend';
import BatteryParameters from './components/BatteryParameters';
import FeatureMetrics from './components/FeatureMetrics';
import SOHTrendChart from './components/SOHTrendChart';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [batteryData, setBatteryData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [liveData, setLiveData] = useState({
    voltage: 0,
    current: 0,
    temperature: 0,
    status: 'CONNECTING...',
    power: 0,
    state: 'DISCHARGE',
    timestamp: null,
    uptime_seconds: 0
  });
  const [features, setFeatures] = useState({
    soh_percent: 0,
    capacity_percent: 0,
    internal_resistance_ohm: 0,
    power_watts: 0,
    degradation_rate: 0,
    capacity_fade_rate: 0,
    cycle_count: 0
  });
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [sohHistory, setSohHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Fetch live data from backend every 2 seconds
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/live-data`);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        console.log('ESP Data with ML Predictions:', data);
        
        // Update live metrics with ESP data
        setLiveData({
          voltage: data.live.voltage,
          current: data.live.current,
          temperature: data.live.temperature,
          status: data.live.status,
          power: data.live.power,
          state: data.live.state,
          timestamp: data.live.timestamp,
          uptime_seconds: data.live.uptime_seconds
        });
        
        // Update history for graphs (keep last 50 points)
        setVoltageHistory(prev => [...prev.slice(-49), data.live.voltage]);
        setCurrentHistory(prev => [...prev.slice(-49), data.live.current]);
        
        // Update features
        setFeatures({
          soh_percent: data.features.soh_percent,
          capacity_percent: data.features.capacity_percent,
          internal_resistance_ohm: data.features.internal_resistance_ohm,
          power_watts: data.features.power_watts,
          degradation_rate: data.features.degradation_rate,
          capacity_fade_rate: data.features.capacity_fade_rate,
          cycle_count: data.features.cycle_count
        });
        
        // Update SOH history
        setSohHistory(prev => [...prev.slice(-49), data.features.soh_percent]);
        
        // Update battery data
        setBatteryData({
          nominal_capacity: 2000,
          current_capacity: data.features.capacity_percent * 20,
          chemistry: 'NCA',
          current_cycle: data.features.cycle_count || 1,
          eol_threshold: 1400,
          soh: data.features.soh_percent,
          degradation_rate: data.features.degradation_rate,
          internal_resistance: data.features.internal_resistance_ohm,
          power_watts: data.features.power_watts
        });
        
        // Update predictions from ML models
        if (data.prediction) {
          const newPrediction = {
            rul_cycles: data.prediction.rul_cycles,
            rul_cycles_lasso: data.prediction.lasso_prediction,
            rul_cycles_rf: data.prediction.rf_prediction,
            confidence: data.prediction.confidence,
            eol_cycle: data.prediction.eol_cycle,
            current_soh: data.features.soh_percent.toFixed(1),
            degradation_rate: data.features.degradation_rate,
            time_remaining_minutes: data.prediction.rul_time_minutes,
            time_remaining_hours: data.prediction.rul_time_hours,
            model_used: data.prediction.model_used,
            capacity_fade_rate: (100 - data.features.soh_percent) / 100,
            estimated_cycles_remaining: data.prediction.rul_cycles,
            timestamp: new Date().toLocaleTimeString()
          };
          setPrediction(newPrediction);
          
          // Add to history
          setPredictionHistory(prev => [...prev.slice(-49), newPrediction]);
        }
        
        // Store model info
        if (data.model_info) {
          setModelInfo(data.model_info);
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error fetching live data:', error);
        setLiveData(prev => ({ ...prev, status: 'DISCONNECTED' }));
        setIsConnected(false);
      }
    };
    
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f0]">
      {/* Header */}
      <header className="bg-white border-b border-[#d0d0d0] px-6 py-3 flex-shrink-0 z-10">
        <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight font-['Palatino','Georgia',serif]">
          Battery Remaining Life Prediction
        </h1>
        <div className="flex gap-6 text-[0.65rem] text-[#777] font-mono mt-1">
          <span> Live ESP32 Monitoring</span>
          <span>📡 Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
          {modelInfo && (
            <span> Models: {modelInfo.lasso ? 'Lasso ✓' : 'Lasso ✗'} | {modelInfo.rf ? 'RF ✓' : 'RF ✗'} | Scaler {modelInfo.scaler ? '✓' : '✗'}</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Row 2: Battery Parameters + Feature Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeatureMetrics 
              features={features}
              liveData={liveData}
            />
            <BatteryParameters 
              features={features}
              liveData={liveData}
              prediction={prediction}
            />
          </div>
          <div>
            <RealTimeTrend liveData={liveData} batteryData={batteryData} />
          </div>

          {/* Row 3: Voltage & Current Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SOHTrendChart 
              sohHistory={sohHistory}
              prediction={prediction}
              title="State of Health (SOH) Trend"
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;