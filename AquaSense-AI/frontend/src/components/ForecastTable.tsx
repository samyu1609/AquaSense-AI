import React from 'react';
import { Table, ShieldCheck, Thermometer, CloudRain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DailyForecastItem } from '../types';

interface ForecastTableProps {
  forecast: DailyForecastItem[];
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ forecast }) => {
  const riskBadge = (risk: string) => {
    if (risk === 'Safe') return 'bg-green-500/15 text-green-400 border-green-500/30';
    if (risk === 'Moderate') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  };

  const getTrendBadge = (trend?: string) => {
    const t = trend || 'Stable';
    if (t === 'Rising') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" /> Rising
        </span>
      );
    }
    if (t === 'Falling') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
          <TrendingDown className="w-3.5 h-3.5" /> Falling
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">
        <Minus className="w-3.5 h-3.5" /> Stable
      </span>
    );
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Table className="w-5 h-5 text-[#35C9CF]" />
          7-Day Forecast Data Table
        </h3>
        <span className="text-xs text-gray-400 mono">Day • Predicted Groundwater • Trend</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[#7FE3D6] mono text-xs uppercase border-b border-white/10 bg-[#0E3A44]/60">
            <tr>
              <th className="py-3 px-4">Day</th>
              <th className="py-3 px-4">Predicted Groundwater</th>
              <th className="py-3 px-4">Trend</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Risk Status</th>
              <th className="py-3 px-4">Weather Telemetry</th>
              <th className="py-3 px-4">Irrigation Guidelines</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {forecast.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-white/5 transition ${
                  idx === 0 ? 'bg-[#35C9CF]/5 font-medium' : ''
                }`}
              >
                <td className="py-3 px-4 font-bold text-[#35C9CF] mono">
                  {row.day_label}
                </td>
                <td className="py-3 px-4 font-extrabold text-white">
                  {row.groundwater_level.toFixed(2)} <span className="text-xs text-gray-400 font-normal">m</span>
                </td>
                <td className="py-3 px-4">
                  {getTrendBadge(row.trend)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs font-semibold text-gray-200">
                      {Math.round(row.confidence * 100)}%
                    </span>
                    <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="bg-[#35C9CF] h-full rounded-full"
                        style={{ width: `${row.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskBadge(row.risk)}`}>
                    {row.risk}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-gray-300">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      {row.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      {row.rainfall}mm
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-300 max-w-xs truncate" title={row.recommendation}>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#35C9CF] shrink-0" />
                    <span>{row.recommendation}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
