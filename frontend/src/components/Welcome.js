import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
  return (
    <div className="min-h-screen welcome-bg text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white text-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#00529B' }}>
          Welcome to the Real-Time Financial Insights Dashboard
        </h1>
        <p className="text-lg mb-8 text-gray-600">
          Track your portfolio, get AI-powered insights, and monitor the markets in real time.
        </p>
        <Link
          to="/register"
          className="text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          style={{ backgroundColor: '#007BFF' }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Welcome; 