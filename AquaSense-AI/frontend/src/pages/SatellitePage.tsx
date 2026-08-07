import React, { useEffect, useState } from 'react';
import { Layers, Globe, Eye, Droplets, Sun, Sparkles } from 'lucide-react';
import { fetchSatelliteLayers } from '../services/api';
import { SatelliteDataResponse, SatelliteLayer } from '../types';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface SatellitePageProps {
  district: string;
}

export const SatellitePage: React.FC<SatellitePageProps> = ({ district }) => {
  const [satelliteData, setSatelliteData] = useState<SatelliteDataResponse | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>('ndvi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSatelliteLayers(district)
      .then((res) => setSatelliteData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [district]);

  const districtCoords: Record<string, [number, number]> = {
    Chennai: [13.0827, 80.2707],
    Coimbatore: [11.0168, 76.9558],
    Madurai: [9.9252, 78.1198],
    Salem: [11.6643, 78.1460],
  };

  const center = districtCoords[district] || [13.0827, 80.2707];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#35C9CF]/20 text-[#35C9CF] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Satellite Remote Sensing Integration</h2>
            <p className="text-xs text-[#EAF6F4]/60">
              Sentinel-2 L2A & Landsat-9 spectral proxies: NDVI (Vegetation), NDWI (Water Index), and NDDI (Dryness Index).
            </p>
          </div>
        </div>

        {satelliteData && (
          <div className="flex items-center gap-2 bg-[#0E3A44] px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-[#35C9CF]" />
            <span>Active Imagery Feeds:</span>
            <span className="font-semibold text-white">{satelliteData.satellite_sources.join(', ')}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-400 text-sm">
          Processing Sentinel-2 & Landsat surface spectral imagery...
        </div>
      ) : satelliteData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Layer Controls Panel */}
          <div className="glass rounded-2xl p-6 space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#35C9CF]" /> Select Satellite Spectral Layer
            </h3>

            <div className="space-y-3">
              {satelliteData.layers.map((layer: SatelliteLayer) => {
                const isActive = activeLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`w-full text-left p-4 rounded-xl transition border ${
                      isActive
                        ? 'bg-[#35C9CF]/20 border-[#35C9CF] text-white shadow-lg'
                        : 'bg-[#0E3A44]/60 border-white/5 text-gray-300 hover:bg-[#0E3A44]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{layer.name}</span>
                      <Eye className={`w-4 h-4 ${isActive ? 'text-[#35C9CF]' : 'text-gray-500'}`} />
                    </div>
                    <p className="text-xs text-[#EAF6F4]/60 mt-1">{layer.interpretation}</p>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Mean Index:</span>
                      <span className="text-[#35C9CF] font-bold">{layer.mean_val}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leaflet Satellite Layer Display */}
          <div className="lg:col-span-2 glass rounded-2xl p-3 h-[480px] relative overflow-hidden">
            <MapContainer center={center} zoom={11} className="h-full w-full rounded-xl">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <CircleMarker
                center={center}
                radius={35}
                pathOptions={{
                  color: activeLayer === 'ndvi' ? '#10B981' : activeLayer === 'ndwi' ? '#3B82F6' : '#EF4444',
                  fillColor: activeLayer === 'ndvi' ? '#10B981' : activeLayer === 'ndwi' ? '#3B82F6' : '#EF4444',
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs text-[#072B34]">
                    <p className="font-bold">{district} Satellite Layer</p>
                    <p>Spectral Proxy: <b>{activeLayer.toUpperCase()}</b></p>
                    <p>Status: <b>Healthy Index</b></p>
                  </div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
};
