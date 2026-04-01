import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import API from '../../api';

const STORAGE_KEY = 'dashboard_watchlist_symbols';
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];

const Watchlist = () => {
  const [symbols, setSymbols] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SYMBOLS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SYMBOLS;
    } catch {
      return DEFAULT_SYMBOLS;
    }
  });
  const [rows, setRows] = useState([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const persistSymbols = (next) => {
    setSymbols(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const fetchRows = useCallback(async () => {
    if (symbols.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const responses = await Promise.allSettled(symbols.map((s) => API.get(`/market/data/${s}`)));
      const mapped = responses
        .map((res, idx) => {
          if (res.status !== 'fulfilled' || !res.value?.data) return null;
          return res.value.data;
        })
        .filter(Boolean);
      setRows(mapped);
      setError('');
    } catch {
      setError('Failed to load watchlist data.');
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchRows();
    const interval = setInterval(fetchRows, 20000);
    return () => clearInterval(interval);
  }, [fetchRows]);

  const addSymbol = (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || !/^[A-Z.]{1,10}$/.test(symbol)) {
      setError('Enter a valid symbol (A-Z, max 10 chars).');
      return;
    }
    if (symbols.includes(symbol)) {
      setError('Symbol already exists in watchlist.');
      return;
    }
    persistSymbols([symbol, ...symbols]);
    setNewSymbol('');
    setError('');
  };

  const removeSymbol = (symbol) => {
    persistSymbols(symbols.filter((s) => s !== symbol));
  };

  const marketValue = useMemo(() => rows.reduce((sum, r) => sum + (r.price || 0), 0), [rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Watchlist</h1>
        <button onClick={fetchRows} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Tracked Symbols</div>
          <div className="text-2xl font-bold">{symbols.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Combined Price Snapshot</div>
          <div className="text-2xl font-bold">${marketValue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Providers</div>
          <div className="text-lg font-semibold">Live + fallback</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow mb-6">
        <form onSubmit={addSymbol} className="flex gap-2">
          <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} placeholder="Add symbol (e.g. GOOGL)" className="border rounded px-3 py-2 flex-1" />
          <button type="submit" className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p>Loading watchlist...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">No watchlist data yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Change %</th>
                <th className="text-right px-4 py-3">Volume</th>
                <th className="text-right px-4 py-3">Source</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.symbol} className="border-t">
                  <td className="px-4 py-3 font-semibold">{row.symbol}</td>
                  <td className="px-4 py-3 text-right">${row.price}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.change >= 0 ? '+' : ''}
                    {row.change}%
                  </td>
                  <td className="px-4 py-3 text-right">{(row.volume || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right uppercase text-xs text-gray-500">{row.provider || 'unknown'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeSymbol(row.symbol)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
