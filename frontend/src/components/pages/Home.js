import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, BarChart, RefreshCw, TrendingDown, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const REFRESH_INTERVAL_MS = 20000;

const SkeletonCard = () => (
  <div className="bg-gray-200 p-6 rounded-lg shadow-lg animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3 mt-2"></div>
  </div>
);

const formatTs = (ts) => {
  if (!ts) return 'N/A';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString();
};

const Home = () => {
  const [marketSummary, setMarketSummary] = useState(null);
  const [sparklineMap, setSparklineMap] = useState({});
  const [alertEvents, setAlertEvents] = useState([]);
  const [monitorStatus, setMonitorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const sparklineSymbols = useMemo(
    () => (marketSummary?.most_active || []).slice(0, 8).map((s) => s.symbol),
    [marketSummary?.most_active]
  );

  const fetchMarketSummary = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const summaryRes = await API.get('/market/summary');
      setMarketSummary(summaryRes.data);
      setLastUpdated(summaryRes.data?.updated_at || new Date().toISOString());
      setError('');

      API.get('/alerts/events')
        .then((res) => setAlertEvents(res.data || []))
        .catch(() => {});

      API.get('/alerts/monitor/status')
        .then((res) => setMonitorStatus(res.data || null))
        .catch(() => {});
    } catch {
      setError('Failed to fetch market data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketSummary(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => fetchMarketSummary(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${wsProtocol}://localhost:8000/ws/market`);

    socket.onopen = () => setWsConnected(true);
    socket.onclose = () => setWsConnected(false);
    socket.onerror = () => setWsConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'market_update' && payload?.data) {
          setMarketSummary(payload.data);
          setLastUpdated(payload.timestamp || new Date().toISOString());
        }
      } catch {
        // ignore malformed packets
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    const loadSparklines = async () => {
      const symbols = sparklineSymbols;
      if (symbols.length === 0) {
        setSparklineMap({});
        return;
      }
      const responses = await Promise.allSettled(
        symbols.map((symbol) => API.get(`/market/data/${symbol}/historical`, { params: { days: 7 } }))
      );
      const next = {};
      responses.forEach((res, idx) => {
        if (res.status !== 'fulfilled') return;
        const symbol = symbols[idx];
        next[symbol] = (res.value.data?.data || []).map((p) => ({ d: p.date, c: p.close }));
      });
      setSparklineMap(next);
    };
    loadSparklines();
  }, [marketSummary?.updated_at, sparklineSymbols]);

  const chartData = useMemo(
    () =>
      marketSummary?.most_active?.map((stock) => ({
        name: stock.symbol,
        price: stock.price,
      })) || [],
    [marketSummary]
  );

  const kpis = useMemo(() => {
    const gainers = marketSummary?.gainers?.length || 0;
    const losers = marketSummary?.losers?.length || 0;
    const mostActive = marketSummary?.most_active?.length || 0;
    const universe = marketSummary?.total_symbols || 0;
    return { gainers, losers, mostActive, universe };
  }, [marketSummary]);

  const tickerCards = useMemo(() => {
    const items = marketSummary?.most_active?.slice(0, 8) || [];
    return [...items, ...items];
  }, [marketSummary]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMarketSummary(false)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
              autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Activity size={16} /> {autoRefresh ? 'Auto On' : 'Auto Off'}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="px-3 py-2 bg-white rounded-lg shadow">
          Last update: <span className="font-semibold">{formatTs(lastUpdated)}</span>
        </div>
        <div className={`px-3 py-2 rounded-lg shadow inline-flex items-center gap-2 ${wsConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {wsConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
          {wsConnected ? 'Live stream connected' : 'Live stream disconnected'}
        </div>
        {marketSummary?.providers && (
          <div className="px-3 py-2 bg-white rounded-lg shadow">
            Provider: <span className="font-semibold">{marketSummary.providers.finnhub_enabled ? 'Finnhub + yfinance fallback' : 'yfinance'}</span>
          </div>
        )}
        {monitorStatus && (
          <div className="px-3 py-2 bg-white rounded-lg shadow">
            Alert monitor: <span className="font-semibold">{monitorStatus.running ? 'Running' : 'Stopped'}</span> every {monitorStatus.interval_seconds}s
          </div>
        )}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 card-rise" style={{ animationDelay: '0ms' }}>
          <div className="text-sm text-gray-500">Universe</div>
          <div className="text-2xl font-bold">{kpis.universe}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 card-rise" style={{ animationDelay: '70ms' }}>
          <div className="text-sm text-gray-500">Advancers</div>
          <div className="text-2xl font-bold text-green-600">{kpis.gainers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 card-rise" style={{ animationDelay: '140ms' }}>
          <div className="text-sm text-gray-500">Decliners</div>
          <div className="text-2xl font-bold text-red-600">{kpis.losers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 card-rise" style={{ animationDelay: '210ms' }}>
          <div className="text-sm text-gray-500">Active Movers</div>
          <div className="text-2xl font-bold">{kpis.mostActive}</div>
        </div>
      </div>

      {!loading && tickerCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Ticker Rail</h2>
          <div className="md:hidden overflow-x-auto snap-x snap-mandatory pb-2">
            <div className="flex gap-3 w-max">
              {tickerCards.slice(0, 8).map((stock, idx) => (
                <div key={`${stock.symbol}-mobile-${idx}`} className="snap-start min-w-[220px] bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="text-sm font-semibold">{stock.symbol}</div>
                  <div className="text-lg font-bold">${stock.price}</div>
                  <div className={`text-sm font-semibold mb-2 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change}%
                  </div>
                  <div className="h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineMap[stock.symbol] || []}>
                        <Line type="monotone" dataKey="c" stroke={stock.change >= 0 ? '#16a34a' : '#dc2626'} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block ticker-wrap">
            <div className="ticker-track">
              {tickerCards.map((stock, idx) => (
                <div key={`${stock.symbol}-${idx}`} className="min-w-[220px] bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="text-sm font-semibold">{stock.symbol}</div>
                  <div className="text-lg font-bold">${stock.price}</div>
                  <div className={`text-sm font-semibold mb-2 ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change}%
                  </div>
                  <div className="h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineMap[stock.symbol] || []}>
                        <Line type="monotone" dataKey="c" stroke={stock.change >= 0 ? '#16a34a' : '#dc2626'} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/dashboard/market-pulse" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="font-semibold">Open Market Pulse</div>
          <div className="text-sm text-gray-600">Track gainers, losers and breadth.</div>
        </Link>
        <Link to="/dashboard/watchlist" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="font-semibold">Open Watchlist</div>
          <div className="text-sm text-gray-600">Monitor your selected symbols live.</div>
        </Link>
        <Link to="/dashboard/alerts" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="font-semibold">Manage Alerts</div>
          <div className="text-sm text-gray-600">Create and tune automated signals.</div>
        </Link>
      </div>

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

      <h2 className="text-3xl font-bold mb-6">Live Market Cards</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          marketSummary?.most_active?.slice(0, 8).map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200 card-rise"
              style={{ animationDelay: `${(stock.symbol.charCodeAt(0) % 6) * 60}ms` }}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold text-gray-800">{stock.symbol}</h4>
                <div className={`flex items-center text-md font-semibold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? <TrendingUp size={20} className="mr-1" /> : <TrendingDown size={20} className="mr-1" />}
                  {stock.change >= 0 ? '+' : ''}
                  {stock.change}%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">${stock.price}</div>
              <div className="text-sm text-gray-500 tracking-wide">High: ${stock.high ?? 'N/A'} | Low: ${stock.low ?? 'N/A'}</div>
              <div className="text-sm text-gray-500 tracking-wide">Volume: {(stock.volume || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-2 uppercase">Source: {stock.provider || 'unknown'}</div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4">Recent Alert Events</h3>
        {alertEvents.length === 0 ? (
          <p className="text-gray-500">No alert events yet. Create alerts to start receiving signals.</p>
        ) : (
          <div className="space-y-3">
            {alertEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="border rounded-lg p-3">
                <div className="font-semibold">
                  {event.symbol} - {event.alert_type}
                </div>
                <div className="text-sm text-gray-600">{event.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Price: ${event.current_price} - Threshold: {event.threshold} - {formatTs(event.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
