import { Router } from 'express';
import { Role } from '@prisma/client';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/admin-user.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));
router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
