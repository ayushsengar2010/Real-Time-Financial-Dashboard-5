import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Pencil, Play, Save, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import API from '../../api';

const ALERT_TYPES = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'percentage_change', label: 'Percentage Change' },
];

const ALERTS_PAGE_SIZE = 8;
const EVENTS_PAGE_SIZE = 8;

const emptyForm = {
  symbol: '',
  alert_type: 'price_above',
  threshold: '',
};

const normalizeSymbol = (value) => value.trim().toUpperCase();

const validateAlertInput = ({ symbol, alert_type, threshold }) => {
  const cleanedSymbol = normalizeSymbol(symbol);
  if (!cleanedSymbol || !/^[A-Z.]{1,10}$/.test(cleanedSymbol)) {
    return 'Symbol should be 1-10 chars using A-Z or "."';
  }

  const t = Number(threshold);
  if (Number.isNaN(t) || t <= 0) {
    return 'Threshold must be a positive number.';
  }

  if (alert_type === 'percentage_change' && t > 100) {
    return 'Percentage Change threshold should be between 0 and 100.';
  }
  return '';
};

const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center justify-end gap-2 mt-3">
    <button disabled={page <= 1} onClick={onPrev} className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-40">
      Prev
    </button>
    <span className="text-sm text-gray-600">
      Page {page} / {Math.max(totalPages, 1)}
    </span>
    <button disabled={page >= totalPages} onClick={onNext} className="px-3 py-1 text-sm rounded bg-gray-100 disabled:opacity-40">
      Next
    </button>
  </div>
);

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [monitorStatus, setMonitorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');

  const [alertsSearch, setAlertsSearch] = useState('');
  const [alertsTypeFilter, setAlertsTypeFilter] = useState('all');
  const [alertsStatusFilter, setAlertsStatusFilter] = useState('all');
  const [alertsPage, setAlertsPage] = useState(1);

  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsPage, setEventsPage] = useState(1);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const loadAll = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [alertsRes, eventsRes, monitorRes] = await Promise.allSettled([API.get('/alerts'), API.get('/alerts/events'), API.get('/alerts/monitor/status')]);

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data || []);
      } else {
        setError('Failed to load alerts.');
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data || []);
      }
      if (monitorRes.status === 'fulfilled') {
        setMonitorStatus(monitorRes.value.data || null);
      }
    } catch {
      setError('Failed to load alerts.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => b.id - a.id)
      .filter((a) => (alertsSearch ? a.symbol.toLowerCase().includes(alertsSearch.toLowerCase()) : true))
      .filter((a) => (alertsTypeFilter === 'all' ? true : a.alert_type === alertsTypeFilter))
      .filter((a) => (alertsStatusFilter === 'all' ? true : alertsStatusFilter === 'active' ? a.is_active : !a.is_active));
  }, [alerts, alertsSearch, alertsTypeFilter, alertsStatusFilter]);

  const totalAlertsPages = Math.ceil(filteredAlerts.length / ALERTS_PAGE_SIZE) || 1;
  const visibleAlerts = filteredAlerts.slice((alertsPage - 1) * ALERTS_PAGE_SIZE, alertsPage * ALERTS_PAGE_SIZE);

  useEffect(() => {
    if (alertsPage > totalAlertsPages) setAlertsPage(totalAlertsPages);
  }, [alertsPage, totalAlertsPages]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!eventsSearch.trim()) return true;
      const q = eventsSearch.toLowerCase();
      return e.symbol.toLowerCase().includes(q) || e.alert_type.toLowerCase().includes(q) || e.message.toLowerCase().includes(q);
    });
  }, [events, eventsSearch]);

  const totalEventsPages = Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE) || 1;
  const visibleEvents = filteredEvents.slice((eventsPage - 1) * EVENTS_PAGE_SIZE, eventsPage * EVENTS_PAGE_SIZE);

  useEffect(() => {
    if (eventsPage > totalEventsPages) setEventsPage(totalEventsPages);
  }, [eventsPage, totalEventsPages]);

  const createAlert = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const validation = validateAlertInput(form);
    if (validation) {
      setFormError(validation);
      return;
    }

    try {
      const { data } = await API.post('/alerts', {
        symbol: normalizeSymbol(form.symbol),
        alert_type: form.alert_type,
        threshold: Number(form.threshold),
      });
      setAlerts((prev) => [data, ...prev]);
      setForm(emptyForm);
      setFormError('');
      setNotice('Alert created successfully.');
    } catch {
      setError('Failed to create alert.');
    }
  };

  const startEdit = (alert) => {
    setEditingId(alert.id);
    setEditForm({
      symbol: alert.symbol,
      alert_type: alert.alert_type,
      threshold: String(alert.threshold),
      is_active: alert.is_active,
    });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const saveEdit = async (alertId) => {
    if (!editForm) return;
    const validation = validateAlertInput(editForm);
    if (validation) {
      setEditError(validation);
      return;
    }

    try {
      const { data } = await API.put(`/alerts/${alertId}`, {
        symbol: normalizeSymbol(editForm.symbol),
        alert_type: editForm.alert_type,
        threshold: Number(editForm.threshold),
        is_active: editForm.is_active,
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? data : a)));
      cancelEdit();
      setNotice('Alert updated.');
      setError('');
    } catch {
      setError('Failed to update alert.');
    }
  };

  const toggleAlert = async (alert) => {
    try {
      const { data } = await API.put(`/alerts/${alert.id}`, {
        is_active: !alert.is_active,
      });
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? data : a)));
      setNotice(`Alert ${data.is_active ? 'enabled' : 'disabled'}.`);
      setError('');
    } catch {
      setError('Failed to toggle alert.');
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await API.delete(`/alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setNotice('Alert deleted.');
      setError('');
    } catch {
      setError('Failed to delete alert.');
    }
  };

  const runMonitorCycle = async () => {
    try {
      await API.post('/alerts/monitor/run');
      await loadAll(false);
      setNotice('Alert monitor cycle executed.');
      setError('');
    } catch {
      setError('Failed to run monitor cycle.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Alerts</h1>
        <button onClick={runMonitorCycle} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Play size={16} /> Run Monitor
        </button>
      </div>

      {monitorStatus && (
        <div className="mb-6 text-sm bg-white shadow rounded-lg p-3">
          Monitor: <span className="font-semibold">{monitorStatus.running ? 'Running' : 'Stopped'}</span> | Interval: {monitorStatus.interval_seconds}s | Cooldown: {monitorStatus.cooldown_seconds}s
        </div>
      )}

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {notice && <p className="text-emerald-600 mb-3">{notice}</p>}

      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
          <Bell size={18} /> Create Alert
        </h2>
        <form onSubmit={createAlert} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Symbol (e.g. AAPL)" value={form.symbol} onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))} className="border rounded px-3 py-2" />
          <select value={form.alert_type} onChange={(e) => setForm((prev) => ({ ...prev, alert_type: e.target.value }))} className="border rounded px-3 py-2">
            {ALERT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input type="number" step="0.01" min="0" placeholder={form.alert_type === 'percentage_change' ? 'Threshold %' : 'Price threshold'} value={form.threshold} onChange={(e) => setForm((prev) => ({ ...prev, threshold: e.target.value }))} className="border rounded px-3 py-2" />
          <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700">
            Add Alert
          </button>
        </form>
        {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-semibold">Your Alerts</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input value={alertsSearch} onChange={(e) => setAlertsSearch(e.target.value)} placeholder="Search symbol..." className="pl-7 pr-2 py-2 text-sm border rounded" />
            </div>
            <select value={alertsTypeFilter} onChange={(e) => setAlertsTypeFilter(e.target.value)} className="text-sm border rounded px-2 py-2">
              <option value="all">All Types</option>
              {ALERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select value={alertsStatusFilter} onChange={(e) => setAlertsStatusFilter(e.target.value)} className="text-sm border rounded px-2 py-2">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        {loading ? (
          <p className="p-5">Loading alerts...</p>
        ) : visibleAlerts.length === 0 ? (
          <p className="p-5 text-gray-500">No alerts match your filters.</p>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3">Symbol</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Threshold</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAlerts.map((alert) => {
                  const isEditing = editingId === alert.id;
                  return (
                    <tr key={alert.id} className="border-t">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input value={editForm?.symbol || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, symbol: e.target.value }))} className="border rounded px-2 py-1 w-24" />
                        ) : (
                          <span className="font-semibold">{alert.symbol}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select value={editForm?.alert_type || 'price_above'} onChange={(e) => setEditForm((prev) => ({ ...prev, alert_type: e.target.value }))} className="border rounded px-2 py-1">
                            {ALERT_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          ALERT_TYPES.find((t) => t.value === alert.alert_type)?.label || alert.alert_type
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" step="0.01" min="0" value={editForm?.threshold || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, threshold: e.target.value }))} className="border rounded px-2 py-1 w-28" />
                        ) : (
                          alert.threshold
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${alert.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                          {alert.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(alert.id)} className="p-2 rounded bg-emerald-100 text-emerald-700" title="Save">
                                <Save size={16} />
                              </button>
                              <button onClick={cancelEdit} className="p-2 rounded bg-gray-100 text-gray-700" title="Cancel">
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(alert)} className="p-2 rounded bg-indigo-100 text-indigo-700" title="Edit">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => toggleAlert(alert)} className="p-2 rounded bg-amber-100 text-amber-700" title="Toggle Active">
                                {alert.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                              <button onClick={() => deleteAlert(alert.id)} className="p-2 rounded bg-red-100 text-red-700" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {editingId && editError && <p className="text-xs text-red-500 px-4 pt-2">{editError}</p>}
            <div className="px-4 pb-3">
              <Pagination page={alertsPage} totalPages={totalAlertsPages} onPrev={() => setAlertsPage((p) => Math.max(1, p - 1))} onNext={() => setAlertsPage((p) => Math.min(totalAlertsPages, p + 1))} />
            </div>
          </>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-xl font-semibold">Recent Triggered Events</h2>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
            <input value={eventsSearch} onChange={(e) => setEventsSearch(e.target.value)} placeholder="Search events..." className="pl-7 pr-2 py-2 text-sm border rounded" />
          </div>
        </div>
        {visibleEvents.length === 0 ? (
          <p className="text-gray-500">No alert events match your search.</p>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map((event) => (
              <div key={event.id} className="border rounded px-3 py-2">
                <div className="font-medium">
                  {event.symbol} - {event.alert_type}
                </div>
                <div className="text-sm text-gray-600">{event.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Price: ${event.current_price} | Threshold: {event.threshold} | {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={eventsPage} totalPages={totalEventsPages} onPrev={() => setEventsPage((p) => Math.max(1, p - 1))} onNext={() => setEventsPage((p) => Math.min(totalEventsPages, p + 1))} />
      </div>
    </div>
  );
};

export default Alerts;
