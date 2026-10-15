import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getSummary, getOrders, getCities } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

const formatCurrency = (v) =>
  Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const formatCompact = (v) =>
  Number(v || 0).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const END_DATE = '2022-12-31';

function getQuickRange(preset) {
  const end = new Date(END_DATE);
  let start = new Date(END_DATE);
  if (preset === 'day')    start.setDate(end.getDate() - 1);
  if (preset === 'week')   start.setDate(end.getDate() - 7);
  if (preset === 'month')  start.setMonth(end.getMonth() - 1);
  if (preset === '6month') start.setMonth(end.getMonth() - 6);
  if (preset === 'year')   start.setFullYear(end.getFullYear() - 1);
  return start.toISOString().slice(0, 10);
}

export default function OrdersView() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate,   setEndDate]   = useState(END_DATE);
  const [summary,   setSummary]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  function handleQuickRange(preset) {
    if (!preset) return;
    const start = getQuickRange(preset);
    setStartDate(start);
    setEndDate(END_DATE);
    loadDataWith(start, END_DATE);
  }

  async function loadDataWith(start, end) {
    setLoading(true);
    setError(null);
    try {
      const [s, o, c] = await Promise.all([
        getSummary(start, end),
        getOrders(start, end),
        getCities(start, end),
      ]);
      setSummary(s);
      setOrders(o);
      setCities(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    return loadDataWith(startDate, endDate);
  }

  function exportToCsv() {
    const rows = [];
    rows.push(['Summary']);
    rows.push(['Start Date', 'End Date', 'Total Revenue', 'Total Orders', 'Unique Customers']);
    rows.push([
      startDate,
      endDate,
      summary?.total_revenue ?? '',
      summary?.total_orders ?? '',
      summary?.unique_customers ?? '',
    ]);
    rows.push([]);

    rows.push(['Monthly Revenue']);
    rows.push(['Month', 'Month Name', 'Order Count', 'Revenue']);
    orders.forEach(o => rows.push([o.month, o.month_name, o.order_count, o.revenue]));
    rows.push([]);

    rows.push(['Revenue by City']);
    rows.push(['City', 'State', 'Order Count', 'Revenue']);
    cities.forEach(c => rows.push([c.city, c.state, c.order_count, c.revenue]));

    const csvContent = rows
      .map(row => row.map(cell => {
        const s = String(cell ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `orders_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="filter-bar">
          <select defaultValue="" onChange={e => handleQuickRange(e.target.value)}>
            <option value="" disabled>{t('quick_filter')}</option>
            <option value="day">{t('last_day')}</option>
            <option value="week">{t('last_week')}</option>
            <option value="month">{t('last_month')}</option>
            <option value="6month">{t('last_6months')}</option>
            <option value="year">{t('last_year')}</option>
          </select>
          <div className="filter-group">
            <label>{t('from')}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>{t('to')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn-apply" onClick={loadData}>{t('apply')}</button>
          <button className="btn-apply btn-export" onClick={exportToCsv}>
            {t('export_csv')}
          </button>
        </div>

        {/* ── Error state ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && <div className="loading">{t('loading_orders')}</div>}

        {/* ── Dashboard UI ───────────────────────────────────────────────── */}
        {!loading && !error && summary && (
          <>
            {/* Stat cards */}
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">{t('total_revenue')}</div>
                <div className="value">{formatCurrency(summary.total_revenue)}</div>
              </div>
              <div className="stat-box">
                <div className="label">{t('total_orders')}</div>
                <div className="value">{(summary.total_orders || 0).toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="label">{t('unique_customers')}</div>
                <div className="value">{(summary.unique_customers || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Monthly revenue chart */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>{t('monthly_revenue')}</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orders} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month_name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--text-muted)" tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="revenue" name={t('revenue')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by city chart */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>{t('revenue_by_city')}</div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cities.slice(0, 10).map(c => ({ ...c, label: `${c.city}, ${c.state}` }))}
                    layout="vertical"
                    margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--text-muted)" tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="label" width={110} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="revenue" name={t('revenue')} fill="var(--accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
