import { Router } from 'express';
import { createAddress, deleteAddress, listAddresses } from '../controllers/address.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.get('/', listAddresses);
router.post('/', createAddress);
router.delete('/:id', deleteAddress);
export default router;
