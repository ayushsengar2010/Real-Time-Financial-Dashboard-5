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
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
