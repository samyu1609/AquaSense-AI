import React from 'react';
import { Droplet, ArrowDownRight, Layers, Percent, Sparkles } from 'lucide-react';
import { RechargeEstimationResponse } from '../types';

interface RechargeEstimationCardProps {
  rechargeData: RechargeEstimationResponse | null;
  loading?: boolean;
}

export const RechargeEstimationCard: React.FC<RechargeEstimationCardProps> = ({
  rechargeData,
  loading,
}) => {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center text-sm text-[#EAF6F4]/60">
        <Sparkles className="w-5 h-5 animate-spin text-[#35C9CF] mr-2" />
        Calculating Groundwater Recharge Estimation...
      </div>
    );
  }

  if (!rechargeData) return null;

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#35C9CF]/15 rounded-xl border border-[#35C9CF]/30 text-[#35C9CF]">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Groundwater Recharge Estimation</h3>
            <p className="text-xs text-[#EAF6F4]/70">
              Estimated water table recovery and aquifer recharge potential based on anticipated rainfall.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#35C9CF]/20 text-[#35C9CF] border border-[#35C9CF]/40">
          Hydrological RIF Model
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Level */}
        <div className="bg-[#0E3A44]/60 border border-white/10 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Current Level</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {rechargeData.current_level_m.toFixed(2)} <span className="text-sm font-normal text-gray-300">m</span>
          </p>
          <p className="text-[11px] text-gray-400">Initial depth before rainfall</p>
        </div>

        {/* Card 2: Predicted Recharge */}
        <div className="bg-[#0E3A44]/60 border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Predicted Recharge</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            +{rechargeData.predicted_recharge_m.toFixed(2)} <span className="text-sm font-normal text-emerald-300">m</span>
          </p>
          <p className="text-[11px] text-emerald-300/80">Water table depth reduction</p>
        </div>

        {/* Card 3: Estimated Level After Recharge */}
        <div className="bg-[#0E3A44]/60 border border-white/10 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Estimated Level After Recharge</span>
            <Droplet className="w-4 h-4 text-[#35C9CF]" />
          </div>
          <p className="text-2xl font-bold text-[#35C9CF]">
            {rechargeData.estimated_level_after_recharge_m.toFixed(2)} <span className="text-sm font-normal text-gray-300">m</span>
          </p>
          <p className="text-[11px] text-gray-400">Recovered depth after absorption</p>
        </div>

        {/* Card 4: Recharge Percentage */}
        <div className="bg-[#0E3A44]/60 border border-teal-500/30 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-teal-400 font-medium">
            <span>Recharge Percentage</span>
            <Percent className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-300">
            {rechargeData.recharge_percentage}%
          </p>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, rechargeData.recharge_percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
