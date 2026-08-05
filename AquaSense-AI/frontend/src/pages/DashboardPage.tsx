import React, { useEffect, useState, useRef } from 'react';
import {
  CloudRain,
  Droplets,
  ShieldAlert,
  Sparkles,
  Thermometer,
  TrendingUp,
  RefreshCw,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { fetchForecast, fetchHistory, fetchMapData, fetchTrend } from '../services/api';
import { ForecastResponse, HistoryItem, WellMarker } from '../types';
import { DISTRICTS } from '../components/Navbar';
import { ForecastCards } from '../components/ForecastCards';
import { ForecastChart } from '../components/ForecastChart';
import { ForecastTable } from '../components/ForecastTable';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface DashboardPageProps {
  district: string;
  setDistrict?: (d: string) => void;
}

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #35C9CF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(53, 201, 207, 0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const DashboardPage: React.FC<DashboardPageProps> = ({ district, setDistrict }) => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [wells, setWells] = useState<WellMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detectedLat, setDetectedLat] = useState<number>(13.0827);
  const [detectedLon, setDetectedLon] = useState<number>(80.2707);
  const hasAutoRun = useRef(false);

  // ── GPS AUTO-DETECTION (runs once on mount, automatically) ────────────────────
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
          }
        } catch {
          /* Fallback to default district */
        }

        loadForecastDashboard(detectedDistrict, lat, lon);
      },
      () => {
        // Fallback to default district if geolocation rejected/unavailable
        loadForecastDashboard(district, detectedLat, detectedLon);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadForecastDashboard = async (targetDistrict: string, lat?: number, lon?: number) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchForecast(targetDistrict, lat, lon),
        fetchHistory(8),
        fetchMapData(),
        fetchTrend(targetDistrict),
      ]);

      if (results[0].status === 'fulfilled') setForecastData(results[0].value);
      if (results[1].status === 'fulfilled') setHistory(results[1].value);
      if (results[2].status === 'fulfilled') setWells(results[2].value.wells);
      if (results[3].status === 'fulfilled') setTrendData(results[3].value);
    } catch (err) {
      console.error('Error loading forecast dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoRun.current) {
      loadForecastDashboard(district, detectedLat, detectedLon);
    }
  }, [district]);

  const todayPred = forecastData?.today_prediction;
  const weather = forecastData?.weather;

  const riskBadgeStyle = (risk: string) => {
    if (risk === 'Safe') return 'text-green-400 bg-green-500/15 border-green-500/30';
    if (risk === 'Moderate') return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-red-400 bg-red-500/15 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#35C9CF] mono font-bold bg-[#35C9CF]/10 px-2.5 py-0.5 rounded-full border border-[#35C9CF]/30">
              7-Day Groundwater Forecast
            </span>
            <span className="text-xs text-gray-400 mono">GPS: {detectedLat.toFixed(2)}°N, {detectedLon.toFixed(2)}°E</span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {district} District Decision Support Dashboard
          </h2>
          <p className="text-xs text-[#EAF6F4]/70">
            Multi-step recursive machine learning predictions & OpenWeather forecast telemetry.
          </p>
        </div>
        <button
          onClick={() => loadForecastDashboard(district, detectedLat, detectedLon)}
          disabled={loading}
          className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh 7-Day Forecast
        </button>
      </div>

      {/* Skeleton Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass rounded-2xl p-5 h-32 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
              <div className="h-8 bg-white/20 rounded w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        /* Summary Metrics Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Weather Telemetry */}
          <div className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase mb-1">
              <span>Live Telemetry</span>
              <Thermometer className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">
              {weather ? `${weather.temperature}°C` : '—'}
            </p>
            <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-[#35C9CF]" /> {weather ? `${weather.humidity}% Humidity` : '—'}
              <CloudRain className="w-3.5 h-3.5 text-blue-400" /> {weather ? `${weather.rainfall}mm Rain` : '—'}
            </p>
          </div>

          {/* Current Day Groundwater Prediction */}
          <div className="glass rounded-2xl p-5 relative overflow-hidden ring-1 ring-[#35C9CF]/40">
            <div className="flex items-center justify-between text-xs text-[#35C9CF] mono uppercase font-bold mb-1">
              <span>Today's Water Level</span>
              <Sparkles className="w-4 h-4 text-[#35C9CF]" />
            </div>
            <p className="text-3xl font-black text-[#35C9CF]">
              {todayPred ? `${todayPred.groundwater_level.toFixed(2)} m` : '—'}
            </p>
            <p className="text-xs text-gray-300 mt-1">Water column depth level</p>
          </div>

          {/* Risk Indicator */}
          <div className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase mb-1">
              <span>Current Risk Status</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {todayPred ? (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeStyle(todayPred.risk)}`}>
                  {todayPred.risk} Risk
                </span>
              ) : (
                '—'
              )}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">CGWB Thresholds standard</p>
          </div>

          {/* ML Confidence Score */}
          <div className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase mb-1">
              <span>Day 1 ML Confidence</span>
              <TrendingUp className="w-4 h-4 text-[#35C9CF]" />
            </div>
            <p className="text-3xl font-extrabold text-white">
              {todayPred ? `${Math.round(todayPred.confidence * 100)}%` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Decays recursively over 7 days</p>
          </div>
        </div>
      )}

      {/* SECTION 1: 7-Day Forecast Cards Carousel */}
      {forecastData && <ForecastCards forecast={forecastData.forecast} />}

      {/* SECTION 2: Interactive Multi-Metric Chart */}
      {forecastData && (
        <ForecastChart
          forecast={forecastData.forecast}
          historicalTrend={trendData?.monthly_trend || []}
          district={district}
        />
      )}

      {/* SECTION 3: Main Grid (GIS Map + Recommendation Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommendation Panel */}
        <div className="glass rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#35C9CF]" />
                Irrigation Recommendation Panel
              </h3>
              <span className="text-xs text-[#7FE3D6] mono font-bold">7-Day Guidance</span>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              AI-driven water allocation and drought advisory rules tuned for {district}.
            </p>

            <div className="space-y-2.5">
              {forecastData?.forecast.map((fItem, idx) => (
                <div
                  key={idx}
                  className="bg-[#0E3A44]/50 p-3 rounded-xl border border-white/5 flex items-start gap-2.5"
                >
                  <span className="text-xs font-bold text-[#35C9CF] mono bg-[#35C9CF]/10 px-2 py-0.5 rounded border border-[#35C9CF]/20 shrink-0">
                    {fItem.day_label}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs text-white font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#35C9CF]" /> {fItem.recommendation}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Depth: {fItem.groundwater_level.toFixed(2)}m • Risk:{' '}
                      <span className="font-semibold text-amber-300">{fItem.risk}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GIS Map Preview */}
        <div className="glass rounded-2xl p-5 lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#35C9CF]" />
              Spatial Risk Map ({district})
            </h3>
            <span className="text-xs text-gray-400 mono">Observation Wells</span>
          </div>

          <div className="h-[360px] w-full rounded-xl overflow-hidden relative border border-white/10">
            <MapContainer
              center={[detectedLat, detectedLon]}
              zoom={8}
              className="h-full w-full rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[detectedLat, detectedLon]} icon={userIcon}>
                <Popup className="custom-popup">
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-sm text-[#072B34]">{district} Forecast Site</p>
                    <p className="text-gray-700">7-Day Predicted Level: <span className="font-bold text-[#35C9CF]">{todayPred?.groundwater_level.toFixed(2)} m</span></p>
                    <p className="text-gray-700">Risk: <span className="font-bold">{todayPred?.risk}</span></p>
                  </div>
                </Popup>
              </Marker>

              {wells.map((w, idx) => (
                <CircleMarker
                  key={idx}
                  center={[w.latitude, w.longitude]}
                  radius={7}
                  pathOptions={{
                    color: w.colour,
                    fillColor: w.colour,
                    fillOpacity: 0.85,
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 space-y-1 text-xs text-[#072B34]">
                      <p className="font-bold">{w.district} Well</p>
                      <p>Water Level: <b>{w.groundwater_level} m</b></p>
                      <p>Status: <b style={{ color: w.colour }}>{w.risk}</b></p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: 7-Day Forecast Data Table */}
      {forecastData && <ForecastTable forecast={forecastData.forecast} />}

      {/* SECTION 5: Recent Groundwater Inferences History Table */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Recent Groundwater Inference Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[#7FE3D6] mono text-xs uppercase border-b border-white/10 bg-[#0E3A44]/40">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Predicted Level</th>
                <th className="py-2.5 px-3">Risk Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 mono text-[#35C9CF] font-bold">#{row.id}</td>
                  <td className="py-2.5 px-3 font-medium text-white">{row.district}</td>
                  <td className="py-2.5 px-3 font-bold">{row.predicted_level} m</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${riskBadgeStyle(row.risk)}`}>
                      {row.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-400 mono">
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
