import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import addressRoutes from './routes/address.routes';
import shippingRoutes from './routes/shipping.routes';
import orderRoutes from './routes/order.routes';
import adminUserRoutes from './routes/admin-user.routes';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser() as unknown as express.RequestHandler);
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Resposta explícita para rotas inexistentes; não é middleware global de erro.
app.use((_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});
