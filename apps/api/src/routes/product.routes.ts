import { Router } from 'express';
import { Role } from '@prisma/client';
import { createProduct, deleteProduct, getProduct, listAdminProducts, listProducts, updateProduct } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/', listProducts);
router.get('/admin', authenticate, authorize(Role.ADMIN), listAdminProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize(Role.ADMIN), createProduct);
router.patch('/:id', authenticate, authorize(Role.ADMIN), updateProduct);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deleteProduct);
export default router;
