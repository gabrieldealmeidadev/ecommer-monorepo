import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { MockShippingProvider } from '../integrations/shipping/shipping.provider';

const shippingProvider = new MockShippingProvider();

export async function quoteShipping(req: Request, res: Response) {
  const postalCode = typeof req.body?.postalCode === 'string' ? req.body.postalCode.trim() : '';
  if (!/^\d{5}-?\d{3}$/.test(postalCode)) return res.status(400).json({ message: 'Informe um CEP válido.' });
  const itemsInput = Array.isArray(req.body?.items) ? req.body.items : [];
  if (itemsInput.length === 0 || itemsInput.length > 50) return res.status(400).json({ message: 'Informe os itens para cotação.' });
  try {
    const ids = itemsInput.map((item: { productId?: unknown }) => typeof item?.productId === 'string' ? item.productId : '');
    if (ids.some((id: string) => !id)) return res.status(400).json({ message: 'Cada item deve conter productId.' });
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, stock: true } });
    const productMap = new Map(products.map(product => [product.id, product]));
    const normalized: Array<{ quantity: number; weightGrams: number }> = [];
    for (const item of itemsInput as Array<{ productId: string; quantity: unknown }>) {
      if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return res.status(400).json({ message: 'Quantidade inválida.' });
      if (!productMap.has(item.productId)) return res.status(404).json({ message: 'Produto não encontrado.' });
      normalized.push({ quantity: item.quantity, weightGrams: 500 });
    }
    const quotes = await shippingProvider.quote({ postalCode, items: normalized });
    return res.status(200).json({ quotes, demo: true, message: 'Cotação demonstrativa; não representa preço real de frete.' });
  } catch {
    return res.status(500).json({ message: 'Não foi possível calcular o frete.' });
  }
}
