import {
  PredictionRequest,
  PredictionResponse,
  ShapExplanationResponse,
  ForecastResponse,
  RechargeEstimationResponse,
} from '../types';

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

  if (predicted_level_m > 12.0) {
    risk = 'Critical';
    risk_colour = '#EF4444';
  } else if (predicted_level_m > 8.0) {
    risk = 'Moderate';
    risk_colour = '#F59E0B';
  }

  const recommendations = [
    'Offline Inference Mode: Micro-irrigation recommended.',
    risk === 'Critical'
      ? 'Restrict heavy groundwater extraction immediately.'
      : 'Maintain standard recharge protocols.',
  ];

  return {
    predicted_level_m,
    confidence: 0.95,
    risk,
    risk_colour,
    recommendations,
    model_used: 'Browser Client Offline Engine',
  };
}

export function explainOffline(req: PredictionRequest, predictedLevel: number): ShapExplanationResponse {
  return {
    base_value: 8.0,
    prediction_value: predictedLevel,
    attributions: [
      { feature: 'Rainfall (mm)', contribution: -0.32, direction: 'recharge' },
      { feature: 'Temperature (°C)', contribution: 0.18, direction: 'depletion' },
      { feature: 'Humidity (%)', contribution: -0.11, direction: 'recharge' },
      { feature: 'Location', contribution: 0.39, direction: 'depletion' },
    ],
    feature_contributions: [
      { feature: 'Rainfall', percentage: 32 },
      { feature: 'Temperature', percentage: 18 },
      { feature: 'Humidity', percentage: 11 },
      { feature: 'Location', percentage: 39 },
    ],
  };
}

export function estimateRechargeOffline(currentLevel: number, rainfallMm: number): RechargeEstimationResponse {
  const predictedRecharge = Number(((rainfallMm * 0.15) / 100).toFixed(2));
  const estimatedLevelAfterRecharge = Number(Math.max(0.1, currentLevel - predictedRecharge).toFixed(2));
  const rechargePct = currentLevel > 0 ? Number(((predictedRecharge / currentLevel) * 100).toFixed(1)) : 0;

  return {
    current_level_m: currentLevel,
    predicted_recharge_m: predictedRecharge,
    estimated_level_after_recharge_m: estimatedLevelAfterRecharge,
    recharge_percentage: rechargePct,
  };
}

export function forecastOffline(req: PredictionRequest): ForecastResponse {
  const today = new Date();
  const forecastList = [];
  let currLvl = req.previous_level;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i + 1}`;

    const stepRain = Math.max(0, req.rainfall_mm + (i % 2 === 0 ? 5 : -3));
    const stepTemp = req.temperature_c + (i % 3 === 0 ? 0.5 : -0.2);

    const stepPred = predictOffline({
      ...req,
      rainfall_mm: stepRain,
      temperature_c: stepTemp,
      previous_level: currLvl,
    });

    const diff = stepPred.predicted_level_m - currLvl;
    const trend = diff < -0.05 ? 'Rising' : diff > 0.05 ? 'Falling' : 'Stable';

    forecastList.push({
      date: dateStr,
      day_label: dayLabel,
      groundwater_level: stepPred.predicted_level_m,
      confidence: Math.max(0.7, Number((stepPred.confidence - i * 0.02).toFixed(2))),
      trend,
      risk: stepPred.risk,
      risk_colour: stepPred.risk_colour,
      recommendation: stepPred.recommendations[0],
      temperature: Number(stepTemp.toFixed(1)),
      rainfall: Number(stepRain.toFixed(1)),
      humidity: req.humidity_pct,
    });

    currLvl = stepPred.predicted_level_m;
  }

  return {
    location: { district: req.district, latitude: req.latitude, longitude: req.longitude },
    weather: {
      temperature: req.temperature_c,
      humidity: req.humidity_pct,
      rainfall: req.rainfall_mm,
      pressure: 1012,
      wind_speed: 3.5,
      source: 'Offline Local Telemetry',
    },
    today_prediction: forecastList[0],
    forecast: forecastList,
  };
}
