import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import API from '../../api';

const heatColor = (change) => {
  if (change >= 2) return 'bg-green-600 text-white';
  if (change > 0) return 'bg-green-200 text-green-900';
  if (change <= -2) return 'bg-red-600 text-white';
  if (change < 0) return 'bg-red-200 text-red-900';
  return 'bg-gray-200 text-gray-800';
};

const SectorHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await API.get('/market/heatmap');
      setData(res.data);
      setError('');
    } catch {
      setError('Failed to load sector heatmap.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Sector Heatmap</h1>
        <button onClick={() => load(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading heatmap...</p>
      ) : (
        <div className="space-y-6">
          {(data?.sectors || []).map((sector) => (
            <div key={sector.sector} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">{sector.sector}</h2>
                <span className={`px-2 py-1 rounded text-sm font-semibold ${heatColor(sector.avg_change)}`}>
                  {sector.avg_change > 0 ? '+' : ''}
                  {sector.avg_change}%
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sector.stocks.map((stock) => (
                  <div key={stock.symbol} className={`rounded-lg p-3 ${heatColor(stock.change)}`}>
                    <div className="font-semibold">{stock.symbol}</div>
                    <div className="text-sm">${stock.price}</div>
                    <div className="text-sm font-semibold">
                      {stock.change > 0 ? '+' : ''}
                      {stock.change}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectorHeatmap;
