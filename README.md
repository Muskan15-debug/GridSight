# GridSight: AI-Powered Renewable Energy Forecast & Recommendation System

## 🌍 Problem Statement

Renewable energy is clean but unpredictable. Solar and wind output shift constantly with irradiance, cloud cover, rain, time of day, season, and wind speed. This variability creates critical challenges for grid operators, utilities, and renewable plant owners.

### The Challenge Chain:
- **Weather Variability**: Constantly changing environmental conditions
- **Uncertain Generation**: Unreliable renewable output as a direct result
- **Shortfall or Excess**: Supply that doesn't match demand
- **Cost, Instability, and Waste**: Higher operational costs, greater risk, and curtailment of clean energy

### Real-World Impact:
- Unexpected shortfalls force operators to rely on backup power at higher cost
- Excess supply that exceeds storage limits leads to curtailment (clean energy generated but never used)
- Operators need more than forecasts—they need **actionable guidance**

---

## 💡 Solution: GridSight

GridSight is a comprehensive AI-powered platform that combines:
1. **Weather-based forecasting** of renewable energy generation (solar & wind)
2. **Machine learning models** trained on historical data to predict output
3. **Actionable recommendations** for grid operators and renewable plant managers
4. **Real-time dashboard** for monitoring and decision-making

---

## 📊 Project Structure

```
GridSight/
├── backend/                 # Flask-based REST API backend
│   ├── routes/
│   │   ├── auth.py         # User authentication and profile management
│   │   ├── weather.py      # Weather data endpoints
│   │   ├── forecast.py     # Forecast generation endpoints
│   │   ├── user_profile.py # User profile and geocoding
│   │   └── recommendations.py
│   ├── services/
│   │   ├── weather_client.py      # Open-Meteo weather API integration
│   │   ├── prediction_service.py   # ML model inference service
│   │   ├── recommendation_engine.py # Actionable recommendation logic
│   │   └── forecast_service.py     # Forecast orchestration
│   ├── models/
│   │   ├── xgboost_model.pkl      # Trained XGBoost model
│   │   └── model_config.json      # Model hyperparameters
│   ├── database/
│   │   └── db.py           # Database models and connections
│   ├── utils/
│   │   └── helpers.py      # Utility functions
│   ├── config.py           # Configuration management
│   ├── requirements.txt     # Python dependencies
│   └── app.py             # Flask application entry point
├── data/                   # Data management
│   ├── raw/               # Raw input data
│   ├── processed/         # Processed and transformed data
│   ├── models/            # Trained model artifacts
│   └── scripts/           # Data processing scripts
├── notebooks/             # Jupyter notebooks for analysis
└── README.md

```

---

## 🚀 Development Progress

### Branch: **shruti** (Backend & Integration)
Main backend development branch focusing on API endpoints and service integration.

#### Commits & Milestones:

1. **Step 1: Backend Skeleton** - Authentication, User Profile, Geocoding
   - User authentication system
   - User profile management
   - Location geocoding for renewable plants

2. **Step 2: Weather Integration** - Open-Meteo Client
   - Integrated Open-Meteo API for real-time weather data
   - `/weather/current` endpoint for fetching current weather conditions
   - Support for location-based weather queries

3. **Step 3: Prediction Service**
   - Model stub implementation
   - Prediction service for ML model inference
   - `run_forecast_for_user()` orchestration function

4. **Step 4: Forecast Endpoints & Scheduling**
   - Complete forecast API endpoints
   - 12-hour cron job for automatic forecast generation
   - Demand/storage PUT endpoints that trigger forecast recomputation

5. **Step 5: Recommendation Engine Integration**
   - Wired recommendation engine into `run_forecast_for_user()`
   - Generates actionable recommendations based on forecasts
   - Fixed: Demand/storage PUT now recomputes recommendations only (no re-predict)

---

### Branch: **Het-ML** (Machine Learning Model Development)
Dedicated ML development branch focused on model training and optimization.

#### Commits & Milestones:

1. **Folder Structure & Basic Files**
   - Initialized project folder structure
   - Created foundational configuration files

2. **Data Ingestion**
   - Implemented data loading pipeline
   - Integration with renewable energy and weather datasets
   - Data validation and schema enforcement

3. **Data Validation & Transformation**
   - Data quality checks and anomaly detection
   - Feature engineering and data normalization
   - Time-series data preparation for model training

4. **Model Training & Evaluation**
   - Trained XGBoost model on historical renewable generation data
   - Model evaluation using appropriate metrics:
     - Mean Absolute Error (MAE)
     - Root Mean Squared Error (RMSE)
     - R² Score
   - Cross-validation and train/test split analysis

5. **Hyperparameter Tuning**
   - Grid search and Bayesian optimization for XGBoost
   - Fine-tuned model parameters for optimal performance
   - Model serialization for production deployment

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **API**: RESTful with JSON
- **Authentication**: JWT/Session-based
- **Database**: (TBD - Schema in development)
- **Async Jobs**: APScheduler for 12-hour forecasting cron

### Machine Learning
- **Language**: Python
- **Libraries**:
  - `XGBoost` - Gradient boosting for time-series forecasting
  - `Pandas` - Data manipulation and preprocessing
  - `NumPy` - Numerical computations
  - `Scikit-learn` - Model evaluation and metrics
  - `matplotlib/seaborn` - Data visualization

### Data Sources
- **Weather Data**: Open-Meteo API (free, real-time)
- **Renewable Generation Data**: NRDB
- **Demand Data**: Grid operator inputs

---

## 📈 Key Features

### Current Implementation

#### ✅ Weather Integration
- Real-time weather data retrieval via Open-Meteo
- Location-based queries for renewable plant sites
- Support for multiple weather parameters (cloud cover, wind speed, irradiance)

#### ✅ ML Model
- XGBoost regression model trained on historical data
- Hyperparameter-tuned for renewable generation forecasting
- Data pipeline: ingestion → validation → transformation → training → evaluation

#### ✅ Forecast Service
- Automated 12-hour periodic forecasts
- User-specific forecast generation
- Integration with recommendation engine

#### ✅ Recommendation Engine
- Generates actionable recommendations based on forecast
- Considers demand and storage constraints
- Recommends actions for grid operators (e.g., "Increase backup capacity", "Optimize dispatch timing")

#### 🔄 API Endpoints (Backend)
- `POST /auth/login` - User authentication
- `GET/POST /user/profile` - User profile management
- `GET /weather/current` - Current weather data
- `POST /forecast/run` - Generate forecast for user
- `GET /forecast/<user_id>` - Retrieve user forecasts
- `PUT /demand` - Update demand, triggers recommendation recompute
- `PUT /storage` - Update storage, triggers recommendation recompute

---

## 🎯 Next Steps / Roadmap

1. **Database Integration**
   - Complete database schema design
   - User session management persistence
   - Forecast history storage

2. **Frontend Development**
   - React/Vue dashboard for visualization
   - Real-time forecast charts
   - Recommendation alerts and notifications

4. **Production Deployment**
   - Docker containerization
   - Kubernetes orchestration
   - Monitoring and logging (ELK stack)
   - CI/CD pipeline

5. **Advanced Features**
   - Multi-horizon forecasting (24h, 7d, 30d)
   - Anomaly detection in generation patterns
   - What-if scenario analysis
   - Integration with SCADA systems

---

## 📊 Model Performance

### XGBoost Model Metrics
- **Mean Absolute Error (MAE)**: ~0.6830 kW   
- **RMSE**: ~1.3952kW
- **R² Score**: ~1.0000

---

## 🤝 Team

- **Shruti Patel** (@ShrutiPatel038) - Backend Development & API Integration
- **Het** (@hetrank) - Machine Learning & Model Development
- **Muskan** (@Muskan15-debug) - Project Lead, Frontend and Service Integration
- **Mitali Radia** (@mitaliradia) - Backend Developement and Service Integration

---

## 📝 Development Notes

### Important Design Decisions:

1. **Recommendation-Only Updates**: When demand or storage is updated via PUT endpoints, the system only recomputes recommendations based on existing forecasts—no full re-prediction occurs to avoid unnecessary computation.

2. **Automated Forecasting**: 12-hour cron jobs ensure forecasts are continuously refreshed without manual intervention.

3. **Separation of Concerns**: 
   - `Het-ML` branch: Pure ML model development (training, evaluation, hyperparameter tuning)
   - `shruti` branch: Production API and service integration

---

## 🔒 Security Considerations

- Authentication required for all endpoints
- User data isolation (forecasts visible only to authorized users)
- API rate limiting to prevent abuse
- Input validation on all endpoints

---

## 📚 References & Resources

- **Open-Meteo API**: https://open-meteo.com/
- **XGBoost Documentation**: https://xgboost.readthedocs.io/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Time Series Forecasting Best Practices**: https://otexts.com/fpp2/

---

**Last Updated**: September 12, 2026

---

## Getting Started (Future Setup Instructions)

```bash
# Clone the repository
git clone https://github.com/Muskan15-debug/GridSight.git
cd GridSight

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the Flask app
python backend/app.py
```

---

**GridSight**: Powering the renewable energy grid with AI-driven forecasting and actionable intelligence.
