import React, { useState } from 'react';
import { Calculator, Sprout, Droplets, CloudRain, DollarSign, Wheat, ArrowRight } from 'lucide-react';
import {
  postSmartIrrigation,
  postWaterConsumption,
  postRainwaterHarvesting,
  postCropRecommendations,
  postBorewellCost,
} from '../services/api';
import {
  SmartIrrigationResponse,
  WaterConsumptionResponse,
  RainwaterHarvestingResponse,
  CropRecommendationResponse,
  BorewellCostResponse,
} from '../types';

interface CalculatorsPageProps {
  district: string;
}

export const CalculatorsPage: React.FC<CalculatorsPageProps> = ({ district }) => {
  const [activeTab, setActiveTab] = useState<'irrigation' | 'consumption' | 'rainwater' | 'crop' | 'cost'>('irrigation');

  // Smart Irrigation State
  const [irrCrop, setIrrCrop] = useState('Paddy');
  const [irrAcres, setIrrAcres] = useState(2.5);
  const [irrSoil, setIrrSoil] = useState('Loamy');
  const [irrWaterDepth, setIrrWaterDepth] = useState(8.5);
  const [irrResult, setIrrResult] = useState<SmartIrrigationResponse | null>(null);

  // Water Consumption State
  const [conCrop, setConCrop] = useState('Sugarcane');
  const [conAcres, setConAcres] = useState(3.0);
  const [conSource, setConSource] = useState('Borewell');
  const [conResult, setConResult] = useState<WaterConsumptionResponse | null>(null);

  // Rainwater Harvesting State
  const [rwArea, setRwArea] = useState(150);
  const [rwRain, setRwRain] = useState(950);
  const [rwResult, setRwResult] = useState<RainwaterHarvestingResponse | null>(null);

  // Crop Recommendation State
  const [cropSoil, setCropSoil] = useState('Red Clay');
  const [cropRain, setCropRain] = useState(65);
  const [cropTemp, setCropTemp] = useState(30);
  const [cropDepth, setCropDepth] = useState(9.0);
  const [cropResult, setCropResult] = useState<CropRecommendationResponse | null>(null);

  // Borewell Cost State
  const [costDepth, setCostDepth] = useState(75);
  const [costGeo, setCostGeo] = useState('Hard Rock');
  const [costCasing, setCostCasing] = useState('PVC');
  const [costResult, setCostResult] = useState<BorewellCostResponse | null>(null);

  const handleIrrigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postSmartIrrigation({
        crop: irrCrop,
        land_area_acres: irrAcres,
        soil_type: irrSoil,
        current_water_table_m: irrWaterDepth,
      });
      setIrrResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postWaterConsumption({
        crop: conCrop,
        land_area_acres: conAcres,
        water_source: conSource,
        current_water_table_m: 8.5,
      });
      setConResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRainwaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postRainwaterHarvesting({ roof_area_sqm: rwArea, annual_rainfall_mm: rwRain });
      setRwResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postCropRecommendations({
        district,
        groundwater_level_m: cropDepth,
        rainfall_mm: cropRain,
        temperature_c: cropTemp,
        soil_type: cropSoil,
      });
      setCropResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postBorewellCost({
        target_depth_m: costDepth,
        geology_type: costGeo,
        casing_type: costCasing,
      });
      setCostResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#35C9CF]/20 text-[#35C9CF] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Water & Agro-Hydro Decision Calculators</h2>
            <p className="text-xs text-[#EAF6F4]/60">
              Interactive solvers: Smart Irrigation, Water Consumption, Rainwater Harvesting, Crop Advisory & Borewell Cost.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#0E3A44] p-1.5 rounded-2xl border border-white/10 text-xs">
        <button
          onClick={() => setActiveTab('irrigation')}
          className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activeTab === 'irrigation' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" /> Smart Irrigation
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activeTab === 'consumption' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" /> Consumption Calculator
        </button>

        <button
          onClick={() => setActiveTab('rainwater')}
          className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activeTab === 'rainwater' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" /> Rainwater Harvesting
        </button>

        <button
          onClick={() => setActiveTab('crop')}
          className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activeTab === 'crop' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Wheat className="w-3.5 h-3.5" /> Crop Advisory
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activeTab === 'cost' ? 'bg-[#35C9CF] text-[#072B34] font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Borewell Cost Estimator
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'irrigation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleIrrigationSubmit} className="glass rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Smart Irrigation Parameters</h3>
            <div>
              <label className="text-gray-300 block mb-1">Crop Variety</label>
              <select
                value={irrCrop}
                onChange={(e) => setIrrCrop(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['Paddy', 'Sugarcane', 'Cotton', 'Maize', 'Millets', 'Groundnut', 'Banana'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Land Area (Acres)</label>
              <input
                type="number"
                step="0.5"
                value={irrAcres}
                onChange={(e) => setIrrAcres(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Soil Type</label>
              <select
                value={irrSoil}
                onChange={(e) => setIrrSoil(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['Loamy', 'Clay', 'Sandy', 'Red Soil'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-[#35C9CF] text-[#072B34] font-bold py-3 rounded-xl hover:bg-[#35C9CF]/90 transition"
            >
              Calculate Precision Irrigation
            </button>
          </form>

          {irrResult && (
            <div className="glass rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#35C9CF]">Smart Irrigation Result</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Daily Water Req.</p>
                  <p className="text-lg font-bold text-white font-mono">{irrResult.daily_water_req_m3} m³</p>
                </div>
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Micro-Drip Savings</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">{irrResult.water_saving_pct}%</p>
                </div>
              </div>
              <div className="bg-[#0E3A44] p-3.5 rounded-xl space-y-1">
                <p className="text-[#35C9CF] font-semibold">Recommended Watering Window:</p>
                <p className="text-gray-200">{irrResult.recommended_timing}</p>
              </div>
              <p className="text-gray-300 bg-white/5 p-3 rounded-xl leading-relaxed">{irrResult.schedule_summary}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'consumption' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleConsumptionSubmit} className="glass rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Water Demand Parameters</h3>
            <div>
              <label className="text-gray-300 block mb-1">Crop</label>
              <select
                value={conCrop}
                onChange={(e) => setConCrop(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['Sugarcane', 'Paddy', 'Cotton', 'Maize', 'Millets'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Land Area (Acres)</label>
              <input
                type="number"
                step="0.5"
                value={conAcres}
                onChange={(e) => setConAcres(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#35C9CF] text-[#072B34] font-bold py-3 rounded-xl hover:bg-[#35C9CF]/90 transition"
            >
              Calculate Consumption Security
            </button>
          </form>

          {conResult && (
            <div className="glass rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#35C9CF]">Water Consumption Report</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Total Crop Water Demand</p>
                  <p className="text-lg font-bold text-white font-mono">{conResult.required_water_m3} m³</p>
                </div>
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Water Security Horizon</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">{conResult.security_days} Days</p>
                </div>
              </div>
              <p className="text-gray-300 bg-[#0E3A44] p-3.5 rounded-xl">{conResult.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rainwater' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleRainwaterSubmit} className="glass rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Rainwater Catchment Parameters</h3>
            <div>
              <label className="text-gray-300 block mb-1">Rooftop Catchment Area (sq. meters)</label>
              <input
                type="number"
                value={rwArea}
                onChange={(e) => setRwArea(parseFloat(e.target.value) || 100)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Annual Regional Rainfall (mm)</label>
              <input
                type="number"
                value={rwRain}
                onChange={(e) => setRwRain(parseFloat(e.target.value) || 800)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#35C9CF] text-[#072B34] font-bold py-3 rounded-xl hover:bg-[#35C9CF]/90 transition"
            >
              Calculate Harvestable Rainwater
            </button>
          </form>

          {rwResult && (
            <div className="glass rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#35C9CF]">Rainwater Harvesting Potential</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Harvestable Rainwater</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">{rwResult.harvestable_water_liters.toLocaleString()} L</p>
                </div>
                <div className="bg-[#072B34] p-3.5 rounded-xl space-y-1">
                  <p className="text-gray-400">Recommended Storage Tank</p>
                  <p className="text-lg font-bold text-[#35C9CF] font-mono">{rwResult.recommended_tank_size_liters.toLocaleString()} L</p>
                </div>
              </div>
              <div className="bg-[#0E3A44] p-3.5 rounded-xl space-y-1">
                <p className="text-gray-300">Aquifer Recharge Potential: <span className="font-bold text-white">{rwResult.recharge_potential_liters.toLocaleString()} L</span></p>
                <p className="text-gray-300">Harvesting Efficiency: <span className="font-bold text-emerald-400">{rwResult.efficiency_score}%</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'crop' && (
        <div className="space-y-6">
          <form onSubmit={handleCropSubmit} className="glass rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-gray-300 block mb-1">Soil Profile</label>
              <select
                value={cropSoil}
                onChange={(e) => setCropSoil(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['Red Clay', 'Black Cotton', 'Loamy', 'Alluvial'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Water Depth (m)</label>
              <input
                type="number"
                step="0.5"
                value={cropDepth}
                onChange={(e) => setCropDepth(parseFloat(e.target.value) || 5)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Expected Rain (mm)</label>
              <input
                type="number"
                value={cropRain}
                onChange={(e) => setCropRain(parseFloat(e.target.value) || 50)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#35C9CF] text-[#072B34] font-bold py-2.5 rounded-xl hover:bg-[#35C9CF]/90 transition"
              >
                Recommend Crops
              </button>
            </div>
          </form>

          {cropResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cropResult.recommendations.map((item, idx) => (
                <div key={idx} className="glass rounded-2xl p-5 space-y-3 text-xs border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{item.crop_name}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                      {item.suitability_score}% Match
                    </span>
                  </div>
                  <p className="text-gray-400">Expected Yield: <b className="text-white">{item.expected_yield_ton_acre} tons/acre</b></p>
                  <p className="text-gray-400">Water Intensity: <b className="text-[#35C9CF]">{item.water_intensity}</b></p>
                  <p className="text-gray-300 bg-[#072B34] p-3 rounded-xl">{item.recommendation_reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCostSubmit} className="glass rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Borewell Drilling Parameters</h3>
            <div>
              <label className="text-gray-300 block mb-1">Target Depth (Meters)</label>
              <input
                type="number"
                value={costDepth}
                onChange={(e) => setCostDepth(parseFloat(e.target.value) || 50)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Geology Sub-stratum</label>
              <select
                value={costGeo}
                onChange={(e) => setCostGeo(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['Hard Rock', 'Alluvial', 'Sedimentary'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-300 block mb-1">Casing Pipe Material</label>
              <select
                value={costCasing}
                onChange={(e) => setCostCasing(e.target.value)}
                className="w-full bg-[#072B34] border border-white/10 rounded-xl p-2.5 text-white"
              >
                {['PVC', 'Steel'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-[#35C9CF] text-[#072B34] font-bold py-3 rounded-xl hover:bg-[#35C9CF]/90 transition"
            >
              Estimate Financial Cost & Yield
            </button>
          </form>

          {costResult && (
            <div className="glass rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#35C9CF]">Borewell Cost Breakdown</h3>
              <div className="space-y-2 bg-[#072B34] p-4 rounded-xl">
                <div className="flex justify-between"><span className="text-gray-400">Drilling Cost:</span><span className="text-white font-mono">₹{costResult.estimated_drilling_cost.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Casing Pipe Cost:</span><span className="text-white font-mono">₹{costResult.casing_cost.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pump Installation:</span><span className="text-white font-mono">₹{costResult.pump_cost.toLocaleString()}</span></div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-[#35C9CF]">Total Estimated Investment:</span>
                  <span className="text-emerald-400 font-mono">₹{costResult.total_estimated_cost.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0E3A44] p-3 rounded-xl"><p className="text-gray-400">Expected Yield</p><p className="text-base font-bold text-white font-mono">{costResult.expected_yield_lph} LPH</p></div>
                <div className="bg-[#0E3A44] p-3 rounded-xl"><p className="text-gray-400">ROI Payback Period</p><p className="text-base font-bold text-emerald-400 font-mono">{costResult.roi_payback_years} Years</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
