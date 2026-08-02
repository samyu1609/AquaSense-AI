import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Droplets } from 'lucide-react';
import { fetchTrend } from '../services/api';
import { TrendPoint } from '../types';
import { DISTRICTS } from '../components/Navbar';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface TrendsPageProps {
  district: string;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({ district: initialDistrict }) => {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchTrend(district)
      .then((res) => setTrendData(res.monthly_trend))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [district]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#35C9CF]" /> Hydrogeological Trend & Analytics
          </h2>
          <p className="text-xs text-[#EAF6F4]/60">
            Historical groundwater level change vs monsoon precipitation profiles across Tamil Nadu districts.
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

      {/* Chart 1: Line Chart for Level */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-md font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#35C9CF]" /> Monthly Groundwater Level Depth (m)
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading trend analytics...</div>
        ) : (
          <div className="h-72">
            <Line
              data={{
                labels: trendData.map((r) => r.Date),
                datasets: [
                  {
                    label: 'Groundwater Level (m)',
                    data: trendData.map((r) => r.groundwater_level),
                    borderColor: '#35C9CF',
                    backgroundColor: 'rgba(53, 201, 207, 0.1)',
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#EAF6F4' } },
                  y: { ticks: { color: '#EAF6F4' }, title: { display: true, text: 'Level (m)', color: '#EAF6F4' } },
                },
                plugins: { legend: { labels: { color: '#EAF6F4' } } },
              }}
            />
          </div>
        )}
      </div>

      {/* Chart 2: Dual Axis Rainfall vs Level */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-md font-semibold text-white flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" /> Rainfall Intake (mm) vs Groundwater Depth Correlation
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading correlation data...</div>
        ) : (
          <div className="h-72">
            <Bar
              data={{
                labels: trendData.map((r) => r.Date),
                datasets: [
                  {
                    label: 'Rainfall (mm)',
                    data: trendData.map((r) => r.rainfall),
                    backgroundColor: 'rgba(127, 227, 214, 0.4)',
                    borderColor: '#7FE3D6',
                    borderWidth: 1,
                    yAxisID: 'y1',
                  },
                  {
                    label: 'Groundwater Level (m)',
                    data: trendData.map((r) => r.groundwater_level),
                    type: 'line' as any,
                    borderColor: '#EAB308',
                    backgroundColor: '#EAB308',
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
                  y: { ticks: { color: '#EAB308' }, title: { display: true, text: 'Groundwater (m)', color: '#EAB308' } },
                  y1: { position: 'right', ticks: { color: '#7FE3D6' }, title: { display: true, text: 'Rainfall (mm)', color: '#7FE3D6' }, grid: { drawOnChartArea: false } },
                },
                plugins: { legend: { labels: { color: '#EAF6F4' } } },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
