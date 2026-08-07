import { PredictionRequest, PredictionResponse } from '../types';

/**
 * Pure client-side browser hydrological prediction engine.
 * Runs locally without internet connectivity or backend server dependency.
 */
export function predictOffline(req: PredictionRequest): PredictionResponse {
  const { rainfall_mm, temperature_c, previous_level, season } = req;

  const seasonalMult = season === 'Monsoon' || season === 'Post-Monsoon' ? 0.85 : 1.15;
  const calcLevel = previous_level * 0.75 - rainfall_mm * 0.015 + temperature_c * 0.04 * seasonalMult;
  const predicted_level_m = Number(Math.max(0.3, calcLevel).toFixed(2));

  let risk: 'Safe' | 'Moderate' | 'Critical' = 'Safe';
  let risk_colour = '#10B981';

  if (predicted_level_m < 5.0) {
    risk = 'Critical';
    risk_colour = '#EF4444';
  } else if (predicted_level_m < 10.0) {
    risk = 'Moderate';
    risk_colour = '#F59E0B';
  }

  const recommendations = [
    'Offline Inference Mode: Micro-irrigation recommended.',
    risk === 'Critical'
      ? 'Restrict heavy extraction immediately.'
      : 'Maintain standard recharge protocols.',
  ];

  return {
    predicted_level_m,
    confidence: 0.85,
    risk,
    risk_colour,
    recommendations,
    model_used: 'Browser Client Offline Engine',
  };
}
