/**
 * LiveOrdersView.js — Real-time Live Orders Feed
 *
 * Displays an auto-refreshing feed of the newest 20 incoming transactions,
 * with live polling controls, status indicators, quick search, and summary stats.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { getLiveOrders } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

const formatCurrency = (v) =>
  Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export default function LiveOrdersView() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const fetchLiveOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await getLiveOrders(20);
      setOrders(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch live orders');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveOrders(true);
  }, [fetchLiveOrders]);

  // Polling loop (every 5 seconds when active)
  useEffect(() => {
    if (!isPolling) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setRefreshCountdown(5);

    countdownTimerRef.current = setInterval(() => {
      setRefreshCountdown(c => (c > 1 ? c - 1 : 5));
    }, 1000);

    pollTimerRef.current = setInterval(() => {
      fetchLiveOrders(false);
      setRefreshCountdown(5);
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isPolling, fetchLiveOrders]);

  const handleManualRefresh = () => {
    setRefreshCountdown(5);
    fetchLiveOrders(false);
  };

  const togglePolling = () => {
    setIsPolling(prev => !prev);
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      search === '' ||
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || o.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate live summary metrics
  const totalVolume = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalVolume / orders.length : 0;
  const completedCount = orders.filter(o => ['delivered', 'shipped'].includes(o.status.toLowerCase())).length;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    let bg = '#E0F2FE';
    let text = '#0369A1';
    let labelKey = 'status_processing';

    if (s === 'delivered') {
      bg = '#DCFCE7';
      text = '#15803D';
      labelKey = 'status_delivered';
    } else if (s === 'shipped') {
      bg = '#E0E7FF';
      text = '#4338CA';
      labelKey = 'status_shipped';
    } else if (s === 'cancelled') {
      bg = '#FEE2E2';
      text = '#B91C1C';
      labelKey = 'status_cancelled';
    } else if (s === 'pending') {
      bg = '#FEF3C7';
      text = '#B45309';
      labelKey = 'status_pending';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          background: bg,
          color: text,
        }}
      >
        {t(labelKey)}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">
        {/* ── Top Header Bar ────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: isPolling ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                  border: isPolling ? '1px solid #10B981' : '1px solid #94A3B8',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isPolling ? '#10B981' : '#94A3B8',
                    boxShadow: isPolling ? '0 0 8px #10B981' : 'none',
                    display: 'inline-block',
                    animation: isPolling ? 'pulse 1.5s infinite' : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    color: isPolling ? '#059669' : '#64748B',
                  }}
                >
                  {isPolling ? t('live_badge') : t('live_paused')}
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t('live_title')}
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {t('live_subtitle')}
            </p>
          </div>

          {/* Controls: Pause / Resume + Refresh + Countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('last_updated', { time: lastUpdated.toLocaleTimeString() })}
                {isPolling && ` (next in ${refreshCountdown}s)`}
              </span>
            )}

            <button
              onClick={togglePolling}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: isPolling ? 'transparent' : 'var(--accent)',
                color: isPolling ? 'var(--text-primary)' : '#fff',
                border: '1px solid var(--border)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isPolling ? '⏸' : '▶'}</span>
              <span>{isPolling ? t('pause_feed') : t('resume_feed')}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              className="btn-apply"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title={t('refresh_now')}
            >
              <span>🔄</span>
              <span>{t('refresh_now')}</span>
            </button>
          </div>
        </div>

        {/* ── Metric Cards ──────────────────────────────────────────────── */}
        <div className="stat-row">
          <div className="stat-box">
            <div className="label">{t('recent_volume')}</div>
            <div className="value">{formatCurrency(totalVolume)}</div>
          </div>
          <div className="stat-box">
            <div className="label">{t('avg_order_value')}</div>
            <div className="value">{formatCurrency(avgOrderValue)}</div>
          </div>
          <div className="stat-box">
            <div className="label">{t('showing_orders', { count: 20 })}</div>
            <div className="value" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span>{orders.length}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                ({completedCount} {t('status_delivered')}/{t('status_shipped')})
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ──────────────────────────────────── */}
        <div className="filter-bar">
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('filter_search_placeholder')}
            style={{ flex: 1, minWidth: 180 }}
          />

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="delivered">{t('status_delivered')}</option>
            <option value="shipped">{t('status_shipped')}</option>
            <option value="processing">{t('status_processing')}</option>
            <option value="pending">{t('status_pending')}</option>
            <option value="cancelled">{t('status_cancelled')}</option>
          </select>

          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                padding: '4px 8px',
              }}
            >
              Clear
            </button>
          )}

          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filteredOrders.length} / {orders.length}
          </span>
        </div>

        {/* ── Error state ──────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ────────────────────────────────────────────── */}
        {loading && <div className="loading">{t('loading_live')}</div>}

        {/* ── Real-time Feed Table ─────────────────────────────────────── */}
        {!loading && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title">
                {t('live_title')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('showing_orders', { count: filteredOrders.length })}
              </div>
            </div>

            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-primary)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_order_id')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_order_date')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_customer')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_location')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_product')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_qty')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_amount')}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{t('col_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 14px', color: 'var(--text-muted)' }}>
                        No orders match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, i) => (
                      <tr
                        key={o.order_id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'transparent' : 'var(--bg-primary)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                          {o.order_id}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {o.order_date}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {o.customer_name}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                          {o.customer_city}{o.customer_state !== 'N/A' ? `, ${o.customer_state}` : ''}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                          <div>{o.product_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.product_category}</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {o.quantity}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {formatCurrency(o.amount)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {getStatusBadge(o.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
