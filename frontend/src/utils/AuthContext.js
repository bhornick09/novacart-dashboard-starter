import React, { createContext, useContext, useState } from 'react';
import { authorize } from './api';

/**
 * AuthContext — authentication state for the NovaCart Dashboard.
 *
 * Currently uses the /authorize endpoint which:
 *   - In Dev mode:       returns a mock user immediately (no credentials needed)
 *   - In Snowflake mode: reads the Sf-Context-Current-User header injected by SPCS OAuth
 *
 * When real OAuth is configured, swap the login() body to initiate the OAuth
 * redirect flow. The rest of the app (LoginScreen, Navbar, App) needs no changes.
 *
 * Session is persisted in sessionStorage so a page refresh keeps the user logged in
 * for the duration of the browser session.
 */

const AuthContext = createContext();

const SESSION_KEY = 'nc-user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  async function login() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Calls GET /authorize — returns { user, status } in both Dev and SPCS modes.
      // Replace this body with an OAuth redirect when Snowflake SSO is configured.
      const data = await authorize();
      const profile = { username: data.user, status: data.status };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch (err) {
      setAuthError(err.message || 'Authorization failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthError(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
