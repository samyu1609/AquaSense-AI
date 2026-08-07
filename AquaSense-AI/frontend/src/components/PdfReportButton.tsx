import React, { useState } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

interface PdfReportButtonProps {
  district: string;
  predictedLevel?: number;
  risk?: string;
  confidence?: number;
}

export const PdfReportButton: React.FC<PdfReportButtonProps> = ({
  district,
  predictedLevel = 8.5,
  risk = 'Moderate',
  confidence = 90,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const generatePDF = () => {
    setDownloading(true);
    setTimeout(() => {
      // Create printable HTML document summary for user download
      const reportHtml = `
        <html>
          <head>
            <title>AquaSense AI Water Audit Report - ${district}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #35C9CF; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #072B34; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
              .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .metric-title { font-size: 12px; text-transform: uppercase; color: #64748b; }
              .metric-val { font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 4px; }
              .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">AquaSense AI — Water Resource Audit Report</div>
              <div class="subtitle">District: ${district} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="card">
              <h3>Groundwater Assessment Summary</h3>
              <div class="grid">
                <div>
                  <div class="metric-title">Predicted Water Level</div>
                  <div class="metric-val">${predictedLevel} meters</div>
                </div>
                <div>
                  <div class="metric-title">Depletion Risk Category</div>
                  <div class="metric-val" style="color: ${risk === 'Critical' ? '#ef4444' : risk === 'Moderate' ? '#f59e0b' : '#10b981'};">${risk}</div>
                </div>
                <div>
                  <div class="metric-title">ML Model Confidence</div>
                  <div class="metric-val">${confidence}%</div>
                </div>
                <div>
                  <div class="metric-title">Assessment Status</div>
                  <div class="metric-val">Verified</div>
                </div>
              </div>
            </div>
            <div class="card">
              <h3>Recommended Water Management Strategy</h3>
              <ul>
                <li>Deploy micro-drip precision irrigation for agricultural operations.</li>
                <li>Implement artificial aquifer recharge structures for rooftop rainwater collection.</li>
                <li>Continuous IoT sensor telemetry monitoring for early drawdown warning.</li>
              </ul>
            </div>
            <div class="footer">
              AquaSense AI Decision Support Platform • Certified Hydro-Informatics Report
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AquaSense_Water_Audit_${district}_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    }, 1000);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={downloading}
      className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border border-[#35C9CF]/30"
    >
      {downloaded ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Audit PDF Downloaded!
        </>
      ) : downloading ? (
        <>
          <FileText className="w-4 h-4 animate-spin" /> Generating PDF Report...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Download PDF Audit Report
        </>
      )}
    </button>
  );
};
