import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import API from '../../api';

const DAYS = 30;

const Performance = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/portfolios');
      const list = res.data || [];
      setPortfolios(list);
      if (!selectedPortfolioId && list.length > 0) {
        setSelectedPortfolioId(String(list[0].id));
      }
      setError('');
    } catch {
      setError('Failed to load portfolios.');
    } finally {
      setLoading(false);
    }
  }, [selectedPortfolioId]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    const run = async () => {
      if (!selectedPortfolioId) return;
      try {
        setLoading(true);
        const holdingsRes = await API.get(`/portfolios/${selectedPortfolioId}/holdings`);
        const holdings = holdingsRes.data || [];
        if (holdings.length === 0) {
          setSeries([]);
          setLoading(false);
          return;
        }

        const histResponses = await Promise.allSettled(
          holdings.map((h) => API.get(`/market/data/${h.symbol}/historical`, { params: { days: DAYS } }))
        );

        const valid = histResponses
          .map((r, idx) => {
            if (r.status !== 'fulfilled') return null;
            const h = holdings[idx];
            const points = r.value.data?.data || [];
            return {
              symbol: h.symbol,
              qty: Number(h.quantity),
              avg: Number(h.average_price),
              points,
            };
          })
          .filter(Boolean);

        const byDate = {};
        valid.forEach((asset) => {
          asset.points.forEach((p) => {
            const d = p.date;
            if (!byDate[d]) byDate[d] = { date: d, value: 0, cost: 0 };
            byDate[d].value += Number(p.close || 0) * asset.qty;
            byDate[d].cost += asset.avg * asset.qty;
          });
        });

        const rows = Object.values(byDate)
          .sort((a, b) => (a.date > b.date ? 1 : -1))
          .map((r) => ({
            date: r.date,
            value: Number(r.value.toFixed(2)),
            pnl: Number((r.value - r.cost).toFixed(2)),
          }));

        setSeries(rows);
        setError('');
      } catch {
        setError('Failed to build performance series.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedPortfolioId]);

  const latest = useMemo(() => {
    if (!series.length) return null;
    return series[series.length - 1];
  }, [series]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Portfolio Performance</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Portfolio</label>
          <select
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Current Value</div>
          <div className="text-2xl font-bold">{latest ? `$${latest.value.toLocaleString()}` : '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">PnL (30D proxy)</div>
          <div className={`text-2xl font-bold ${latest?.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {latest ? `${latest.pnl >= 0 ? '+' : ''}$${latest.pnl.toLocaleString()}` : '-'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Data Points</div>
          <div className="text-2xl font-bold">{series.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        {loading ? (
          <p>Loading performance chart...</p>
        ) : series.length === 0 ? (
          <p className="text-gray-500">No holdings or historical data available for this portfolio.</p>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Value" />
              <Line type="monotone" dataKey="pnl" stroke="#059669" strokeWidth={2} dot={false} name="PnL" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Performance;
