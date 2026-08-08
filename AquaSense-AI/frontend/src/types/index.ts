export interface User {
  id: int;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export type int = number;

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PredictionRequest {
  latitude: number;
  longitude: number;
  district: string;
  rainfall_mm: number;
  temperature_c: number;
  humidity_pct: number;
  previous_level: number;
  month: number;
  season: string;
}

export interface PredictionResponse {
  predicted_level_m: number;
  confidence: number;
  risk: 'Safe' | 'Moderate' | 'Critical';
  risk_colour: string;
  recommendations: string[];
  model_used: string;
}

export interface WeatherData {
  district: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  pressure: number;
  wind_speed: number;
  source: string;
}

export interface WellMarker {
  well: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  groundwater_level: number;
  risk: string;
  colour: string;
}

export interface TrendPoint {
  Date: string;
  groundwater_level: number;
  rainfall: number;
  temperature: number;
}

export interface HistoryItem {
  id: number;
  district: string;
  predicted_level: number;
  risk: string;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  total_predictions: number;
  critical_predictions: number;
  open_alerts: number;
}

export interface DailyForecastItem {
  date: string;
  day_label: string;
  groundwater_level: number;
  confidence: number;
  trend?: 'Rising' | 'Falling' | 'Stable' | string;
  risk: 'Safe' | 'Moderate' | 'Critical';
  risk_colour: string;
  recommendation: string;
  temperature: number;
  rainfall: number;
  humidity: number;
}

export interface ForecastLocation {
  district: string;
  latitude: number;
  longitude: number;
}

export interface ForecastWeather {
  temperature: number;
  humidity: number;
  rainfall: number;
  pressure: number;
  wind_speed: number;
  source: string;
}

export interface ForecastResponse {
  location: ForecastLocation;
  weather: ForecastWeather;
  today_prediction: DailyForecastItem;
  forecast: DailyForecastItem[];
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface BorewellSiteCandidate {
  lat: number;
  lng: number;
  predicted_level_m: number;
  risk: string;
  risk_colour: string;
  success_probability: number;
  recommended_depth_m: number;
  risk_score: number;
}

export interface BorewellSiteResponse {
  district: string;
  best_location: BorewellSiteCandidate;
  candidates: BorewellSiteCandidate[];
  overall_risk_score: number;
  summary: string;
}

export interface ShapFeatureAttribution {
  feature: string;
  contribution: number;
  direction: 'recharge' | 'depletion';
}

export interface ShapContributionItem {
  feature: string;
  percentage: number;
  raw_attribution?: number;
}

export interface ShapExplanationResponse {
  base_value: number;
  prediction_value: number;
  attributions: ShapFeatureAttribution[];
  feature_contributions?: ShapContributionItem[];
}

export interface IoTSensorData {
  id: number;
  device_id: string;
  district: string;
  water_level_m: number;
  temperature_c: number;
  humidity_pct: number;
  rain_gauge_mm: number;
  soil_moisture_pct: number;
  status: string;
  recorded_at: string;
}

export interface SatelliteLayer {
  id: string;
  name: string;
  unit: string;
  mean_val: number;
  interpretation: string;
  color_scale: string;
}

export interface SatelliteDataResponse {
  district: string;
  satellite_sources: string[];
  layers: SatelliteLayer[];
}

export interface SmartIrrigationResponse {
  daily_water_req_m3: number;
  water_saving_pct: number;
  recommended_timing: string;
  schedule_summary: string;
}

export interface WaterConsumptionResponse {
  required_water_m3: number;
  available_water_m3: number;
  security_days: number;
  recommendation: string;
}

export interface RainwaterHarvestingResponse {
  harvestable_water_liters: number;
  recommended_tank_size_liters: number;
  recharge_potential_liters: number;
  efficiency_score: number;
}

export interface CropRecommendationItem {
  crop_name: string;
  suitability_score: number;
  expected_yield_ton_acre: number;
  water_intensity: string;
  recommendation_reason: string;
}

export interface CropRecommendationResponse {
  recommendations: CropRecommendationItem[];
}

export interface BorewellCostResponse {
  estimated_drilling_cost: number;
  casing_cost: number;
  pump_cost: number;
  total_estimated_cost: number;
  expected_yield_lph: number;
  roi_payback_years: number;
}

export interface RechargeEstimationResponse {
  current_level_m: number;
  predicted_recharge_m: number;
  estimated_level_after_recharge_m: number;
  recharge_percentage: number;
}


