import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getCustomers } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function CustomersView() {
  const { t } = useLanguage();
  const [startDate,  setStartDate]  = useState('2022-01-01');
  const [endDate,    setEndDate]    = useState(END_DATE);
  const [customers,  setCustomers]  = useState([]);
  const [sortBy,     setSortBy]     = useState('total_spent');
  const [sortDir,    setSortDir]    = useState('desc');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

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
      const data = await getCustomers(start, end);
      setCustomers(data);
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
    rows.push(['Customers']);
    rows.push(['Start Date', 'End Date']);
    rows.push([startDate, endDate]);
    rows.push([]);

    rows.push(['Name', 'City', 'State', 'Total Orders', 'Total Spent']);
    customers.forEach(c => rows.push([c.name, c.city, c.state, c.total_orders, c.total_spent]));

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
    link.download = `customers_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

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
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('customer_count', { count: customers.length })}
          </span>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">{t('loading_customers')}</div>}

        {!loading && !error && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="section-title">
                {t('top_customers_title')}
              </div>
            </div>

            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 540 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-primary)' }}>
                    {[
                      { key: 'name',         label: t('col_name') },
                      { key: 'city',         label: t('col_city') },
                      { key: 'state',        label: t('col_state') },
                      { key: 'total_orders', label: t('col_orders') },
                      { key: 'total_spent',  label: t('col_total_spent') },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        style={{
                          padding: '10px 14px',
                          textAlign: key === 'total_orders' || key === 'total_spent' ? 'right' : 'left',
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
                  {sorted.map((c, i) => (
                    <tr
                      key={c.customer_id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--bg-primary)',
                      }}
                    >
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{c.city}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{c.state}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>{(c.total_orders || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(c.total_spent)}</td>
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
