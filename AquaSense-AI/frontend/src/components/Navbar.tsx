import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BarChart3, CloudSun, MapPin, Moon, Shield, Sun, UserCheck, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
}

export const DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli',
  'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Cuddalore', 'Kanyakumari'
];

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  selectedDistrict,
  setSelectedDistrict,
}) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/map', label: 'GIS Map', icon: MapPin },
    { path: '/predict', label: 'AI Predictor', icon: Sparkles },
    { path: '/weather', label: 'Weather', icon: CloudSun },
    { path: '/trends', label: 'Analytics', icon: BarChart3 },
    { path: '/admin', label: 'Admin Panel', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#072B34]/80 border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35C9CF] to-[#0E4A56] flex items-center justify-center font-mono font-bold text-[#072B34] shadow-lg shadow-[#35C9CF]/20 group-hover:scale-105 transition-transform">
            AS
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-lg leading-none text-white flex items-center gap-1.5">
              AquaSense <span className="text-[#35C9CF]">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7FE3D6]/70 mono mt-0.5">
              Groundwater Decision Support
            </p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1 ml-6 border-l border-white/10 pl-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  active
                    ? 'bg-[#35C9CF]/15 text-[#35C9CF] border border-[#35C9CF]/30'
                    : 'text-[#EAF6F4]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="glass rounded-lg px-3 py-1.5 text-xs md:text-sm outline-none text-[#EAF6F4] bg-[#0E3A44]/80 border border-[#7FE3D6]/20 focus:border-[#35C9CF]"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d} className="bg-[#072B34] text-white">
              {d} District
            </option>
          ))}
        </select>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="glass rounded-lg p-2 text-sm text-[#7FE3D6] hover:text-white transition"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs mono bg-[#35C9CF]/10 text-[#35C9CF] border border-[#35C9CF]/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {user.name} ({isAdmin ? 'Admin' : 'User'})
            </span>
            <button
              onClick={logout}
              className="glass hover:bg-red-500/20 hover:border-red-500/40 text-red-400 p-2 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/admin"
            className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Login
          </Link>
        )}
      </div>
    </header>
  );
};
