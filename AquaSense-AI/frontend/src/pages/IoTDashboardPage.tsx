import React, { useEffect, useState, useRef } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  Droplets,
  Thermometer,
  CloudRain,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Signal,
} from 'lucide-react';
import { fetchLiveIoTSensors } from '../services/api';
import { IoTSensorData } from '../types';

interface IoTDashboardPageProps {
  district: string;
}

// Simulated live demo data used when backend is unreachable or returns nothing
const generateDemoSensors = (district: string): IoTSensorData[] => [
  {
    id: 1,
    device_id: 'ESP32-NODE-01',
    district,
    water_level_m: parseFloat((8.5 + Math.random() * 1.5).toFixed(2)),
    temperature_c: parseFloat((30 + Math.random() * 5).toFixed(1)),
    humidity_pct: parseFloat((55 + Math.random() * 15).toFixed(1)),
    rain_gauge_mm: parseFloat((10 + Math.random() * 10).toFixed(1)),
    soil_moisture_pct: parseFloat((40 + Math.random() * 20).toFixed(1)),
    status: 'Normal',
    recorded_at: new Date().toISOString(),
  },
  {
    id: 2,
    device_id: 'ESP32-NODE-02',
    district,
    water_level_m: parseFloat((3.2 + Math.random() * 0.8).toFixed(2)),
    temperature_c: parseFloat((32 + Math.random() * 4).toFixed(1)),
    humidity_pct: parseFloat((48 + Math.random() * 10).toFixed(1)),
    rain_gauge_mm: parseFloat((0 + Math.random() * 3).toFixed(1)),
    soil_moisture_pct: parseFloat((15 + Math.random() * 12).toFixed(1)),
    status: 'Critical Depletion',
    recorded_at: new Date().toISOString(),
  },
  {
    id: 3,
    device_id: 'ESP32-NODE-03',
    district,
    water_level_m: parseFloat((6.0 + Math.random() * 2).toFixed(2)),
    temperature_c: parseFloat((28 + Math.random() * 6).toFixed(1)),
    humidity_pct: parseFloat((60 + Math.random() * 10).toFixed(1)),
    rain_gauge_mm: parseFloat((5 + Math.random() * 8).toFixed(1)),
    soil_moisture_pct: parseFloat((35 + Math.random() * 20).toFixed(1)),
    status: 'Normal',
    recorded_at: new Date().toISOString(),
  },
];

export const IoTDashboardPage: React.FC<IoTDashboardPageProps> = ({ district }) => {
  const [sensors, setSensors] = useState<IoTSensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSensors = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetchLiveIoTSensors(district);
      if (res && res.length > 0) {
        setSensors(res);
        setIsDemo(false);
      } else {
        // Backend returned empty — use demo data
        setSensors(generateDemoSensors(district));
        setIsDemo(true);
      }
    } catch {
      // Backend unreachable — show demo data with live simulation
      setSensors(generateDemoSensors(district));
      setIsDemo(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  // Auto-refresh demo data every 5 seconds to simulate live stream
  useEffect(() => {
    loadSensors();

    intervalRef.current = setInterval(() => {
      if (isDemo || sensors.length === 0) {
        setSensors(generateDemoSensors(district));
        setLastUpdated(new Date());
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district]);

  const criticalCount = sensors.filter((s) => s.status.includes('Critical')).length;
  const normalCount = sensors.filter((s) => !s.status.includes('Critical')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#35C9CF]/20 text-[#35C9CF] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">ESP32 IoT Sensor Dashboard</h2>
            <p className="text-xs text-[#EAF6F4]/60">
              Real-time telemetry stream sync: Water Level, Temperature, Humidity, Rain Gauge &amp; Soil Moisture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badges */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {normalCount} Normal
            </span>
            {criticalCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {criticalCount} Critical
              </span>
            )}
          </div>

          {/* Connection badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs ${isDemo ? 'bg-amber-900/30 border-amber-500/30' : 'bg-[#0E3A44] border-white/10'}`}>
            {isDemo ? (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="text-gray-300">Demo Mode:</span>
                <span className="font-bold text-amber-400 font-mono">Simulated</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-gray-300">Firebase MQTT Bridge:</span>
                <span className="font-bold text-emerald-400 font-mono">Connected</span>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadSensors(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            title="Refresh sensor data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Demo mode notice */}
      {isDemo && (
        <div className="glass rounded-xl px-5 py-3 border border-amber-500/30 bg-amber-950/10 flex items-start gap-3">
          <Signal className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300/80">
            <span className="font-semibold text-amber-400">Demo / Simulation Mode</span> — No ESP32 devices are currently
            connected to the backend. Showing realistic simulated sensor telemetry. Data refreshes automatically every 5
            seconds. Connect real ESP32 hardware by posting to{' '}
            <code className="font-mono text-amber-300 bg-amber-900/40 px-1 rounded">POST /api/iot/telemetry</code>.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="glass rounded-xl px-5 py-3 border border-rose-500/30 bg-rose-950/10 text-rose-300 text-xs">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#35C9CF] animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Fetching live ESP32 telemetry sensor payload streams...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensors.map((sensor) => {
              const isCritical = sensor.status.includes('Critical');
              return (
                <div
                  key={sensor.id}
                  className={`glass rounded-2xl p-6 space-y-5 border transition ${
                    isCritical ? 'border-rose-500/50 bg-rose-950/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-5 h-5 text-[#35C9CF]" />
                      <div>
                        <h3 className="font-bold text-white text-base">{sensor.device_id}</h3>
                        <p className="text-xs text-gray-400">{sensor.district} District Node</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {sensor.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-[#072B34] p-3 rounded-xl space-y-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-[#35C9CF]" /> Water Level
                      </span>
                      <p className="text-lg font-bold text-white font-mono">{sensor.water_level_m} m</p>
                    </div>

                    <div className="bg-[#072B34] p-3 rounded-xl space-y-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature
                      </span>
                      <p className="text-lg font-bold text-white font-mono">{sensor.temperature_c} °C</p>
                    </div>

                    <div className="bg-[#072B34] p-3 rounded-xl space-y-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Humidity
                      </span>
                      <p className="text-lg font-bold text-white font-mono">{sensor.humidity_pct} %</p>
                    </div>

                    <div className="bg-[#072B34] p-3 rounded-xl space-y-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Rain Gauge
                      </span>
                      <p className="text-lg font-bold text-white font-mono">{sensor.rain_gauge_mm} mm</p>
                    </div>

                    <div className="bg-[#072B34] p-3 rounded-xl space-y-1 col-span-2 sm:col-span-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" /> Soil Moisture
                      </span>
                      <p className="text-lg font-bold text-emerald-400 font-mono">{sensor.soil_moisture_pct} %</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono flex justify-between">
                    <span>Last Sync: {new Date(sensor.recorded_at).toLocaleTimeString()}</span>
                    <span>Protocol: MQTT / WebSockets</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer timestamp */}
          <p className="text-center text-[11px] text-gray-600 font-mono">
            Last updated: {lastUpdated.toLocaleTimeString()} · {isDemo ? 'Auto-refreshing every 5s (demo)' : 'Live stream active'}
          </p>
        </>
      )}
    </div>
  );
};
