import React from 'react';
import { Calendar, Droplet, Thermometer, CloudRain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DailyForecastItem } from '../types';

interface ForecastCardsProps {
  forecast: DailyForecastItem[];
}

export const ForecastCards: React.FC<ForecastCardsProps> = ({ forecast }) => {
  const getRiskStyle = (risk: string) => {
    if (risk === 'Safe') return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (risk === 'Moderate') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  const getTrendBadge = (trend?: string) => {
    const t = trend || 'Stable';
    if (t === 'Rising') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
          <TrendingUp className="w-3 h-3" /> Rising
        </span>
      );
    }
    if (t === 'Falling') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
          <TrendingDown className="w-3 h-3" /> Falling
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
        <Minus className="w-3 h-3" /> Stable
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#35C9CF]" />
          7-Day Groundwater Level Forecast
        </h3>
        <span className="text-xs text-[#7FE3D6] mono font-semibold">
          7-Day Forecast Series
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {forecast.map((item, idx) => (
          <div
            key={idx}
            className={`glass rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg ${
              idx === 0 ? 'border-[#35C9CF]/50 ring-1 ring-[#35C9CF]/30' : ''
            }`}
          >
            {/* Header badge */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mono ${
                  idx === 0 ? 'bg-[#35C9CF]/20 text-[#35C9CF]' : 'text-gray-400'
                }`}
              >
                {item.day_label}
              </span>
              <span className="text-[10px] text-gray-400 mono">
                {item.date.split('-').slice(1).join('/')}
              </span>
            </div>

            {/* Depth Level Value */}
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mono flex items-center gap-1">
                <Droplet className="w-3 h-3 text-[#35C9CF]" /> Predicted Level
              </div>
              <p className="text-2xl font-black text-[#35C9CF] mt-0.5">
                {item.groundwater_level.toFixed(2)}{' '}
                <span className="text-xs font-normal text-white">m</span>
              </p>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Trend:</span>
              {getTrendBadge(item.trend)}
            </div>

            {/* Risk Badge */}
            <div>
              <span
                className={`inline-block w-full text-center py-1 px-2 rounded-lg text-xs font-bold border ${getRiskStyle(
                  item.risk
                )}`}
              >
                {item.risk} Risk
              </span>
            </div>

            {/* Weather Mini Bar */}
            <div className="flex items-center justify-between text-[11px] text-gray-300 border-t border-white/10 pt-2">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-400" />
                {item.temperature}°C
              </span>
              <span className="flex items-center gap-1">
                <CloudRain className="w-3 h-3 text-blue-400" />
                {item.rainfall}mm
              </span>
            </div>

            {/* Confidence */}
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-gray-400">
                <span>Confidence:</span>
                <span className="font-bold text-white">{Math.round(item.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#35C9CF] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
