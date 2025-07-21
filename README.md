# Real-Time Financial Insights Dashboard

A real-time financial monitoring system with portfolio tracking and live market data visualizations, powered by the Finnhub API.

## 🚀 Features

- **Real-time Market Data**: Live stock prices and market updates from Finnhub.
- **Portfolio Management**: Track and analyze your investment portfolios.
- **Interactive Charts**: Clean, interactive visualizations using Recharts.
- **Secure Authentication**: JWT-based authentication for protecting user data.
- **Responsive Design**: A clean user interface that works on desktop and mobile.

## 🛠️ Tech Stack

### Frontend
- **React 18**
- **Tailwind CSS** for styling.
- **Recharts** for interactive charts and visualizations.
- **React Router** for navigation.
- **Axios** for API communication.

### Backend
- **FastAPI** (Python) for a high-performance API.
- **SQLite** for simple, file-based database storage.
- **SQLAlchemy** for database ORM.
- **Finnhub-Python** for fetching real-time market data.
- **JWT** for secure authentication.

### Deployment
- **Docker** and **Docker Compose** for easy containerization and deployment.

## 📋 Prerequisites

- **Node.js 18+**
- **Python 3.11+**
- **A free Finnhub.io API Key**

## 🚀 Getting Started (Local Development)

Follow these steps to get the application running on your local machine.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Real-Time-Financial-Insights-Dashboard
```

### 2. Set Up the Backend

#### a. Navigate to the Backend Directory
```bash
cd backend
```

#### b. Create a Virtual Environment
```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
.\venv\Scripts\activate
```

#### c. Install Dependencies
```bash
pip install -r requirements.txt
```

#### d. Create the Environment File
This is the most important step for the application to work. You need to create a `.env` file to store your API key.

1.  **Get your free API key** from [Finnhub.io](https://finnhub.io/).
2.  **Create a new file** named `.env` inside the `backend` directory.
3.  **Add your API key** to the file like this:
    ```env
    FINNHUB_API_KEY="YOUR_FINNHUB_API_KEY_HERE"
    ```
    *(Replace `YOUR_FINNHUB_API_KEY_HERE` with the key you copied from the Finnhub dashboard.)*

#### e. Run the Backend Server
```bash
uvicorn app.main:app --reload
```
The backend will now be running at `http://localhost:8000`.

### 3. Set Up the Frontend

#### a. Navigate to the Frontend Directory
Open a **new terminal window** and navigate to the frontend directory:
```bash
cd frontend
```

#### b. Install Dependencies
```bash
npm install
```

#### c. Run the Frontend Server
```bash
npm start
```
The frontend application will now be running at `http://localhost:3000`.

## 📖 API Documentation

Once the backend is running, you can explore the API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## ⚠️ Disclaimer

This application is for **educational and demonstration purposes only**. It uses real-time data but should not be used for actual financial trading or investment decisions. Always consult with qualified financial advisors before making investment decisions. 