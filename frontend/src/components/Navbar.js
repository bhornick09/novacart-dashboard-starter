import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import ServiceStatus from './ServiceStatus';

// image imports
import ordersIcon from '../assets/orders.jpg';
import productsIcon from '../assets/products.jpg';
import customerIcon from '../assets/customers.jpg';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    {
      id: 'orders',
      label: (
        <>
          <img src={ordersIcon} alt="Orders" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
          <span> {t('nav_orders')}</span>
        </>
      ),
      path: '/orders',
    },
    {
      id: 'products',
      label: (
        <>
          <img src={productsIcon} alt="Products" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
          <span> {t('nav_products')}</span>
        </>
      ),
      path: '/products',
    },
    {
      id: 'customers',
      label: (
        <>
          <img src={customerIcon} alt="Customers" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
          <span> {t('nav_customers')}</span>
        </>
      ),
      path: '/customers',
    },
    {
      id: 'live',
      label: (
        <>
          <span style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px #10B981',
            verticalAlign: 'middle',
            marginRight: 4,
          }} />
          <span> {t('nav_live')}</span>
        </>
      ),
      path: '/live',
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive initials from username for the avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  const accent   = dark ? '#5B80F8' : '#1C4EF5';
  const border   = dark ? '#1E3A52' : '#E0E6ED';
  const textPri  = dark ? '#E8EEF4' : '#1A2332';
  const textMut  = dark ? '#546E7A' : '#90A4AE';

  return (
    <nav className="navbar-root" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      minHeight: 56,
      background: dark ? '#0D1B2A' : '#051B3F',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: 8,
    }}>

      {/* Brand */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate('/')}
      >
        <span style={{ fontSize: 20 }}>🛒</span>
        <span className="brand-text" style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.2px' }}>
          {t('brand_title')}
        </span>
      </div>

      {/* Nav links — horizontally scrollable on small mobile screens */}
      <div className="nav-links-container" style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '4px 0',
      }}>
        {links.map(({ id, label, path }) => {
          const active = location.pathname === path || (path === '/orders' && location.pathname === '/');
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              style={{
                background: active ? 'rgba(77,182,172,0.22)' : 'transparent',
                border: active ? '1px solid #C8F5F5' : '1px solid transparent',
                color: active ? '#C8F5F5' : '#B0BEC5',
                borderRadius: 6,
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Right side (Status, Theme, Profile widget) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div className="nav-service-status">
          <ServiceStatus />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            borderRadius: 6,
            padding: '4px 9px',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Avatar + dropdown widget */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            title={user?.username || 'Profile'}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1C4EF5 0%, #4A9EE0 100%)',
              border: '2px solid rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.5px',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              minWidth: 230,
              background: dark ? '#172130' : '#FFFFFF',
              border: `1px solid ${dark ? '#1E3A52' : '#E0E6ED'}`,
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              overflow: 'hidden',
              zIndex: 200,
            }}>

              {/* User info header */}
              <div style={{
                padding: '14px 16px 12px',
                borderBottom: `1px solid ${dark ? '#1E3A52' : '#E0E6ED'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1C4EF5 0%, #4A9EE0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{
                      color: dark ? '#E8EEF4' : '#1A2332',
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {user?.username || 'Unknown user'}
                    </div>
                    <div style={{
                      color: dark ? '#546E7A' : '#90A4AE',
                      fontSize: 11,
                      marginTop: 1,
                    }}>
                      {user?.status === 'authorized' ? t('authenticated') : t('dev_session')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task 1: Language support selector inside Profile widget */}
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${dark ? '#1E3A52' : '#E0E6ED'}`,
                background: dark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: textMut,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <span>🌐</span>
                  <span>{t('language')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {languages.map(l => {
                    const isSelected = lang === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          background: isSelected ? (dark ? 'rgba(91,128,248,0.25)' : 'rgba(28,78,245,0.12)') : 'transparent',
                          border: isSelected ? `1.5px solid ${accent}` : `1px solid ${border}`,
                          color: isSelected ? accent : textPri,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout item */}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '11px 16px',
                  textAlign: 'left',
                  color: '#EF5350',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? '#1E3A52' : '#FFF5F5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 15 }}>↪</span>
                {t('sign_out')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
