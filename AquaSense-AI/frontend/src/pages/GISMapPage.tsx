import React, { useEffect, useState } from 'react';
import { Layers, MapPin, Navigation, Filter } from 'lucide-react';
import { fetchMapData } from '../services/api';
import { WellMarker } from '../types';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface GISMapPageProps {
  district: string;
}

const RecenterMap: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
};

// Custom icon for user location
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #35C9CF; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(53, 201, 207, 0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const GISMapPage: React.FC<GISMapPageProps> = ({ district }) => {
  const [wells, setWells] = useState<WellMarker[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMapData()
      .then((res) => setWells(res.wells))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Auto-center map on user GPS position (silent, runs once on mount)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => { /* denied or unavailable — keep default center */ },
        { timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => alert('Could not access device geolocation')
      );
    }
  };

  const filteredWells = filterRisk === 'All'
    ? wells
    : wells.filter((w) => w.risk.toLowerCase() === filterRisk.toLowerCase());

  // District centroid lookup for quick navigation
  const districtCoords: Record<string, [number, number]> = {
    Chennai: [13.0827, 80.2707],
    Coimbatore: [11.0168, 76.9558],
    Madurai: [9.9252, 78.1198],
    Salem: [11.6643, 78.146],
    Tiruchirappalli: [10.7905, 78.7047],
    Tirunelveli: [8.7139, 77.7567],
    Erode: [11.341, 77.7172],
    Vellore: [12.9165, 79.1325],
    Thanjavur: [10.787, 79.1378],
    Dindigul: [10.3673, 77.9803],
    Cuddalore: [11.748, 79.7714],
    Kanyakumari: [8.0883, 77.5385],
  };

  const center: [number, number] = userPos || districtCoords[district] || [11.1271, 78.6569];

  return (
    <div className="space-y-6">
      {/* Map Control Bar */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#35C9CF]" />
          <div>
            <h2 className="text-lg font-semibold text-white">Observation Well GIS Map</h2>
            <p className="text-xs text-[#EAF6F4]/60">
              Interactive spatial monitoring of CGWB observation wells in Tamil Nadu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Risk Filter */}
          <div className="flex items-center gap-2 bg-[#0E3A44] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#35C9CF]" />
            <span className="text-gray-300">Filter:</span>
            {['All', 'Safe', 'Moderate', 'Critical'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  filterRisk === r
                    ? 'bg-[#35C9CF] text-[#072B34]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={locateUser}
            className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" /> My Location
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="glass rounded-2xl p-3 h-[580px] relative overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading map GIS layers...</div>
        ) : (
          <MapContainer center={center} zoom={8} className="h-full w-full rounded-xl">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap lat={center[0]} lng={center[1]} zoom={8} />

            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup className="custom-popup">
                  <div className="p-1 space-y-1 text-xs text-[#072B34]">
                    <p className="font-bold text-sm">Your Location</p>
                    <p>Latitude: <span className="font-mono">{userPos[0].toFixed(6)}</span></p>
                    <p>Longitude: <span className="font-mono">{userPos[1].toFixed(6)}</span></p>
                  </div>
                </Popup>
              </Marker>
            )}

            {filteredWells.map((w, idx) => (
              <CircleMarker
                key={idx}
                center={[w.latitude, w.longitude]}
                radius={8}
                pathOptions={{
                  color: w.colour,
                  fillColor: w.colour,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-1 text-xs text-[#072B34]">
                    <p className="font-bold text-sm">{w.district} District</p>
                    <p>Observation Well: <span className="font-mono">{w.well}</span></p>
                    <p>Village: {w.village}</p>
                    <p>Water Level: <span className="font-bold">{w.groundwater_level} m</span></p>
                    <p className="flex items-center gap-1">
                      Risk Status:{' '}
                      <span className="font-bold" style={{ color: w.colour }}>
                        {w.risk}
                      </span>
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-green-500 shadow-md shadow-green-500/30" />
          <div>
            <p className="text-sm font-semibold text-white">Safe Band (&ge; 10 m)</p>
            <p className="text-xs text-[#EAF6F4]/60">Sufficient groundwater storage capacity.</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-yellow-500 shadow-md shadow-yellow-500/30" />
          <div>
            <p className="text-sm font-semibold text-white">Moderate Band (5 – 10 m)</p>
            <p className="text-xs text-[#EAF6F4]/60">Controlled usage & rainwater harvesting recommended.</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-red-500 shadow-md shadow-red-500/30" />
          <div>
            <p className="text-sm font-semibold text-white">Critical Band (&lt; 5 m)</p>
            <p className="text-xs text-[#EAF6F4]/60">High depletion risk — immediate restriction needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
