import React from 'react';
import { ShapExplanationResponse } from '../types';
import { HelpCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface ShapExplanationCardProps {
  shapData: ShapExplanationResponse | null;
  loading?: boolean;
}

export const ShapExplanationCard: React.FC<ShapExplanationCardProps> = ({ shapData, loading }) => {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center text-sm text-[#EAF6F4]/60">
        <Activity className="w-5 h-5 animate-spin text-[#35C9CF] mr-2" />
        Computing SHAP Shapley feature attributions...
      </div>
    );
  }

  if (!shapData) return null;

  const maxAbsContrib = Math.max(...shapData.attributions.map((a) => Math.abs(a.contribution)), 0.1);

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#35C9CF]" />
          <h3 className="text-lg font-bold text-white">Explainable AI (SHAP Feature Attributions)</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#35C9CF]/20 text-[#35C9CF] font-medium flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> SHAP TreeExplainer
        </span>
      </div>

      <p className="text-xs text-[#EAF6F4]/70">
        Base regional groundwater depth: <span className="font-semibold text-white">{shapData.base_value}m</span>. 
        Predicted final level: <span className="font-semibold text-[#35C9CF]">{shapData.prediction_value}m</span>.
      </p>

      <div className="space-y-3">
        {shapData.attributions.map((attr, idx) => {
          const isRecharge = attr.direction === 'recharge';
          const pct = Math.min(100, Math.round((Math.abs(attr.contribution) / maxAbsContrib) * 100));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-200 flex items-center gap-1">
                  {isRecharge ? (
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  {attr.feature}
                </span>
                <span className={isRecharge ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                  {attr.contribution > 0 ? `+${attr.contribution}` : attr.contribution} m ({isRecharge ? 'Recharge' : 'Depletion'})
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isRecharge ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
