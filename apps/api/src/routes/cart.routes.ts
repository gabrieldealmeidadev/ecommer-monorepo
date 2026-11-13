import { Router } from 'express';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);
router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
export default router;
