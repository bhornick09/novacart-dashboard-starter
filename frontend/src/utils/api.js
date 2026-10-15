/**
 * api.js — NovaCart Dashboard API client
 *
 * All API calls go through this file.
 * In SPCS, REACT_APP_BACKEND_URL is set to /api and calls are
 * routed through the NGINX router to the backend container.
 * Locally, set REACT_APP_BACKEND_URL=http://localhost:8000 in .env,
 * or it defaults to http://localhost:8000 automatically.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

async function apiFetch(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export async function authorize() {
  return apiFetch('/authorize');
}

export async function getHealth() {
  return apiFetch('/health');
}

export async function getSummary(start, end) {
  const res = await fetch(`${BACKEND_URL}/franchise/summary?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function getOrders(start, end) {
  const res = await fetch(`${BACKEND_URL}/franchise/orders?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function getProducts(start, end) {
  const res = await fetch(`${BACKEND_URL}/franchise/products?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getCustomers(start, end) {
  const res = await fetch(`${BACKEND_URL}/franchise/customers?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function getCities(start, end) {
  const res = await fetch(`${BACKEND_URL}/franchise/cities?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function getLiveOrders(limit = 20) {
  const res = await fetch(`${BACKEND_URL}/franchise/live-orders?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch live orders');
  return res.json();
}
