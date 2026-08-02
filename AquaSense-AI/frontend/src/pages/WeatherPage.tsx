import React, { useEffect, useState } from 'react';
import { CloudRain, Compass, Droplets, Gauge, Sun, Thermometer, Wind } from 'lucide-react';
import { fetchWeather } from '../services/api';
import { WeatherData } from '../types';
import { DISTRICTS } from '../components/Navbar';

interface WeatherPageProps {
  district: string;
}

export const WeatherPage: React.FC<WeatherPageProps> = ({ district: initialDistrict }) => {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchWeather(district)
      .then((data) => setWeather(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [district]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" /> Real-Time & Climatology Weather Telemetry
          </h2>
          <p className="text-xs text-[#EAF6F4]/60">
            OpenWeather API live feed with historical CGWB/IMD climatology fallback support.
          </p>
        </div>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="glass bg-[#0E3A44] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d} className="bg-[#072B34]">
              {d} District
            </option>
          ))}
        </select>
      </div>

      {/* Main Weather Metrics Grid */}
      {loading ? (
        <div className="glass rounded-2xl p-12 text-center text-sm text-gray-400">Loading weather metrics...</div>
      ) : weather ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Ambient Temperature</span>
              <Thermometer className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-4xl font-extrabold text-white">{weather.temperature}°C</p>
            <p className="text-xs text-[#EAF6F4]/60">Thermal index for evapotranspiration estimation.</p>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Relative Humidity</span>
              <Droplets className="w-4 h-4 text-[#35C9CF]" />
            </div>
            <p className="text-4xl font-extrabold text-[#35C9CF]">{weather.humidity}%</p>
            <p className="text-xs text-[#EAF6F4]/60">Atmospheric water vapor concentration.</p>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Precipitation (Rainfall)</span>
              <CloudRain className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-4xl font-extrabold text-blue-400">{weather.rainfall} mm</p>
            <p className="text-xs text-[#EAF6F4]/60">Primary aquifer recharge intake metric.</p>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Barometric Pressure</span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-4xl font-extrabold text-white">{weather.pressure} hPa</p>
            <p className="text-xs text-[#EAF6F4]/60">Sea-level atmospheric pressure measurement.</p>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Wind Velocity</span>
              <Wind className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-4xl font-extrabold text-teal-300">{weather.wind_speed} m/s</p>
            <p className="text-xs text-[#EAF6F4]/60">Surface wind speed calculation.</p>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7FE3D6] mono uppercase">
              <span>Telemetry Data Source</span>
              <Compass className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white uppercase mono mt-2">{weather.source}</p>
            <p className="text-xs text-[#EAF6F4]/60">
              {weather.source === 'openweather_live'
                ? 'Live OpenWeather API feed'
                : 'Offline CGWB/IMD climatology fallback model'}
            </p>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center text-sm text-red-400">Failed to fetch weather telemetry.</div>
      )}
    </div>
  );
};
