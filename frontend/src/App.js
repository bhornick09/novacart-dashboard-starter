import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { LanguageProvider } from './utils/LanguageContext';
import OrdersView     from './pages/OrdersView';
import ProductsView   from './pages/ProductsView';
import CustomersView  from './pages/CustomersView';
import LiveOrdersView from './pages/LiveOrdersView';
import LoginScreen    from './components/LoginScreen';
import AiChat         from './components/AiChat';
import './App.css';

// Inner component so it can access ThemeContext, AuthContext, and LanguageContext
function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <LoginScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Navigate to="/orders" replace />} />
        <Route path="/orders"      element={<OrdersView />} />
        <Route path="/products"    element={<ProductsView />} />
        <Route path="/customers"   element={<CustomersView />} />
        <Route path="/live"        element={<LiveOrdersView />} />
        <Route path="/live-orders" element={<Navigate to="/live" replace />} />
        <Route path="*"            element={<Navigate to="/orders" replace />} />
      </Routes>
      <AiChat />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
