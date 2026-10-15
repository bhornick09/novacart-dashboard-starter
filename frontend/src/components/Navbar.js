import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';
import ServiceStatus from './ServiceStatus';

// image imports
import ordersIcon from '../assets/orders.jpg'
import productsIcon from '../assets/products.jpg'
import customerIcon from '../assets/customers.jpg'

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    { label: (
      <>
        <img src={ordersIcon} alt="Orders" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
        <span> Orders</span>
      </>
    ),    path: '/orders'    },
    { label: (
      <>
        <img src={productsIcon} alt="Products" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
        <span> Products</span>
      </>
    ),    path: '/products'    },
    { label: (
      <>
        <img src={customerIcon} alt="Customers" style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />
        <span> Customers</span>
      </>
    ),    path: '/customers'    },
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

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
      background: dark ? '#0D1B2A' : '#051B3F',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        <span style={{ fontSize: 20 }}>🛒</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>NovaCart Analytics Platform</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 8 }}>
        {links.map(({ label, path }) => {
          const active = location.pathname === path;
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{
                background: active ? 'rgba(77,182,172,0.2)' : 'transparent',
                border: active ? '1px solid #C8F5F5' : '1px solid transparent',
                color: active ? '#C8F5F5' : '#B0BEC5',
                borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ServiceStatus />

        {/* Theme toggle */}
        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16,
          }}>
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Avatar + dropdown */}
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
              minWidth: 200,
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
                  {/* Larger avatar in the dropdown */}
                  <div style={{
                    width: 38,
                    height: 38,
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
                      {user?.status === 'authorized' ? '● Authenticated' : 'Dev session'}
                    </div>
                  </div>
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
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? '#1E3A52' : '#FFF5F5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 15 }}>↪</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
