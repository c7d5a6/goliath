// Base API URL - uses /api in development (proxied by Vite), and production backend URL in production
export const API_BASE = import.meta.env.PROD
  ? 'https://api.goliath.c7d5a6.com'
  : '/api'
