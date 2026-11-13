import { Router } from 'express';
import { Role } from '@prisma/client';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.get('/', listCategories);
router.post('/', authenticate, authorize(Role.ADMIN), createCategory);
router.patch('/:id', authenticate, authorize(Role.ADMIN), updateCategory);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deleteCategory);
export default router;
