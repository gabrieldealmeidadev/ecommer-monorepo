import type { Request, Response } from 'express';
import { ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { cartService } from '../services/cart.service';
import { isPositiveInteger, isNonEmptyString } from '../utils/validation';

export async function getCart(req: Request, res: Response) {
  try { return res.status(200).json({ cart: await cartService.get(req.auth!.userId) }); }
  catch { return res.status(500).json({ message: 'Não foi possível consultar o carrinho.' }); }
}

export async function addCartItem(req: Request, res: Response) {
  const { productId, quantity } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(productId) || !isPositiveInteger(quantity) || quantity > 99) return res.status(400).json({ message: 'Informe produto e quantidade válida (1 a 99).' });
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== ProductStatus.ACTIVE) return res.status(404).json({ message: 'Produto não encontrado ou indisponível.' });
    const cart = await prisma.cart.upsert({ where: { userId: req.auth!.userId }, update: {}, create: { userId: req.auth!.userId } });
    const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) return res.status(409).json({ message: 'Quantidade maior que o estoque disponível.' });
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: nextQuantity },
      create: { cartId: cart.id, productId, quantity }
    });
    return res.status(200).json({ cart: await cartService.get(req.auth!.userId) });
  } catch { return res.status(500).json({ message: 'Não foi possível adicionar o produto ao carrinho.' }); }
}

export async function updateCartItem(req: Request, res: Response) {
  const { quantity } = req.body as Record<string, unknown>;
  if (!isPositiveInteger(quantity) || quantity > 99) return res.status(400).json({ message: 'Quantidade inválida.' });
  try {
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, cart: { userId: req.auth!.userId } }, include: { product: true } });
    if (!item) return res.status(404).json({ message: 'Item não encontrado.' });
    if (quantity > item.product.stock) return res.status(409).json({ message: 'Quantidade maior que o estoque disponível.' });
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return res.status(200).json({ cart: await cartService.get(req.auth!.userId) });
  } catch { return res.status(500).json({ message: 'Não foi possível atualizar o carrinho.' }); }
}

export async function removeCartItem(req: Request, res: Response) {
  try {
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, cart: { userId: req.auth!.userId } } });
    if (!item) return res.status(404).json({ message: 'Item não encontrado.' });
    await prisma.cartItem.delete({ where: { id: item.id } });
    return res.status(200).json({ cart: await cartService.get(req.auth!.userId) });
  } catch { return res.status(500).json({ message: 'Não foi possível remover o item.' }); }
}
