# AquaSense AI
### AI-Based Groundwater Decision Support System

AquaSense AI predicts groundwater levels from rainfall, weather, and historical telemetry data, classifies hydrogeological risk (**Safe**, **Moderate**, **Critical**), and recommends water-management actions. Features an interactive **Leaflet GIS Map**, **Hydrogeological Analytics & Charts**, an **Admin Control Panel**, and an **Automated Early-Warning Alert System**.

---

## 🚀 Architecture Overview

AquaSense AI is built with a modern, decoupled production architecture:

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Chart.js, React-Leaflet, React Router DOM v6.
- **Backend**: FastAPI, Pydantic v2, SQLAlchemy, Passlib (bcrypt), PyJWT (HS256), Uvicorn.
- **Machine Learning**: Scikit-Learn (Random Forest, Linear Regression) & XGBoost regression models, feature scaling, label encoding, cross-validation metrics comparison.
- **Database**: PostgreSQL (Production) / SQLite with zero-config fallback.
- **Weather Telemetry**: Live OpenWeather API integration with seamless offline climatology fallback based on CGWB/IMD historical data.

---

## 📁 Repository Structure

```
AquaSense-AI/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint & CORS middleware
│   │   ├── database.py              # SQLAlchemy engine & SQLite FK pragma listener
│   │   ├── models.py                # ORM tables: Users, Groundwater, Predictions, Weather, Recommendations, Alerts, Logs
│   │   ├── schemas.py               # Pydantic v2 schemas (from_attributes=True)
│   │   ├── auth.py                  # JWT creation/verification & password hashing
│   │   ├── routers/
│   │   │   ├── auth_router.py       # POST /api/register, /api/login (OAuth2 + JSON)
│   │   │   ├── predict_router.py    # POST /api/predict
│   │   │   ├── weather_router.py    # GET  /api/weather (Live/Climatology)
│   │   │   ├── recommendation_router.py  # GET /api/recommendation
│   │   │   ├── trend_router.py      # GET  /api/trend, /api/history, /api/map
│   │   │   └── admin_router.py      # POST /api/upload, /api/retrain, GET /api/dashboard
│   │   ├── ml/
│   │   │   ├── train_model.py       # ML model training & comparison
│   │   │   ├── predict_utils.py     # Inference pipeline with confidence score
│   │   │   ├── risk.py              # Risk classification logic
│   │   │   ├── recommend.py         # Rule-based decision engine
│   │   │   ├── groundwater_model.pkl# Best model artifact
│   │   │   └── model_metrics.json   # Model evaluation scores (MAE, RMSE, R²)
│   │   └── data/
│   │       ├── generate_synthetic_data.py
│   │       └── groundwater_master.csv
│   ├── tests/
│   │   ├── test_api.py              # Pytest automated API test suite
│   │   └── __init__.py
│   ├── seed_admin.py                # Initial admin account seeder
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Backend Docker container
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Navigation header & theme switcher
│   │   │   └── Footer.tsx           # Live API health monitor
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Hydrogeological dashboard
│   │   │   ├── GISMapPage.tsx       # Interactive Leaflet map with colored well markers
│   │   │   ├── PredictPage.tsx      # ML prediction input form & output gauge
│   │   │   ├── WeatherPage.tsx      # Live/Climatology weather metrics
│   │   │   ├── TrendsPage.tsx       # Monthly groundwater level vs rainfall chart
│   │   │   └── AdminPage.tsx        # Admin CSV upload, retrain model, RBAC
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Authentication state
│   │   ├── services/
│   │   │   └── api.ts               # API client service
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx                  # React Router setup
│   │   ├── main.tsx                 # React DOM mount point
│   │   └── index.css                # Tailwind CSS & Glassmorphism styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile                   # Multi-stage frontend container
│   ├── nginx.conf                   # Nginx SPA config
│   └── vercel.json                  # Vercel deployment config
├── docker-compose.yml               # Multi-container orchestration (DB, Backend, Frontend)
├── render.yaml                      # Render Blueprint specification
└── README.md
```

---

## ⚡ Quick Start Instructions

### 1. Backend Setup

Requires Python 3.11+.

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Create default admin account (admin@aquasense.ai / ChangeMe123!)
python seed_admin.py

# Run FastAPI backend
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be available at: `http://localhost:8000/docs`.

### 2. Frontend Setup

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Running Automated Tests

To run the automated pytest suite for backend endpoints:

```bash
cd backend
pytest tests/test_api.py -v
```

---

## 🐳 Containerized & Cloud Deployment

### Docker Compose
Run the entire stack locally with PostgreSQL, FastAPI, and Nginx-served React frontend:

```bash
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### Vercel Deployment
Deploy the `frontend/` directory to Vercel. `vercel.json` handles SPA routing and API proxies automatically.

### Render / Railway Deployment
Use `render.yaml` to spin up PostgreSQL, FastAPI backend, and Vite frontend automatically on Render.
