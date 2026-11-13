import { Router } from 'express';
import { Role } from '@prisma/client';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.use(authenticate);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', authorize(Role.ADMIN), updateOrderStatus);
export default router;
