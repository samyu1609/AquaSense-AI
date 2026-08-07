import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, WifiOff } from 'lucide-react';
import { fetchForecast, fetchWeather, postPrediction, fetchShapExplanations } from '../services/api';
import { ForecastResponse, PredictionResponse, ShapExplanationResponse } from '../types';
import { DISTRICTS } from '../components/Navbar';
import { ForecastCards } from '../components/ForecastCards';
import { ForecastTable } from '../components/ForecastTable';
import { ShapExplanationCard } from '../components/ShapExplanationCard';
import { PdfReportButton } from '../components/PdfReportButton';
import { predictOffline } from '../services/offlineEngine';

interface PredictPageProps {
  district: string;
}

export const PredictPage: React.FC<PredictPageProps> = ({ district: initialDistrict }) => {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [latitude, setLatitude] = useState<number>(11.0);
  const [longitude, setLongitude] = useState<number>(78.6);
  const [rainfall, setRainfall] = useState<number>(35.0);
  const [temperature, setTemperature] = useState<number>(30.0);
  const [humidity, setHumidity] = useState<number>(65.0);
  const [previousLevel, setPreviousLevel] = useState<number>(8.5);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [season, setSeason] = useState<string>('Monsoon');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [forecastRes, setForecastRes] = useState<ForecastResponse | null>(null);
  const [shapRes, setShapRes] = useState<ShapExplanationResponse | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

        setLatitude(lat);
        setLongitude(lon);

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
          if (matched) {
            detectedDistrict = matched;
            setDistrict(matched);
          }
        } catch {
          /* Geocode fallback */
        }

        try {
          const wx = await fetchWeather(detectedDistrict, lat, lon);
          setTemperature(wx.temperature);
          setHumidity(wx.humidity);
          setRainfall(wx.rainfall);
        } catch {
          /* Keep defaults */
        }

        // Run prediction & 7-day forecast
        runInferenceAndForecast(detectedDistrict, lat, lon, rainfall, temperature, humidity, previousLevel, season);
      },
      () => {
        runInferenceAndForecast(district, latitude, longitude, rainfall, temperature, humidity, previousLevel, season);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runInferenceAndForecast = async (
    tgtDistrict: string,
    lat: number,
    lon: number,
    rain: number,
    temp: number,
    hum: number,
    prevLvl: number,
    sea: string
  ) => {
    setLoading(true);
    setError(null);

    const payload = {
      latitude: lat,
      longitude: lon,
      district: tgtDistrict,
      rainfall_mm: rain,
      temperature_c: temp,
      humidity_pct: hum,
      previous_level: prevLvl,
      month: new Date().getMonth() + 1,
      season: sea,
    };

    if (isOfflineMode) {
      const offlineRes = predictOffline(payload);
      setResult(offlineRes);
      setLoading(false);
      return;
    }

    try {
      const [predRes, fcRes, shapExplanation] = await Promise.all([
        postPrediction(payload),
        fetchForecast(tgtDistrict, lat, lon, prevLvl, sea),
        fetchShapExplanations(payload).catch(() => null),
      ]);
      setResult(predRes);
      setForecastRes(fcRes);
      setShapRes(shapExplanation);
    } catch (err: any) {
      setError(err.message || 'Server connection issue. Using local client offline engine.');
      // Offline fallback
      const offlineRes = predictOffline(payload);
      setResult(offlineRes);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runInferenceAndForecast(district, latitude, longitude, rainfall, temperature, humidity, previousLevel, season);
  };

  const riskBadge = (risk: string) => {
    if (risk === 'Safe') return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (risk === 'Moderate') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-red-500/20 text-red-400 border-red-500/40';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#35C9CF]/15 rounded-xl border border-[#35C9CF]/30 text-[#35C9CF]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Machine Learning Groundwater Predictor & 7-Day Forecaster</h2>
            <p className="text-xs text-[#EAF6F4]/70">
              Configure telemetry inputs to run single-day inference, Explainable AI (SHAP), and 7-day groundwater forecasting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'glass text-gray-300 hover:text-white'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            {isOfflineMode ? 'Offline Mode Active' : 'Enable Offline Mode'}
          </button>

          <PdfReportButton
            district={district}
            predictedLevel={result?.predicted_level_m}
            risk={result?.risk}
            confidence={result ? Math.round(result.confidence * 100) : 90}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 lg:col-span-7">
          <h3 className="text-xs font-bold text-[#7FE3D6] uppercase tracking-wider mono border-b border-white/10 pb-2">
            Environmental Telemetry Input
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Target District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-[#072B34]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              >
                <option value="Monsoon" className="bg-[#072B34]">Monsoon</option>
                <option value="Post-Monsoon" className="bg-[#072B34]">Post-Monsoon</option>
                <option value="Summer" className="bg-[#072B34]">Summer</option>
                <option value="Winter" className="bg-[#072B34]">Winter</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Rainfall (mm)</label>
              <input
                type="number"
                step="0.1"
                value={rainfall}
                onChange={(e) => setRainfall(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Relative Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Previous Month Level (m)</label>
              <input
                type="number"
                step="0.01"
                value={previousLevel}
                onChange={(e) => setPreviousLevel(parseFloat(e.target.value))}
                className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#35C9CF] hover:bg-[#7FE3D6] text-[#072B34] font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#35C9CF]/20 min-h-[44px]"
          >
            {loading ? 'Executing ML Inference & 7-Day Forecast...' : 'Run 7-Day ML Prediction'}
          </button>
        </form>

        {/* Prediction Results Panel */}
        <div className="glass rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between space-y-6">
          <h3 className="text-xs font-bold text-[#7FE3D6] uppercase tracking-wider mono border-b border-white/10 pb-2">
            Day 1 Inference Results
          </h3>

          {result ? (
            <div className="space-y-6">
              <div className="text-center space-y-2 py-4 border-b border-white/10">
                <span className="text-xs text-gray-400 uppercase tracking-widest mono">Predicted Level (Today)</span>
                <p className="text-5xl font-extrabold text-[#35C9CF]">{result.predicted_level_m} <span className="text-xl text-white font-normal">m</span></p>
                <div className="flex justify-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadge(result.risk)}`}>
                    {result.risk} Risk
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    {Math.round(result.confidence * 100)}% Confidence
                  </span>
                </div>
                <p className="text-[11px] text-[#EAF6F4]/60 mono mt-2">Engine: {result.model_used}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#35C9CF]" /> Recommended Water Actions
                </h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#0E3A44]/50 p-2.5 rounded-lg border border-white/5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#35C9CF] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
              <Sparkles className="w-10 h-10 text-[#35C9CF]/40" />
              <p className="text-sm">Submit the environmental form to compute AI groundwater forecasts & risk action guidelines.</p>
            </div>
          )}
        </div>
      </div>

      {/* Explainable AI (SHAP) Chart Section */}
      {shapRes && <ShapExplanationCard shapData={shapRes} loading={loading} />}

      {forecastRes && (
        <div className="space-y-6 pt-4 border-t border-white/10">
          <ForecastCards forecast={forecastRes.forecast} />
          <ForecastTable forecast={forecastRes.forecast} />
        </div>
      )}
    </div>
  );
};
