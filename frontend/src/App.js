import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/DashboardLayout';
import Home from './components/pages/Home';
import Portfolios from './components/pages/Portfolios';
import Learn from './components/pages/Learn';
import MostActive from './components/pages/MostActive';
import Alerts from './components/pages/Alerts';
import Watchlist from './components/pages/Watchlist';
import MarketPulse from './components/pages/MarketPulse';
import SectorHeatmap from './components/pages/SectorHeatmap';
import NewsSentiment from './components/pages/NewsSentiment';
import Performance from './components/pages/Performance';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="portfolios" element={<Portfolios />} />
            <Route path="learn" element={<Learn />} />
            <Route path="most-active" element={<MostActive />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="market-pulse" element={<MarketPulse />} />
            <Route path="sector-heatmap" element={<SectorHeatmap />} />
            <Route path="news-sentiment" element={<NewsSentiment />} />
            <Route path="performance" element={<Performance />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
