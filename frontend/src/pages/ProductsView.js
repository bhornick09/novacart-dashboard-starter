import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { getProducts } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${Number(value).toFixed(2)}`;
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
  const { t } = useLanguage();
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

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">{t('loading_products')}</div>}

        {!loading && !error && (
          <div className="grid-2">
            {/* Top products bar chart */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>{t('top_products_title')}</div>
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={products.map(p => ({ ...p, shortName: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name }))}
                    layout="vertical"
                    margin={{ left: 5, right: 15, top: 10, bottom: 0 }}
                  >
                    <XAxis type="number" stroke="var(--text-muted)" tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="shortName" width={130} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="revenue" name={t('col_revenue')} fill="var(--accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product details table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="section-title">{t('product_details')}</div>
              </div>
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 460 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-primary)' }}>
                      {[
                        { key: 'name',       label: t('col_name') },
                        { key: 'category',   label: t('col_category') },
                        { key: 'units_sold', label: t('col_units_sold') },
                        { key: 'revenue',    label: t('col_revenue') },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          style={{
                            padding: '10px 12px',
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
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.category}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{(p.units_sold || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
