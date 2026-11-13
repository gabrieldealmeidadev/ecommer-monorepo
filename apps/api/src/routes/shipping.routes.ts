import { Router } from 'express';
import { quoteShipping } from '../controllers/shipping.controller';

const router = Router();
router.post('/quote', quoteShipping);
export default router;
