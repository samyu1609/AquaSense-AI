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
