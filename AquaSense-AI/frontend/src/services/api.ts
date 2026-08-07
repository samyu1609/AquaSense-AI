import {
  AdminDashboardStats,
  HistoryItem,
  PredictionRequest,
  PredictionResponse,
  TokenResponse,
  TrendPoint,
  User,
  WeatherData,
  WellMarker,
} from '../types';

const getApiBaseUrl = (): string => {
  const envUrl =
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE as string);

  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim().replace(/\/+$/, '');
    if (url.startsWith('http') && !url.endsWith('/api')) {
      url += '/api';
    }
    return url;
  }

  // When deployed in production (e.g. Vercel), route directly to Render backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://aquasense-ai-1-7kox.onrender.com/api';
  }

  return '/api';
};

const API_BASE = getApiBaseUrl();

export const getAuthToken = (): string | null => {
  return localStorage.getItem('aquasense_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('aquasense_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('aquasense_token');
};

const getHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const auth = token !== undefined ? token : getAuthToken();
  if (auth) {
    headers['Authorization'] = `Bearer ${auth}`;
  }
  return headers;
};

export async function fetchWeather(district: string, lat?: number, lon?: number): Promise<WeatherData> {
  let url = `${API_BASE}/weather?district=${encodeURIComponent(district)}`;
  if (lat !== undefined && lon !== undefined) {
    url += `&lat=${lat}&lon=${lon}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
  return res.json();
}

export async function postPrediction(data: PredictionRequest): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.statusText}`);
  return res.json();
}

export async function fetchForecast(
  district: string,
  lat?: number,
  lon?: number,
  previousLevel?: number,
  season?: string
): Promise<import('../types').ForecastResponse> {
  let url = `${API_BASE}/prediction/forecast?district=${encodeURIComponent(district)}`;
  if (lat !== undefined && lon !== undefined) {
    url += `&lat=${lat}&lon=${lon}`;
  }
  if (previousLevel !== undefined) {
    url += `&previous_level=${previousLevel}`;
  }
  if (season !== undefined) {
    url += `&season=${encodeURIComponent(season)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast fetch failed: ${res.statusText}`);
  return res.json();
}


export async function fetchMapData(): Promise<{ wells: WellMarker[] }> {
  const res = await fetch(`${API_BASE}/map`);
  if (!res.ok) throw new Error(`Map data fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTrend(district: string): Promise<{ district: string; monthly_trend: TrendPoint[] }> {
  const res = await fetch(`${API_BASE}/trend?district=${encodeURIComponent(district)}`);
  if (!res.ok) throw new Error(`Trend fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(limit: number = 20): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchRecommendations(risk: string): Promise<{ risk: string; recommendations: string[] }> {
  const res = await fetch(`${API_BASE}/recommendation?risk=${encodeURIComponent(risk)}`);
  if (!res.ok) throw new Error(`Recommendations fetch failed: ${res.statusText}`);
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail = errorData.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
        : 'Login failed — check your credentials';
    throw new Error(message);
  }
  return res.json();
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail = errorData.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
        : 'Registration failed';
    throw new Error(message);
  }
  return res.json();
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Unauthorized or dashboard load failed');
  return res.json();
}

export async function fetchAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch user list');
  return res.json();
}

export async function uploadDatasetCSV(file: File): Promise<{ message: string; total_rows: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'CSV upload failed');
  }
  return res.json();
}

export async function retrainModel(): Promise<{ message: string; log: string }> {
  const res = await fetch(`${API_BASE}/retrain`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Model retraining failed');
  }
  return res.json();
}

export async function deletePrediction(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/predictions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Delete prediction failed');
  return res.json();
}

// --- New AquaSense AI API Endpoints ---

export async function fetchBorewellRecommendations(
  district: string,
  boundaryPoints: import('../types').LatLngPoint[]
): Promise<import('../types').BorewellSiteResponse> {
  const res = await fetch(`${API_BASE}/borewell/recommend`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ district, boundary_points: boundaryPoints, grid_density: 5 }),
  });
  if (!res.ok) throw new Error('Borewell site recommendation failed');
  return res.json();
}

export async function fetchSatelliteLayers(district: string): Promise<import('../types').SatelliteDataResponse> {
  const res = await fetch(`${API_BASE}/satellite/layers?district=${encodeURIComponent(district)}`);
  if (!res.ok) throw new Error('Satellite layers fetch failed');
  return res.json();
}

export async function fetchShapExplanations(data: PredictionRequest): Promise<import('../types').ShapExplanationResponse> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('SHAP explanation fetch failed');
  return res.json();
}

export async function fetchLiveIoTSensors(district: string): Promise<import('../types').IoTSensorData[]> {
  const res = await fetch(`${API_BASE}/iot/live?district=${encodeURIComponent(district)}`);
  if (!res.ok) throw new Error('IoT live sensors fetch failed');
  return res.json();
}

export async function fetchExtendedForecast(district: string, previousLevel?: number): Promise<any> {
  let url = `${API_BASE}/forecast/extended?district=${encodeURIComponent(district)}`;
  if (previousLevel !== undefined) url += `&previous_level=${previousLevel}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Extended forecast fetch failed');
  return res.json();
}

export async function postSmartIrrigation(data: { crop: string; land_area_acres: number; soil_type: string; current_water_table_m: number }): Promise<import('../types').SmartIrrigationResponse> {
  const res = await fetch(`${API_BASE}/calculators/irrigation`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Smart irrigation calculation failed');
  return res.json();
}

export async function postWaterConsumption(data: { crop: string; land_area_acres: number; water_source: string; current_water_table_m: number }): Promise<import('../types').WaterConsumptionResponse> {
  const res = await fetch(`${API_BASE}/calculators/consumption`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Water consumption calculation failed');
  return res.json();
}

export async function postRainwaterHarvesting(data: { roof_area_sqm: number; annual_rainfall_mm: number }): Promise<import('../types').RainwaterHarvestingResponse> {
  const res = await fetch(`${API_BASE}/calculators/rainwater`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Rainwater harvesting calculation failed');
  return res.json();
}

export async function postCropRecommendations(data: { district: string; groundwater_level_m: number; rainfall_mm: number; temperature_c: number; soil_type: string }): Promise<import('../types').CropRecommendationResponse> {
  const res = await fetch(`${API_BASE}/crops/recommend`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Crop recommendations fetch failed');
  return res.json();
}

export async function postBorewellCost(data: { target_depth_m: number; geology_type: string; casing_type: string }): Promise<import('../types').BorewellCostResponse> {
  const res = await fetch(`${API_BASE}/calculators/borewell-cost`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Borewell cost estimation failed');
  return res.json();
}

export async function dispatchMultiChannelAlert(data: { district: string; message: string; channels: string[]; level: string }): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/alerts/dispatch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Alert dispatch failed');
  return res.json();
}

