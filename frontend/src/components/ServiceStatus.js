import React, { useEffect, useState } from 'react';
import { getHealth } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

export default function ServiceStatus() {
  const { t } = useLanguage();
  const [status, setStatus] = useState('checking');
  const [detail, setDetail] = useState('');

  async function check() {
    try {
      const data = await getHealth();
      setStatus(data.status === 'healthy' ? 'healthy' : 'degraded');
      setDetail(data.database?.status === 'connected' ? 'Connected' : 'DB issue');
    } catch {
      setStatus('error');
      setDetail('Backend unreachable');
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const colors = { healthy: '#00897B', degraded: '#F9A825', error: '#C62828', checking: '#90A4AE' };
  const getLabel = () => {
    switch (status) {
      case 'healthy':  return t('status_healthy');
      case 'degraded': return t('status_degraded');
      case 'error':    return t('status_offline');
      default:         return t('status_checking');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} title={detail}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: colors[status],
        boxShadow: status === 'healthy' ? `0 0 6px ${colors[status]}` : 'none',
        display: 'inline-block',
      }} />
      <span style={{ color: colors[status], fontWeight: 600 }}>{getLabel()}</span>
    </div>
  );
}
