import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../utils/AuthContext';

export default function LoginScreen() {
  const { dark } = useTheme();
  const { login, authLoading, authError } = useAuth();

  const bg       = dark ? '#0F1923' : '#F5F7FA';
  const cardBg   = dark ? '#172130' : '#FFFFFF';
  const border   = dark ? '#1E3A52' : '#E0E6ED';
  const textPri  = dark ? '#E8EEF4' : '#1A2332';
  const textMut  = dark ? '#546E7A' : '#90A4AE';
  const accent   = dark ? '#5B80F8' : '#1C4EF5';
  const navBg    = dark ? '#0D1B2A' : '#051B3F';
  const shadow   = dark
    ? '0 8px 32px rgba(0,0,0,0.45)'
    : '0 8px 32px rgba(28,78,245,0.10)';

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        boxShadow: shadow,
        overflow: 'hidden',
      }}>

        {/* Card header — matches Navbar brand bar */}
        <div style={{
          background: navBg,
          padding: '24px 32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🛒</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '-0.3px' }}>
              NovaCart
            </span>
          </div>
          <span style={{ color: '#C8F5F5', fontSize: 13 }}>Account Dashboard</span>
        </div>

        {/* Card body */}
        <div style={{ padding: '32px 32px 28px' }}>
          <h2 style={{
            color: textPri,
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 6,
          }}>
            Sign in
          </h2>
          <p style={{ color: textMut, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
            Access is managed via Snowflake OAuth. Click <strong style={{ color: textPri }}>Continue</strong> to
            authenticate with your Snowflake account.
          </p>

          {/* Error banner */}
          {authError && (
            <div style={{
              background: '#FFEBEE',
              border: '1px solid #EF9A9A',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 20,
              color: '#C62828',
              fontSize: 13,
            }}>
              {authError}
            </div>
          )}

          {/* Continue / OAuth button */}
          <button
            onClick={login}
            disabled={authLoading}
            style={{
              width: '100%',
              background: authLoading ? (dark ? '#334155' : '#CBD5E1') : accent,
              color: authLoading ? textMut : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '11px 0',
              fontSize: 15,
              fontWeight: 700,
              cursor: authLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!authLoading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {authLoading ? 'Connecting…' : 'Continue with Snowflake'}
          </button>

          {/* Dev mode note */}
          <p style={{
            marginTop: 20,
            fontSize: 11,
            color: textMut,
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            In development mode, authentication is bypassed automatically.
            <br />
            Snowflake SSO will be enforced in production.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: textMut }}>
        © {new Date().getFullYear()} NovaCart · Internal use only
      </p>
    </div>
  );
}
