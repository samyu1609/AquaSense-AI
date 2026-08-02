import React, { useEffect, useState } from 'react';

export const Footer: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? setApiStatus('operational') : setApiStatus('degraded')))
      .catch(() => setApiStatus('offline (start FastAPI backend)'));
  }, []);

  return (
    <footer className="mt-auto border-t border-white/10 py-6 px-4 text-center text-xs text-[#EAF6F4]/50 mono flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
      <p>AquaSense AI · Groundwater Decision Support System</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#35C9CF] animate-ping" />
        Backend Status: <span className="text-[#35C9CF] font-semibold">{apiStatus}</span>
      </div>
    </footer>
  );
};
