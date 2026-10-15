/**
 * ProductsView.js — Product Performance page
 *
 * This page shows:
 *   - A bar chart of top 10 products by revenue
 *   - A table with product name, category, units sold, and revenue
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { getProducts } from '../utils/api';

// Format currency helper
function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

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

export default function ProductsView() {
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate,   setEndDate]   = useState(END_DATE);
  const [products,  setProducts]  = useState([]);
  const [sortBy,    setSortBy]    = useState('revenue');
  const [sortDir,   setSortDir]   = useState('desc');
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

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const sorted = [...products].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  async function loadDataWith(start, end) {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(start, end);
      setProducts(data);
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

    rows.push(['Products']);
    rows.push(['Start Date', 'End Date']);
    rows.push([startDate, endDate]);
    rows.push([]);

    rows.push(['Product Name', 'Category', 'Units Sold', 'Revenue']);
    products.forEach(p => rows.push([p.name, p.category, p.units_sold, p.revenue]));

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
    link.download = `products_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

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

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading products data…</div>}

        {!loading && !error && (
          <div className="grid-2">

            {/*
              STEP 1 — Top products bar chart
              products is: [{ product_id, name, category, units_sold, revenue }]
              Use a horizontal BarChart (layout="vertical").
              XAxis type="number", YAxis type="category" dataKey="name"
              Hint: truncate long product names to 20 chars
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Top 10 Products by Revenue</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={products.map(p => ({ ...p, shortName: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name }))}
                  layout="vertical"
                  margin={{ left: 10, right: 16 }}
                >
                  <XAxis type="number" stroke="var(--text-muted)" tickFormatter={formatCurrency} />
                  <YAxis type="category" dataKey="shortName" width={150} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {[
                      { key: 'name',       label: 'Name' },
                      { key: 'category',   label: 'Category' },
                      { key: 'units_sold', label: 'Units Sold' },
                      { key: 'revenue',    label: 'Revenue' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        style={{
                          padding: '8px 10px',
                          textAlign: key === 'units_sold' || key === 'revenue' ? 'right' : 'left',
                          color: sortBy === key ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}{sortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => (
                    <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-primary)' }}>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)' }}>{p.units_sold.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
