import React, { useEffect, useState } from 'react';
import { MapPin, Target, CheckCircle, AlertTriangle, ShieldCheck, Compass, Sparkles } from 'lucide-react';
import { fetchBorewellRecommendations } from '../services/api';
import { BorewellSiteResponse, LatLngPoint } from '../types';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface BorewellPageProps {
  district: string;
}

export const BorewellPage: React.FC<BorewellPageProps> = ({ district }) => {
  const [data, setData] = useState<BorewellSiteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Default land boundary polygon coordinates in district
  const districtCoords: Record<string, [number, number]> = {
    Chennai: [13.0827, 80.2707],
    Coimbatore: [11.0168, 76.9558],
    Madurai: [9.9252, 78.1198],
    Salem: [11.6643, 78.1460],
  };

  const center = districtCoords[district] || [13.0827, 80.2707];

  const defaultBoundary: LatLngPoint[] = [
    { lat: center[0] - 0.008, lng: center[1] - 0.008 },
    { lat: center[0] + 0.008, lng: center[1] - 0.008 },
    { lat: center[0] + 0.008, lng: center[1] + 0.008 },
    { lat: center[0] - 0.008, lng: center[1] + 0.008 },
  ];

  useEffect(() => {
    setLoading(true);
    fetchBorewellRecommendations(district, defaultBoundary)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [district]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#35C9CF]/20 text-[#35C9CF] flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Borewell Site Recommendation</h2>
            <p className="text-xs text-[#EAF6F4]/60">
              Spatial land boundary sampling & multi-point ML hydro-evaluation for optimal drilling site selection.
            </p>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-2 bg-[#0E3A44] px-4 py-2 rounded-xl border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-300">Overall Parcel Risk Score:</span>
            <span className="font-bold text-white font-mono">{data.overall_risk_score} / 100</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-400 text-sm">
          Evaluating land boundary sampling grid with AquaSense ML spatial engine...
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Best Recommendation Highlight Card */}
          <div className="glass rounded-2xl p-6 space-y-5 lg:col-span-1 border border-[#35C9CF]/30">
            <div className="flex items-center gap-2 text-[#35C9CF] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Top Recommended Drilling Site
            </div>

            <div className="space-y-3">
              <div className="bg-[#072B34] p-4 rounded-xl space-y-1">
                <p className="text-xs text-gray-400">Target Coordinates</p>
                <p className="text-sm font-mono font-bold text-white">
                  Lat: {data.best_location.lat}, Lng: {data.best_location.lng}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0E3A44] p-3.5 rounded-xl text-xs space-y-1">
                  <p className="text-gray-400">Success Probability</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">
                    {(data.best_location.success_probability * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-[#0E3A44] p-3.5 rounded-xl text-xs space-y-1">
                  <p className="text-gray-400">Recommended Depth</p>
                  <p className="text-lg font-bold text-[#35C9CF] font-mono">
                    {data.best_location.recommended_depth_m} m
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0E3A44] p-3.5 rounded-xl text-xs space-y-1">
                  <p className="text-gray-400">Expected Water Table</p>
                  <p className="text-lg font-bold text-white font-mono">
                    {data.best_location.predicted_level_m} m
                  </p>
                </div>
                <div className="bg-[#0E3A44] p-3.5 rounded-xl text-xs space-y-1">
                  <p className="text-gray-400">Site Risk Index</p>
                  <p className="text-lg font-bold text-yellow-400 font-mono">
                    {data.best_location.risk_score}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              {data.summary}
            </div>
          </div>

          {/* Interactive GIS Spatial Leaflet Map */}
          <div className="lg:col-span-2 glass rounded-2xl p-3 h-[450px] relative overflow-hidden">
            <MapContainer center={[center[0], center[1]]} zoom={14} className="h-full w-full rounded-xl">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polygon
                positions={defaultBoundary.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: '#35C9CF', fillColor: '#35C9CF', fillOpacity: 0.15 }}
              />
              {data.candidates.map((cand, idx) => {
                const isBest = cand.lat === data.best_location.lat && cand.lng === data.best_location.lng;
                return (
                  <CircleMarker
                    key={idx}
                    center={[cand.lat, cand.lng]}
                    radius={isBest ? 12 : 7}
                    pathOptions={{
                      color: isBest ? '#10B981' : cand.risk_colour,
                      fillColor: isBest ? '#10B981' : cand.risk_colour,
                      fillOpacity: isBest ? 0.95 : 0.7,
                      weight: isBest ? 3 : 1,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs text-[#072B34]">
                        <p className="font-bold">{isBest ? '⭐ Best Recommended Site' : `Candidate Site #${idx + 1}`}</p>
                        <p>Success Prob: <b>{(cand.success_probability * 100).toFixed(0)}%</b></p>
                        <p>Rec. Depth: <b>{cand.recommended_depth_m}m</b></p>
                        <p>Water Table: <b>{cand.predicted_level_m}m</b></p>
                        <p>Risk Index: <b>{cand.risk_score}</b></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
};
