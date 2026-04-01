import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api';
import { Bell, Search } from 'lucide-react';

const MostActive = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');

  const createPriceAlert = async (symbol, alertType) => {
    const raw = window.prompt(`Set threshold for ${symbol} (${alertType}):`);
    if (!raw) return;
    const threshold = Number(raw);
    if (Number.isNaN(threshold) || threshold <= 0) {
      setNotice('Invalid threshold value.');
      return;
    }
    try {
      await API.post('/alerts', { symbol, alert_type: alertType, threshold });
      setNotice(`Alert created for ${symbol}: ${alertType} ${threshold}`);
    } catch {
      setNotice('Failed to create alert.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/market/summary');
        setSummary(data);
        setError('');
      } catch {
        setError('Failed to load most active stocks.');
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 25000);
    return () => clearInterval(interval);
  }, []);

  const rows = useMemo(() => {
    const base = summary?.most_active || [];
    if (!query.trim()) return base;
    return base.filter((s) => s.symbol.toLowerCase().includes(query.toLowerCase()));
  }, [summary, query]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Most Active Stocks</h1>
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter symbol..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {loading && <p>Loading market activity...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {notice && <p className="text-sm text-indigo-700 mb-3">{notice}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Change %</th>
                <th className="text-right px-4 py-3">Volume</th>
                <th className="text-right px-4 py-3">High</th>
                <th className="text-right px-4 py-3">Low</th>
                <th className="text-right px-4 py-3">Source</th>
                <th className="text-right px-4 py-3">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((stock) => (
                <tr key={stock.symbol} className="border-t">
                  <td className="px-4 py-3 font-semibold">{stock.symbol}</td>
                  <td className="px-4 py-3 text-right">${stock.price}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change}%
                  </td>
                  <td className="px-4 py-3 text-right">{(stock.volume || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${stock.high ?? 'N/A'}</td>
                  <td className="px-4 py-3 text-right">${stock.low ?? 'N/A'}</td>
                  <td className="px-4 py-3 text-right uppercase text-xs text-gray-500">{stock.provider || 'unknown'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => createPriceAlert(stock.symbol, 'price_above')}
                        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded"
                        title="Alert when price goes above threshold"
                      >
                        <Bell size={12} className="inline mr-1" /> Above
                      </button>
                      <button
                        onClick={() => createPriceAlert(stock.symbol, 'price_below')}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                        title="Alert when price goes below threshold"
                      >
                        <Bell size={12} className="inline mr-1" /> Below
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="p-6 text-center text-gray-500">No symbols matched your filter.</div>}
        </div>
      )}
    </div>
  );
};

export default MostActive;
