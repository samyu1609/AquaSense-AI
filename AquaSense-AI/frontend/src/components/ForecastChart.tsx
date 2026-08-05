import React, { useState } from 'react';
import { DailyForecastItem, TrendPoint } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { LineChart, BarChart2, Thermometer, CloudRain, ShieldAlert } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  forecast: DailyForecastItem[];
  historicalTrend?: TrendPoint[];
  district: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, historicalTrend = [], district }) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'historical_vs_forecast' | 'rainfall' | 'temp' | 'risk'>('forecast');

  const dates = forecast.map((f) => f.day_label);
  const levels = forecast.map((f) => f.groundwater_level);
  const rainfalls = forecast.map((f) => f.rainfall);
  const temps = forecast.map((f) => f.temperature);
  const confidences = forecast.map((f) => f.confidence * 100);

  // Historical vs Forecast combined data
  const histDates = historicalTrend.slice(-7).map((h) => h.Date || 'Past');
  const histLevels = historicalTrend.slice(-7).map((h) => h.groundwater_level);

  const combinedLabels = [...histDates, ...dates];
  const combinedHistData = [...histLevels, ...Array(dates.length).fill(null)];
  const combinedForecastData = [...Array(histDates.length - 1).fill(null), histLevels.slice(-1)[0] || levels[0], ...levels];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#EAF6F4',
          font: { family: 'Space Grotesk', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(7, 43, 52, 0.95)',
        titleColor: '#35C9CF',
        bodyColor: '#EAF6F4',
        borderColor: 'rgba(53, 201, 207, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        ticks: { color: '#EAF6F4', font: { family: 'Space Grotesk' } },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        ticks: { color: '#35C9CF', font: { family: 'Space Grotesk' } },
        title: { display: true, text: 'Level (m)', color: '#35C9CF' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
      },
    },
  };

  const tabs = [
    { id: 'forecast', label: '7-Day Forecast Line', icon: LineChart },
    { id: 'historical_vs_forecast', label: 'Historical vs Forecast', icon: BarChart2 },
    { id: 'rainfall', label: 'Rainfall vs Groundwater', icon: CloudRain },
    { id: 'temp', label: 'Temperature vs Groundwater', icon: Thermometer },
    { id: 'risk', label: 'Confidence & Risk Trend', icon: ShieldAlert },
  ];

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <LineChart className="w-5 h-5 text-[#35C9CF]" />
          Interactive Multi-Metric Analytics ({district})
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#35C9CF] text-[#072B34] font-bold shadow-md shadow-[#35C9CF]/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-72 w-full">
        {activeTab === 'forecast' && (
          <Line
            data={{
              labels: dates,
              datasets: [
                {
                  label: 'Predicted Groundwater Depth (m)',
                  data: levels,
                  borderColor: '#35C9CF',
                  backgroundColor: 'rgba(53, 201, 207, 0.15)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: '#35C9CF',
                  pointBorderColor: '#FFFFFF',
                },
              ],
            }}
            options={chartOptions}
          />
        )}

        {activeTab === 'historical_vs_forecast' && (
          <Line
            data={{
              labels: combinedLabels,
              datasets: [
                {
                  label: 'Historical Groundwater (m)',
                  data: combinedHistData,
                  borderColor: '#94A3B8',
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  fill: false,
                  tension: 0.3,
                  pointRadius: 5,
                },
                {
                  label: '7-Day ML Forecast (m)',
                  data: combinedForecastData,
                  borderColor: '#35C9CF',
                  backgroundColor: 'rgba(53, 201, 207, 0.15)',
                  borderDash: [5, 5],
                  fill: true,
                  tension: 0.4,
                  pointRadius: 6,
                  pointBackgroundColor: '#35C9CF',
                },
              ],
            }}
            options={chartOptions}
          />
        )}

        {activeTab === 'rainfall' && (
          <Bar
            data={{
              labels: dates,
              datasets: [
                {
                  label: 'Rainfall (mm)',
                  data: rainfalls,
                  backgroundColor: 'rgba(96, 165, 250, 0.4)',
                  borderColor: '#60A5FA',
                  borderWidth: 1,
                  yAxisID: 'y1',
                },
                {
                  label: 'Groundwater Level (m)',
                  data: levels,
                  type: 'line' as any,
                  borderColor: '#35C9CF',
                  backgroundColor: '#35C9CF',
                  borderWidth: 3,
                  tension: 0.4,
                  yAxisID: 'y',
                },
              ],
            }}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y1: {
                  position: 'right' as const,
                  ticks: { color: '#60A5FA' },
                  title: { display: true, text: 'Rain (mm)', color: '#60A5FA' },
                  grid: { drawOnChartArea: false },
                },
              },
            }}
          />
        )}

        {activeTab === 'temp' && (
          <Line
            data={{
              labels: dates,
              datasets: [
                {
                  label: 'Temperature (°C)',
                  data: temps,
                  borderColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  tension: 0.4,
                  yAxisID: 'y1',
                },
                {
                  label: 'Groundwater Level (m)',
                  data: levels,
                  borderColor: '#35C9CF',
                  backgroundColor: 'rgba(53, 201, 207, 0.15)',
                  tension: 0.4,
                  yAxisID: 'y',
                },
              ],
            }}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y1: {
                  position: 'right' as const,
                  ticks: { color: '#F59E0B' },
                  title: { display: true, text: 'Temp (°C)', color: '#F59E0B' },
                  grid: { drawOnChartArea: false },
                },
              },
            }}
          />
        )}

        {activeTab === 'risk' && (
          <Bar
            data={{
              labels: dates,
              datasets: [
                {
                  label: 'Forecast Confidence Score (%)',
                  data: confidences,
                  backgroundColor: 'rgba(53, 201, 207, 0.5)',
                  borderColor: '#35C9CF',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  min: 50,
                  max: 100,
                  ticks: { color: '#35C9CF' },
                  title: { display: true, text: 'Confidence (%)', color: '#35C9CF' },
                  grid: { color: 'rgba(255, 255, 255, 0.08)' },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
};
