import type { Request, Response } from 'express';
import { OrderStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { orderService } from '../services/order.service';

export async function createOrder(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const { addressId, shippingProvider, shippingService, shippingCents, shippingEtaDays } = body;
  if (typeof addressId !== 'string' || !addressId || typeof shippingProvider !== 'string' || !shippingProvider ||
      typeof shippingService !== 'string' || !shippingService ||
      typeof shippingCents !== 'number' || !Number.isInteger(shippingCents) || shippingCents < 0 ||
      typeof shippingEtaDays !== 'number' || !Number.isInteger(shippingEtaDays) || shippingEtaDays < 0) {
    return res.status(400).json({ message: 'Informe endereço e opção de frete válidos.' });
  }
  try {
    const order = await orderService.createFromCart(req.auth!.userId, { addressId, shippingProvider, shippingService, shippingCents, shippingEtaDays });
    return res.status(201).json({ message: 'Pedido criado. O pagamento está pendente.', order });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ADDRESS_NOT_FOUND') return res.status(404).json({ message: 'Endereço não encontrado.' });
    if (code === 'CART_EMPTY') return res.status(400).json({ message: 'O carrinho está vazio.' });
    if (code === 'PRODUCT_UNAVAILABLE') return res.status(409).json({ message: 'Um produto não está mais disponível.' });
    if (code === 'INSUFFICIENT_STOCK') return res.status(409).json({ message: 'Estoque insuficiente para um dos produtos.' });
    if (code === 'INVALID_SHIPPING') return res.status(400).json({ message: 'Frete inválido.' });
    return res.status(500).json({ message: 'Não foi possível criar o pedido.' });
  }
}

export async function listOrders(req: Request, res: Response) {
  try {
    const where = req.auth!.role === Role.ADMIN ? {} : { userId: req.auth!.userId };
    const orders = await prisma.order.findMany({ where, include: { items: true, payment: true }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ orders });
  } catch { return res.status(500).json({ message: 'Não foi possível listar pedidos.' }); }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: req.auth!.role === Role.ADMIN ? { id: req.params.id } : { id: req.params.id, userId: req.auth!.userId },
      include: { items: true, payment: true }
    });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    return res.status(200).json({ order });
  } catch { return res.status(500).json({ message: 'Não foi possível consultar o pedido.' }); }
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { status } = req.body as Record<string, unknown>;
  if (typeof status !== 'string' || !Object.values(OrderStatus).includes(status as OrderStatus)) return res.status(400).json({ message: 'Status de pedido inválido.' });
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: status as OrderStatus }, include: { items: true, payment: true } });
    return res.status(200).json({ order });
  } catch { return res.status(404).json({ message: 'Pedido não encontrado.' }); }
}
