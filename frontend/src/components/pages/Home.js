import React, { useState, useEffect } from 'react';
import API from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, TrendingUp, TrendingDown } from 'lucide-react';

const SkeletonCard = () => (
  <div className="bg-gray-200 p-6 rounded-lg shadow-lg animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3 mt-2"></div>
  </div>
);

const Home = () => {
  const [marketSummary, setMarketSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMarketSummary = async () => {
      try {
        setLoading(true);
        const response = await API.get('/market/summary');
        setMarketSummary(response.data);
      } catch (err) {
        setError('Failed to fetch market data.');
      }
      setLoading(false);
    };

    fetchMarketSummary();
  }, []);

  const chartData = marketSummary?.most_active.map(stock => ({
    name: stock.symbol,
    price: stock.price,
  })) || [];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <BarChart className="mr-3 text-indigo-600" /> Market Overview
        </h3>
        {loading ? (
          <div className="h-72 bg-gray-200 rounded-lg animate-pulse"></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#4f46e5" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="text-3xl font-bold mb-6">Today's Market</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          marketSummary?.most_active.slice(0, 8).map(stock => (
            <div 
              key={stock.symbol} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold text-gray-800">{stock.symbol}</h4>
                <div className={`flex items-center text-md font-semibold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? <TrendingUp size={20} className="mr-1" /> : <TrendingDown size={20} className="mr-1" />}
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">${stock.price}</div>
              <div className="text-sm text-gray-500 tracking-wide">High: ${stock.high} | Low: ${stock.low}</div>
              <div className="text-sm text-gray-500 tracking-wide">Volume: {stock.volume.toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home; 