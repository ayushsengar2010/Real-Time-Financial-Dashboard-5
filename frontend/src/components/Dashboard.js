import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import FloatingAIAssistant from './FloatingAIAssistant';
import API from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { logout } = useContext(AuthContext);
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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Financial Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">Home</button>
              <button className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">About Us</button>
              <button className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">Dashboard</button>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold">ayush</h2>
          </div>
          <ul>
            <li className="mb-4"><button className="hover:text-teal-400">Portfolios</button></li>
            <li className="mb-4"><button className="hover:text-teal-400">Gainers</button></li>
            <li className="mb-4"><button className="hover:text-teal-400">Most Active</button></li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {loading && <p>Loading market data...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {marketSummary && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Market Overview</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No market data is currently available. This may be due to API rate limiting.
                    </p>
                    <p className="text-gray-500">Please try again later.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stock Cards */}
                {marketSummary.most_active.slice(0, 8).map(stock => (
                  <div key={stock.symbol} className={`${stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white p-4 rounded-lg shadow-lg`}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-lg">{stock.symbol}</h4>
                      <div className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                      </div>
                    </div>
                    <div className="text-2xl font-bold">${stock.price}</div>
                    <div className="text-xs">High: ${stock.high} | Low: ${stock.low}</div>
                    <div className="text-xs">Volume: {stock.volume.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* AI Financial Assistant Placeholder - will be replaced by floating tab */}
          {/* Your Portfolios */}
          <div>
            <h3 className="text-xl font-bold mb-4">Your Portfolios</h3>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p>No portfolios yet. Create your first portfolio to get started.</p>
            </div>
          </div>
        </div>
      </div>
      <FloatingAIAssistant />
    </div>
  );
};

export default Dashboard; 