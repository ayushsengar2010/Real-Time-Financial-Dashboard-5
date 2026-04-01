import React, { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import API from '../../api';

const MarketPulse = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await API.get('/market/summary');
      setSummary(data);
      setError('');
    } catch {
      setError('Failed to load market pulse.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(true);
    const interval = setInterval(() => fetchSummary(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const breadth = useMemo(() => {
    const gainers = summary?.gainers?.length || 0;
    const losers = summary?.losers?.length || 0;
    const total = gainers + losers;
    return {
      gainers,
      losers,
      total,
      ratio: total > 0 ? ((gainers / total) * 100).toFixed(1) : '0.0',
    };
  }, [summary]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Market Pulse</h1>
        <button onClick={() => fetchSummary(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Tracked Universe</div>
          <div className="text-2xl font-bold">{summary?.total_symbols || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Advancers</div>
          <div className="text-2xl font-bold text-green-600">{breadth.gainers}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Decliners</div>
          <div className="text-2xl font-bold text-red-600">{breadth.losers}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Breadth Ratio</div>
          <div className="text-2xl font-bold">{breadth.ratio}%</div>
        </div>
      </div>

      {loading ? (
        <p>Loading market pulse...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
              <TrendingUp className="text-green-600" size={18} /> Top Gainers
            </h2>
            <div className="space-y-2">
              {(summary?.gainers || []).slice(0, 8).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm">${stock.price}</div>
                  <div className="text-green-600 font-semibold">+{stock.change}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
              <TrendingDown className="text-red-600" size={18} /> Top Losers
            </h2>
            <div className="space-y-2">
              {(summary?.losers || []).slice(0, 8).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm">${stock.price}</div>
                  <div className="text-red-600 font-semibold">{stock.change}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-5 mt-6">
        <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
          <Activity size={18} className="text-indigo-600" /> Most Active by Volume
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(summary?.most_active || []).map((stock) => (
            <div key={stock.symbol} className="border rounded p-3">
              <div className="font-semibold mb-1">{stock.symbol}</div>
              <div className="text-sm text-gray-600">Price: ${stock.price}</div>
              <div className="text-sm text-gray-600">Volume: {(stock.volume || 0).toLocaleString()}</div>
              <div className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.change >= 0 ? '+' : ''}
                {stock.change}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
