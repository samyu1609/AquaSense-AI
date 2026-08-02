import React, { useEffect, useState, useRef } from 'react';
import { CloudRain, Droplets, ShieldAlert, Sparkles, Thermometer, TrendingUp, RefreshCw } from 'lucide-react';
import { fetchHistory, fetchMapData, fetchTrend, fetchWeather, postPrediction } from '../services/api';
import { HistoryItem, PredictionResponse, WeatherData, WellMarker } from '../types';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { DISTRICTS } from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface DashboardPageProps {
  district: string;
  setDistrict?: (d: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ district, setDistrict }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [wells, setWells] = useState<WellMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detectedLat, setDetectedLat] = useState<number>(11.0);
  const [detectedLon, setDetectedLon] = useState<number>(78.6);
  const hasAutoRun = useRef(false);

  // ── GPS AUTO-DETECTION (runs once on mount, silently) ────────────────────
  useEffect(() => {
    if (hasAutoRun.current) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (hasAutoRun.current) return;
        hasAutoRun.current = true;

        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));

        setDetectedLat(lat);
        setDetectedLon(lon);

        // 1. Reverse geocode via OpenStreetMap Nominatim with coordinate fallback
        let detectedDistrict = district;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geoData = await geoRes.json();
          const fullText = (
            (geoData.display_name || '') + ' ' + JSON.stringify(geoData.address || {})
          ).toLowerCase();

          const matched = DISTRICTS.find((d) => fullText.includes(d.toLowerCase()));
          if (matched && setDistrict) {
            detectedDistrict = matched;
            setDistrict(matched);
          } else {
            // Coordinate bounding box detection for Tamil Nadu
            if (lat >= 11.0 && lat <= 11.8 && lon >= 77.0 && lon <= 77.9) detectedDistrict = 'Erode';
            else if (lat >= 10.7 && lat <= 11.3 && lon >= 76.7 && lon <= 77.3) detectedDistrict = 'Coimbatore';
            else if (lat >= 12.8 && lat <= 13.3 && lon >= 80.0 && lon <= 80.4) detectedDistrict = 'Chennai';
            else if (lat >= 9.7 && lat <= 10.2 && lon >= 78.0 && lon <= 78.4) detectedDistrict = 'Madurai';
            else if (lat >= 11.4 && lat <= 11.9 && lon >= 77.9 && lon <= 78.5) detectedDistrict = 'Salem';
            else if (lat >= 10.6 && lat <= 11.1 && lon >= 78.4 && lon <= 79.1) detectedDistrict = 'Tiruchirappalli';

            if (detectedDistrict && setDistrict) {
              setDistrict(detectedDistrict);
            }
          }
        } catch {
          // Nominatim fallback via lat/lon
          if (lat >= 11.0 && lat <= 11.8 && lon >= 77.0 && lon <= 77.9) {
            detectedDistrict = 'Erode';
            if (setDistrict) setDistrict('Erode');
          }
        }

        // 2. Reload dashboard with detected location
        loadDashboardDataWithLocation(detectedDistrict, lat, lon);
      },
      () => {
        // User denied or geolocation unavailable — load with defaults
        loadDashboardData();
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [district]); // eslint-disable-line react-hooks/exhaustive-deps
  // ── END GPS AUTO-DETECTION ───────────────────────────────────────────────

  const loadDashboardDataWithLocation = async (targetDistrict: string, lat: number, lon: number) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchWeather(targetDistrict, lat, lon),
        fetchHistory(8),
        fetchMapData(),
        fetchTrend(targetDistrict),
      ]);

      const wxData = results[0].status === 'fulfilled' ? results[0].value : null;
      const histData = results[1].status === 'fulfilled' ? results[1].value : [];
      const mapRes = results[2].status === 'fulfilled' ? results[2].value : { wells: [] };
      const trData = results[3].status === 'fulfilled' ? results[3].value : { district: targetDistrict, monthly_trend: [] };

      if (wxData) setWeather(wxData);
      setHistory(histData);
      setWells(mapRes.wells);
      setTrendData(trData);

      // Auto run prediction with detected coordinates
      try {
        const predRes = await postPrediction({
          latitude: lat,
          longitude: lon,
          district: targetDistrict,
          rainfall_mm: wxData?.rainfall || 25,
          temperature_c: wxData?.temperature || 30,
          humidity_pct: wxData?.humidity || 65,
          previous_level: 8.5,
          month: new Date().getMonth() + 1,
          season: 'Monsoon',
        });
        setPrediction(predRes);
      } catch (pErr) {
        console.error('Prediction failed:', pErr);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchWeather(district),
        fetchHistory(8),
        fetchMapData(),
        fetchTrend(district),
      ]);

      const wxData = results[0].status === 'fulfilled' ? results[0].value : null;
      const histData = results[1].status === 'fulfilled' ? results[1].value : [];
      const mapRes = results[2].status === 'fulfilled' ? results[2].value : { wells: [] };
      const trData = results[3].status === 'fulfilled' ? results[3].value : { district, monthly_trend: [] };

      if (wxData) setWeather(wxData);
      setHistory(histData);
      setWells(mapRes.wells);
      setTrendData(trData);

      // Auto run prediction for active district
      try {
        const predRes = await postPrediction({
          latitude: detectedLat,
          longitude: detectedLon,
          district,
          rainfall_mm: wxData?.rainfall || 25,
          temperature_c: wxData?.temperature || 30,
          humidity_pct: wxData?.humidity || 65,
          previous_level: 8.5,
          month: new Date().getMonth() + 1,
          season: 'Monsoon',
        });
        setPrediction(predRes);
      } catch (pErr) {
        console.error('Prediction failed:', pErr);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };


  // Only load data on district change if GPS has already run
  useEffect(() => {
    if (hasAutoRun.current) {
      loadDashboardData();
    }
  }, [district]);

  const riskColor = (risk: string) => {
    if (risk === 'Safe') return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (risk === 'Moderate') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-[#35C9CF] mono font-semibold">
            {district} District Overview
          </span>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Groundwater Decision Support Dashboard
          </h2>
          <p className="text-xs text-[#EAF6F4]/70">
            Real-time weather telemetry, machine learning predictions & spatial risk metrics.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Weather Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#7FE3D6]/70 mono uppercase mb-2">
            <span>Current Weather</span>
            <Thermometer className="w-4 h-4 text-[#35C9CF]" />
          </div>
          <p className="text-3xl font-bold text-white">
            {weather ? `${weather.temperature}°C` : '—'}
          </p>
          <p className="text-xs text-[#EAF6F4]/60 mt-1 flex items-center gap-2">
            <Droplets className="w-3 h-3 text-[#35C9CF]" /> {weather ? `${weather.humidity}% Humidity` : '—'}
            <CloudRain className="w-3 h-3 text-blue-400" /> {weather ? `${weather.rainfall}mm Rain` : '—'}
          </p>
        </div>

        {/* Prediction Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#7FE3D6]/70 mono uppercase mb-2">
            <span>Predicted Level</span>
            <Sparkles className="w-4 h-4 text-[#35C9CF]" />
          </div>
          <p className="text-3xl font-bold text-[#35C9CF]">
            {prediction ? `${prediction.predicted_level_m} m` : '—'}
          </p>
          <p className="text-xs text-[#EAF6F4]/60 mt-1">Water column depth level</p>
        </div>

        {/* Risk Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#7FE3D6]/70 mono uppercase mb-2">
            <span>Risk Status</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold flex items-center gap-2">
            {prediction ? (
              <span className={`px-3 py-1 rounded-full text-sm border font-semibold ${riskColor(prediction.risk)}`}>
                {prediction.risk} Risk
              </span>
            ) : (
              '—'
            )}
          </p>
          <p className="text-xs text-[#EAF6F4]/60 mt-2">Based on CGWB & ML thresholds</p>
        </div>

        {/* Confidence Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#7FE3D6]/70 mono uppercase mb-2">
            <span>ML Confidence</span>
            <TrendingUp className="w-4 h-4 text-[#35C9CF]" />
          </div>
          <p className="text-3xl font-bold text-white">
            {prediction ? `${Math.round(prediction.confidence * 100)}%` : '—'}
          </p>
          <p className="text-xs text-[#EAF6F4]/60 mt-1">
            Model: {prediction ? prediction.model_used : '—'}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Map + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation Panel */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#35C9CF]" /> Recommended Actions
            </h3>
            <p className="text-xs text-[#EAF6F4]/60 mb-4">
              AI-generated decision support for groundwater preservation in {district}.
            </p>
            <ul className="space-y-2 text-sm text-[#EAF6F4]/85">
              {prediction?.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#0E3A44]/40 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[#35C9CF] font-bold">›</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Groundwater Trend Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2 space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#35C9CF]" /> Groundwater Level vs Rainfall Trend ({district})
          </h3>
          {trendData && trendData.monthly_trend ? (
            <div className="h-64">
              <Bar
                data={{
                  labels: trendData.monthly_trend.map((r: any) => r.Date),
                  datasets: [
                    {
                      label: 'Rainfall (mm)',
                      data: trendData.monthly_trend.map((r: any) => r.rainfall),
                      backgroundColor: 'rgba(127, 227, 214, 0.3)',
                      borderColor: '#7FE3D6',
                      borderWidth: 1,
                      yAxisID: 'y1',
                    },
                    {
                      label: 'Groundwater Level (m)',
                      data: trendData.monthly_trend.map((r: any) => r.groundwater_level),
                      type: 'line' as any,
                      borderColor: '#35C9CF',
                      backgroundColor: '#35C9CF',
                      borderWidth: 2,
                      yAxisID: 'y',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { ticks: { color: '#EAF6F4' } },
                    y: { ticks: { color: '#35C9CF' }, title: { display: true, text: 'Level (m)', color: '#35C9CF' } },
                    y1: { position: 'right', ticks: { color: '#7FE3D6' }, title: { display: true, text: 'Rain (mm)', color: '#7FE3D6' }, grid: { drawOnChartArea: false } },
                  },
                  plugins: { legend: { labels: { color: '#EAF6F4' } } },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">Loading chart data...</div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Recent Groundwater Inferences</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#7FE3D6]/70 mono text-xs uppercase border-b border-white/10">
              <tr className="text-left">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Predicted Level</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 mono text-[#35C9CF]">#{row.id}</td>
                  <td className="py-2.5 px-3 font-medium text-white">{row.district}</td>
                  <td className="py-2.5 px-3">{row.predicted_level} m</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs border ${riskColor(row.risk)}`}>
                      {row.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#EAF6F4]/50 mono">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
