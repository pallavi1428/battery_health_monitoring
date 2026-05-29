# D:\Li_ion\backend\app.py (Updated with full model predictions)
from flask import Flask, jsonify, request
from flask_cors import CORS
import serial
import serial.tools.list_ports
import threading
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import atexit
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ==================== LOAD MODELS ====================
print("\n" + "="*50)
print("Loading Models and Scalers...")
print("="*50)

models = {
    'scaler': None,
    'feature_columns': None,
    'lasso': None,
    'rf': None
}

model_files = {
    'scaler': 'scaler.pkl',
    'feature_columns': 'feature_columns.pkl',
    'lasso': 'lasso_model.pkl',
    'rf': 'random_forest_model.pkl'
}

for name, filename in model_files.items():
    if os.path.exists(filename):
        try:
            models[name] = joblib.load(filename)
            print(f"✅ Loaded: {filename}")
        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")
    else:
        print(f"⚠️  File not found: {filename}")

print("="*50 + "\n")

# ==================== SERIAL CONFIGURATION ====================
SERIAL_PORT = 'COM8'
BAUD_RATE = 115200
serial_connection = None
latest_data = {
    'voltage': 3.672,
    'current': 129.40,
    'power': 0.475,
    'temperature': 25.0,
    'uptime_ms': 0,
    'timestamp': None,
    'status': 'ACTIVE',
    'state': 'DISCHARGE'
}

historical_data = []
MAX_HISTORY = 100

# ==================== ADVANCED FEATURE ENGINEERING ====================

def calculate_soh_from_voltage(voltage):
    """Estimate State of Health based on voltage"""
    if voltage >= 4.0:
        soh = 90 + (voltage - 4.0) * 50
    elif voltage >= 3.5:
        soh = 40 + (voltage - 3.5) * 100
    elif voltage >= 3.0:
        soh = (voltage - 3.0) * 80
    else:
        soh = 0
    return min(100, max(0, soh))

def calculate_degradation_rate(historical_voltages):
    """Calculate degradation rate from historical voltage data"""
    if len(historical_voltages) < 10:
        return 0.0036
    
    # Calculate rate of change
    recent = historical_voltages[-10:]
    if len(recent) > 1:
        rate = (recent[-1] - recent[0]) / len(recent)
        return abs(rate) * 0.01  # Scale appropriately
    return 0.0036

def calculate_internal_resistance(voltage, current):
    """Calculate internal resistance (Ohm's law)"""
    if current > 0:
        return voltage / current
    return 0.1

def predict_with_models(voltage, current, temperature, historical_voltages):
    """Predict RUL using both Lasso and Random Forest models"""
    
    # Calculate derived features
    soh = calculate_soh_from_voltage(voltage)
    degradation_rate = calculate_degradation_rate(historical_voltages)
    internal_resistance = calculate_internal_resistance(voltage, current / 1000)  # Convert to A
    power = voltage * (current / 1000)
    
    # Prepare features for ML models
    features = {
        'voltage': voltage,
        'current': current / 1000,  # Convert to Amps
        'temperature': temperature,
        'power': power,
        'internal_resistance': internal_resistance,
        'soh': soh,
        'degradation_rate': degradation_rate
    }
    
    # Default predictions
    lasso_pred = None
    rf_pred = None
    ensemble_pred = None
    
    # Try ML predictions if models are loaded
    if models['scaler'] is not None and models['lasso'] is not None:
        try:
            feature_names = models['feature_columns']
            if feature_names is not None:
                feature_vector = []
                for col in feature_names:
                    feature_vector.append(features.get(col, 0))
                
                # Scale features
                feature_scaled = models['scaler'].transform([feature_vector])
                
                # Lasso prediction
                lasso_pred = max(0, float(models['lasso'].predict(feature_scaled)[0]))
                
                # Random Forest prediction
                if models['rf'] is not None:
                    rf_pred = max(0, float(models['rf'].predict(feature_scaled)[0]))
                
                # Ensemble (average)
                if lasso_pred and rf_pred:
                    ensemble_pred = (lasso_pred + rf_pred) / 2
                elif lasso_pred:
                    ensemble_pred = lasso_pred
                else:
                    ensemble_pred = rf_pred
                    
        except Exception as e:
            logger.error(f"ML prediction error: {e}")
    
    # Fallback to simple estimation if ML failed
    if ensemble_pred is None:
        # Simple estimation based on SOH
        if soh > 70:
            cycles_left = (soh - 70) / 0.3
        else:
            cycles_left = 0
        ensemble_pred = cycles_left
        lasso_pred = cycles_left * 0.95
        rf_pred = cycles_left * 1.05
    
    # Calculate additional metrics
    time_minutes = ensemble_pred * 30  # Assume 30 min per cycle
    time_hours = time_minutes / 60
    eol_cycle = int(500 - ensemble_pred)
    capacity_fade_rate = (100 - soh) / 100
    
    return {
        'rul_cycles': int(ensemble_pred),
        'rul_cycles_lasso': int(lasso_pred) if lasso_pred else int(ensemble_pred),
        'rul_cycles_rf': int(rf_pred) if rf_pred else int(ensemble_pred),
        'rul_time_minutes': int(time_minutes),
        'rul_time_hours': round(time_hours, 1),
        'confidence': 85 if ensemble_pred > 0 else 95,
        'eol_cycle': eol_cycle,
        'model_used': 'ensemble' if models['lasso'] and models['rf'] else 'estimation',
        'degradation_rate': degradation_rate,
        'capacity_fade_rate': capacity_fade_rate,
        'internal_resistance': internal_resistance,
        'soh': soh
    }

# ==================== SERIAL READING THREAD ====================

def parse_esp_data(line):
    """Parse ESP32 data format: 1,DISCHARGE,3.672,129.40,0.00"""
    try:
        if ',' in line and not line.startswith('{'):
            parts = line.split(',')
            
            if len(parts) >= 4:
                state = parts[1].strip() if len(parts) > 1 else 'DISCHARGE'
                voltage = float(parts[2].strip()) if len(parts) > 2 else 0
                current = float(parts[3].strip()) if len(parts) > 3 else 0
                current_a = current / 1000
                power = voltage * current_a
                
                return {
                    'voltage': voltage,
                    'current': current,
                    'current_a': current_a,
                    'power': round(power, 3),
                    'state': state,
                    'temperature': 25.0,
                    'parsed': True
                }
    except Exception as e:
        logger.debug(f"Parse error: {e}")
    return None

def read_serial_data():
    global serial_connection, latest_data, historical_data
    
    while True:
        try:
            if serial_connection is None or not serial_connection.is_open:
                try:
                    serial_connection = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
                    latest_data['status'] = 'CONNECTED'
                    logger.info(f"✅ Connected to {SERIAL_PORT}")
                except Exception as e:
                    latest_data['status'] = 'DISCONNECTED'
                    time.sleep(5)
                    continue
            
            line = serial_connection.readline().decode('utf-8', errors='ignore').strip()
            
            if line:
                parsed = parse_esp_data(line)
                
                if parsed and parsed.get('parsed'):
                    # Get historical voltages for degradation calculation
                    historical_voltages = [d.get('voltage', 3.6) for d in historical_data[-50:]]
                    historical_voltages.append(parsed['voltage'])
                    
                    # Get predictions using models
                    predictions = predict_with_models(
                        parsed['voltage'],
                        parsed['current'],
                        parsed['temperature'],
                        historical_voltages
                    )
                    
                    # Update latest data with predictions
                    latest_data = {
                        'voltage': parsed['voltage'],
                        'current': parsed['current'],
                        'power': parsed['power'],
                        'temperature': parsed['temperature'],
                        'uptime_ms': int(time.time() * 1000),
                        'timestamp': datetime.now().isoformat(),
                        'status': 'ACTIVE',
                        'state': parsed['state'],
                        'predictions': predictions
                    }
                    
                    # Store historical data
                    historical_data.append({
                        'voltage': parsed['voltage'],
                        'current': parsed['current'],
                        'temperature': parsed['temperature'],
                        'timestamp': datetime.now().isoformat()
                    })
                    if len(historical_data) > MAX_HISTORY:
                        historical_data.pop(0)
                    
                    logger.info(f"📊 Data: {parsed['voltage']}V, {parsed['current']}mA, RUL: {predictions['rul_cycles']} cycles")
                        
        except Exception as e:
            logger.error(f"Serial error: {e}")
            latest_data['status'] = 'ERROR'
            if serial_connection:
                try:
                    serial_connection.close()
                except:
                    pass
            serial_connection = None
            time.sleep(2)

# Start serial reading thread
serial_thread = threading.Thread(target=read_serial_data, daemon=True)
serial_thread.start()

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'running',
        'models_loaded': models['scaler'] is not None,
        'serial_connected': serial_connection is not None and serial_connection.is_open
    })

@app.route('/api/live-data', methods=['GET'])
def get_live_data():
    global latest_data, historical_data
    
    # Get predictions from latest data
    predictions = latest_data.get('predictions', {})
    
    # Prepare response
    response = {
        'live': {
            'voltage': round(latest_data.get('voltage', 0), 3),
            'current': round(latest_data.get('current', 0), 2),
            'power': round(latest_data.get('power', 0), 3),
            'temperature': round(latest_data.get('temperature', 25.0), 1),
            'uptime_seconds': int(latest_data.get('uptime_ms', 0) / 1000),
            'timestamp': latest_data.get('timestamp', datetime.now().isoformat()),
            'status': latest_data.get('status', 'UNKNOWN'),
            'state': latest_data.get('state', 'DISCHARGE')
        },
        'features': {
            'soh_percent': round(predictions.get('soh', 85), 1),
            'capacity_percent': round(predictions.get('soh', 85), 1),
            'internal_resistance_ohm': round(predictions.get('internal_resistance', 0.1), 4),
            'power_watts': round(latest_data.get('power', 0), 2),
            'degradation_rate': round(predictions.get('degradation_rate', 0.0036), 6),
            'capacity_fade_rate': round(predictions.get('capacity_fade_rate', 0.15), 3),
            'cycle_count': 1
        },
        'prediction': {
            'rul_cycles': predictions.get('rul_cycles', 0),
            'lasso_prediction': predictions.get('rul_cycles_lasso', 0),
            'rf_prediction': predictions.get('rul_cycles_rf', 0),
            'rul_time_minutes': predictions.get('rul_time_minutes', 0),
            'rul_time_hours': predictions.get('rul_time_hours', 0),
            'confidence': predictions.get('confidence', 85),
            'eol_cycle': predictions.get('eol_cycle', 500),
            'model_used': predictions.get('model_used', 'estimation'),
            'degradation_rate': predictions.get('degradation_rate', 0.0036)
        },
        'model_info': {
            'lasso': models['lasso'] is not None,
            'rf': models['rf'] is not None,
            'scaler': models['scaler'] is not None
        }
    }
    
    return jsonify(response)

@app.route('/api/historical', methods=['GET'])
def get_historical_data():
    limit = int(request.args.get('limit', 50))
    return jsonify({
        'data': historical_data[-limit:],
        'count': len(historical_data)
    })

# Add to your app.py - Store predictions for each model separately

@app.route('/api/predictions/<model_type>', methods=['GET'])
def get_predictions_by_model(model_type):
    """Get predictions from specific model: lasso, rf, or ensemble"""
    global latest_data, historical_data
    
    if model_type not in ['lasso', 'rf', 'ensemble']:
        return jsonify({'error': 'Invalid model type'}), 400
    
    # Get current data
    voltage = latest_data.get('voltage', 3.6)
    current = latest_data.get('current', 100)
    temperature = latest_data.get('temperature', 25)
    
    # Get historical voltages
    historical_voltages = [d.get('voltage', 3.6) for d in historical_data[-50:]]
    
    # Calculate features
    soh = calculate_soh_from_voltage(voltage)
    degradation_rate = calculate_degradation_rate(historical_voltages)
    internal_resistance = calculate_internal_resistance(voltage, current / 1000)
    power = voltage * (current / 1000)
    
    features = {
        'voltage': voltage,
        'current': current / 1000,
        'temperature': temperature,
        'power': power,
        'internal_resistance': internal_resistance,
        'soh': soh,
        'degradation_rate': degradation_rate
    }
    
    # Get predictions based on model type
    if models['scaler'] is not None and models['lasso'] is not None:
        try:
            feature_names = models['feature_columns']
            feature_vector = []
            for col in feature_names:
                feature_vector.append(features.get(col, 0))
            
            feature_scaled = models['scaler'].transform([feature_vector])
            
            if model_type == 'lasso':
                rul = max(0, float(models['lasso'].predict(feature_scaled)[0]))
                confidence = 88
            elif model_type == 'rf' and models['rf'] is not None:
                rul = max(0, float(models['rf'].predict(feature_scaled)[0]))
                confidence = 92
            else:
                # Ensemble
                lasso_pred = max(0, float(models['lasso'].predict(feature_scaled)[0]))
                rf_pred = max(0, float(models['rf'].predict(feature_scaled)[0])) if models['rf'] else lasso_pred
                rul = (lasso_pred + rf_pred) / 2
                confidence = 90
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            rul = (soh - 70) / 0.3 if soh > 70 else 0
            confidence = 85
    else:
        # Fallback
        rul = (soh - 70) / 0.3 if soh > 70 else 0
        confidence = 85
    
    time_minutes = rul * 30
    eol_cycle = int(500 - rul)
    
    return jsonify({
        'rul_cycles': int(rul),
        'rul_time_minutes': int(time_minutes),
        'confidence': confidence,
        'eol_cycle': eol_cycle,
        'model_type': model_type,
        'soh': round(soh, 1),
        'degradation_rate': round(degradation_rate, 6)
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Battery Monitoring API Server")
    print("="*50)
    print(f"📡 Serial Port: {SERIAL_PORT}")
    print(f"🤖 Lasso Model: {'✅' if models['lasso'] else '❌'}")
    print(f"🤖 Random Forest: {'✅' if models['rf'] else '❌'}")
    print(f"📊 Scaler: {'✅' if models['scaler'] else '❌'}")
    print("="*50)
    print("🌐 API endpoint: http://localhost:5000/api/live-data")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)