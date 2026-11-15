import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { FrenetShippingProvider, MockShippingProvider } from '../integrations/shipping/shipping.provider';

const shippingProvider = env.shippingProvider === 'frenet'
  ? new FrenetShippingProvider(env.frenetToken || '')
  : new MockShippingProvider();

export async function quoteShipping(req: Request, res: Response) {
  const postalCode = typeof req.body?.postalCode === 'string' ? req.body.postalCode.trim() : '';
  if (!/^\d{5}-?\d{3}$/.test(postalCode)) return res.status(400).json({ message: 'Informe um CEP válido.' });
  const itemsInput: unknown[] = Array.isArray(req.body?.items) ? req.body.items : [];
  if (itemsInput.length === 0 || itemsInput.length > 50) return res.status(400).json({ message: 'Informe os itens para cotação.' });
  try {
    const requestedItems: Array<{ productId: string; quantity: number }> = [];
    for (const item of itemsInput) {
      if (!item || typeof item !== 'object' || !('productId' in item) || typeof item.productId !== 'string' || !item.productId) {
        return res.status(400).json({ message: 'Cada item deve conter productId.' });
      }
      if (!('quantity' in item) || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return res.status(400).json({ message: 'Quantidade inválida.' });
      }
      requestedItems.push({ productId: item.productId, quantity: item.quantity });
    }
    const ids = requestedItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: {
        id: true, stock: true, priceCents: true, weightGrams: true,
        lengthCm: true, widthCm: true, heightCm: true
      }
    });
    const productMap = new Map(products.map(product => [product.id, product]));
    const normalized: Array<{ quantity: number; weightGrams: number; lengthCm: number; widthCm: number; heightCm: number }> = [];
    let invoiceValueCents = 0;
    for (const item of requestedItems) {
      const product = productMap.get(item.productId);
      if (!product) return res.status(404).json({ message: 'Produto não encontrado ou indisponível.' });
      if (!product.weightGrams || !product.lengthCm || !product.widthCm || !product.heightCm) {
        return res.status(400).json({ message: 'O produto precisa ter peso e dimensões cadastrados para calcular o frete.' });
      }
      normalized.push({
        quantity: item.quantity, weightGrams: product.weightGrams, lengthCm: product.lengthCm,
        widthCm: product.widthCm, heightCm: product.heightCm
      });
      invoiceValueCents += product.priceCents * item.quantity;
    }
    const quotes = await shippingProvider.quote({
      originPostalCode: env.frenetOriginPostalCode || '',
      postalCode, invoiceValueCents, items: normalized
    });
    const demo = env.shippingProvider === 'mock';
    return res.status(200).json({
      quotes, demo,
      ...(demo ? { message: 'Cotação demonstrativa; não representa preço real de frete.' } : {})
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'FRENET_REQUEST_FAILED' || code === 'FRENET_INVALID_RESPONSE') {
      return res.status(502).json({ message: 'A Frenet não conseguiu calcular o frete neste momento.' });
    }
    return res.status(502).json({ message: 'Não foi possível calcular o frete.' });
  }
}
