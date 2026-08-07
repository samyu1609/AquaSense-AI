import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { GISMapPage } from './pages/GISMapPage';
import { BorewellPage } from './pages/BorewellPage';
import { SatellitePage } from './pages/SatellitePage';
import { IoTDashboardPage } from './pages/IoTDashboardPage';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { PredictPage } from './pages/PredictPage';
import { WeatherPage } from './pages/WeatherPage';
import { TrendsPage } from './pages/TrendsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Chennai');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col relative overflow-hidden">
          {/* Animated Watermark Ripple Background */}
          <svg
            className="fixed inset-0 -z-10 opacity-[0.06] pointer-events-none"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="500" cy="500" r="120" fill="none" stroke="#35C9CF" strokeWidth="1" className="ripple-line" />
            <circle cx="500" cy="500" r="220" fill="none" stroke="#35C9CF" strokeWidth="1" className="ripple-line" />
            <circle cx="500" cy="500" r="320" fill="none" stroke="#35C9CF" strokeWidth="1" className="ripple-line" />
            <circle cx="500" cy="500" r="420" fill="none" stroke="#35C9CF" strokeWidth="1" className="ripple-line" />
          </svg>

          <Navbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
          />

          <main className="flex-1 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<DashboardPage district={selectedDistrict} setDistrict={setSelectedDistrict} />} />
              <Route path="/map" element={<GISMapPage district={selectedDistrict} />} />
              <Route path="/borewell" element={<BorewellPage district={selectedDistrict} />} />
              <Route path="/satellite" element={<SatellitePage district={selectedDistrict} />} />
              <Route path="/iot" element={<IoTDashboardPage district={selectedDistrict} />} />
              <Route path="/calculators" element={<CalculatorsPage district={selectedDistrict} />} />
              <Route path="/predict" element={<PredictPage district={selectedDistrict} />} />
              <Route path="/weather" element={<WeatherPage district={selectedDistrict} />} />
              <Route path="/trends" element={<TrendsPage district={selectedDistrict} />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

