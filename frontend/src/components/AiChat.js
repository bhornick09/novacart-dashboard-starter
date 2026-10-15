import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';

export default function AiChat() {
  const { dark } = useTheme();
  const { t } = useLanguage();
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // Initialize or update welcome message
  useEffect(() => {
    setMessages([
      { role: 'assistant', text: t('ai_welcome') }
    ]);
  }, [t]);

  // Scroll to latest message whenever the list changes
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── colours derived from theme ────────────────────────────────────────────
  const bg        = dark ? '#172130' : '#ffffff';
  const bgInput   = dark ? '#0F1923' : '#F5F7FA';
  const border    = dark ? '#1E3A52' : '#E0E6ED';
  const textPri   = dark ? '#E8EEF4' : '#1A2332';
  const textMuted = dark ? '#546E7A' : '#90A4AE';
  const accent    = dark ? '#5B80F8' : '#1C4EF5';
  const navBg     = dark ? '#0D1B2A' : '#051B3F';

  return (
    <>
      {/* ── Floating toggle button ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        className="ai-chat-toggle"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: accent,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: '#fff',
          transition: 'transform 0.15s, opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {open ? '✕' : '✦'}
      </button>

      {/* ── Chat window ────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="ai-chat-window"
          style={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            zIndex: 999,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 500,
            borderRadius: 12,
            background: bg,
            border: `1px solid ${border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >

          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: navBg,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                {t('ai_title')}
              </div>
              <div style={{ color: '#C8F5F5', fontSize: 11 }}>{t('ai_subtitle')}</div>
            </div>
          </div>

          {/* Message list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 320,
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isUser ? accent : bgInput,
                    color: isUser ? '#fff' : textPri,
                    fontSize: 13,
                    lineHeight: 1.5,
                    border: isUser ? 'none' : `1px solid ${border}`,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${border}`,
            display: 'flex',
            gap: 8,
            background: bg,
          }}>
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai_placeholder')}
              style={{
                flex: 1,
                resize: 'none',
                background: bgInput,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '7px 10px',
                color: textPri,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleSend}
              title="Send"
              style={{
                background: accent,
                border: 'none',
                borderRadius: 8,
                padding: '0 14px',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>

          {/* Coming soon notice */}
          <div style={{
            padding: '5px 14px 8px',
            fontSize: 11,
            color: textMuted,
            textAlign: 'center',
            background: bg,
          }}>
            {t('ai_notice')}
          </div>

        </div>
      )}
    </>
  );
}
