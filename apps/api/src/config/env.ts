import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET precisa estar definido e ter pelo menos 32 caracteres.');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const frenetToken = process.env.FRENET_TOKEN;
const frenetOriginPostalCode = process.env.FRENET_ORIGIN_POSTAL_CODE?.replace(/\D/g, '');
const shippingProvider = process.env.SHIPPING_PROVIDER || (frenetToken || nodeEnv === 'production' ? 'frenet' : 'mock');

if (shippingProvider !== 'mock' && shippingProvider !== 'frenet') {
  throw new Error('SHIPPING_PROVIDER deve ser "mock" ou "frenet".');
}
if (shippingProvider === 'frenet' && !frenetToken) {
  throw new Error('FRENET_TOKEN é obrigatório quando SHIPPING_PROVIDER=frenet.');
}
if (shippingProvider === 'frenet' && !/^\d{8}$/.test(frenetOriginPostalCode || '')) {
  throw new Error('FRENET_ORIGIN_POSTAL_CODE deve conter um CEP válido quando SHIPPING_PROVIDER=frenet.');
}

export const env = {
  nodeEnv,
  port: Number(process.env.API_PORT || 3000),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieName: process.env.COOKIE_NAME || 'ecommerce_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
  currency: process.env.STORE_CURRENCY || 'BRL',
  shippingProvider,
  frenetToken,
  frenetOriginPostalCode
};
