import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET precisa estar definido e ter pelo menos 32 caracteres.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.API_PORT || 3000),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieName: process.env.COOKIE_NAME || 'ecommerce_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
  currency: process.env.STORE_CURRENCY || 'BRL'
};
