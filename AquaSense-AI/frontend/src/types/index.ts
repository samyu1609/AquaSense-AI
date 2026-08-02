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
