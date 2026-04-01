import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import API from '../../api';

const NewsSentiment = () => {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const params = query.trim() ? { symbols: query.trim() } : {};
      const res = await API.get('/market/news', { params });
      setData(res.data);
      setError('');
    } catch {
      setError('Failed to load market news.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const sentimentClass = useMemo(() => {
    const s = data?.overall_sentiment;
    if (s === 'positive') return 'text-green-600 bg-green-50';
    if (s === 'negative') return 'text-red-600 bg-red-50';
    return 'text-gray-700 bg-gray-100';
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">News + Sentiment</h1>
        <button onClick={() => load(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Symbols (comma separated, e.g. AAPL,MSFT)"
            className="border rounded px-3 py-2 min-w-[320px]"
          />
          <button onClick={() => load(false)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Apply
          </button>
        </div>
        <div className={`px-3 py-2 rounded font-semibold ${sentimentClass}`}>
          Overall: {(data?.overall_sentiment || 'neutral').toUpperCase()} (score {data?.overall_score ?? 0})
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading news...</p>
      ) : (
        <div className="space-y-3">
          {(data?.items || []).map((item, idx) => (
            <a key={`${item.symbol}-${idx}`} href={item.link} target="_blank" rel="noreferrer" className="block bg-white rounded-lg shadow p-4 hover:shadow-md">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="font-semibold">{item.symbol}</div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.sentiment === 'positive'
                      ? 'bg-green-100 text-green-700'
                      : item.sentiment === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.sentiment}
                </span>
              </div>
              <div className="text-gray-900 font-medium">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {item.publisher} | {item.published_at ? new Date(item.published_at).toLocaleString() : 'Unknown time'}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSentiment;
