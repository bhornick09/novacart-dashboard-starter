/**
 * OrdersView.js — Orders Overview page
 *
 * This page shows:
 *   - Stat cards: total revenue, total orders, unique customers
 *   - A bar/line chart of monthly revenue over time
 *   - A bar chart of revenue by city/state
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI — charts, stat cards, and layout.
 *
 * Useful libraries already installed:
 *   - recharts: BarChart, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getSummary, getOrders, getCities } from '../utils/api';

const formatCurrency = (v) =>
  Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const formatCompact = (v) =>
  Number(v).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });

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
    // Build a multi-section CSV: summary block, then monthly orders, then cities
    const rows = [];

    // Section 1 — Summary
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

    // Section 2 — Monthly orders
    rows.push(['Monthly Revenue']);
    rows.push(['Month', 'Month Name', 'Order Count', 'Revenue']);
    orders.forEach(o => rows.push([o.month, o.month_name, o.order_count, o.revenue]));
    rows.push([]);

    // Section 3 — Revenue by city
    rows.push(['Revenue by City']);
    rows.push(['City', 'State', 'Order Count', 'Revenue']);
    cities.forEach(c => rows.push([c.city, c.state, c.order_count, c.revenue]));

    // Serialise — quote any cell that contains a comma or newline
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
            <option value="" disabled>Quick Filter</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="6month">Last 6 Months</option>
            <option value="year">Last Year</option>
          </select>
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
          <button className="btn-apply" style={{ marginLeft: 'auto' }} onClick={exportToCsv}>
            Export Data to CSV
          </button>
        </div>

        {/* ── Error state ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && <div className="loading">Loading orders data…</div>}

        {/* ── TODO: Build the UI here ────────────────────────────────────── */}
        {!loading && !error && (
          <>
            {/*
              STEP 1 — Stat cards
              Show total_revenue, total_orders, unique_customers from summary.
              Hint: use the .stat-row and .stat-box CSS classes.
              Available data: summary.total_revenue, summary.total_orders, summary.unique_customers
            */}
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">Total Revenue</div>
                <div className="value">{formatCurrency(summary.total_revenue)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total Orders</div>
                <div className="value">{summary.total_orders.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="label">Unique Customers</div>
                <div className="value">{summary.unique_customers.toLocaleString()}</div>
              </div>
            </div>

            {/*
              STEP 2 — Monthly revenue chart
              orders is an array of: { month, month_name, order_count, revenue }
              Use a BarChart or LineChart from recharts.
              Hint: XAxis dataKey="month_name", Bar dataKey="revenue"
            */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month_name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={formatCompact} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/*
              STEP 3 — Revenue by city chart
              cities is an array of: { city, state, order_count, revenue }
              Use a horizontal BarChart (layout="vertical").
              Show top 10 cities only.
              Hint: .slice(0, 10) on cities array
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Revenue by City</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={cities.slice(0, 10).map(c => ({ ...c, label: `${c.city}, ${c.state}` }))}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-muted)" tickFormatter={formatCompact} />
                  <YAxis type="category" dataKey="label" width={140} stroke="var(--text-muted)" />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
