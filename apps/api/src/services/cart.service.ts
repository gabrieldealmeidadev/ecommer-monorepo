import { prisma } from '../config/prisma';

export const cartService = {
  async getOrCreate(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, priceCents: true, stock: true, imageUrl: true, status: true } } } } }
    });
  },
  async get(userId: string) {
    const cart = await this.getOrCreate(userId);
    const items = cart.items.map(item => ({
      id: item.id, productId: item.productId, name: item.product.name, slug: item.product.slug,
      priceCents: item.product.priceCents, quantity: item.quantity, stock: item.product.stock,
      imageUrl: item.product.imageUrl, lineTotalCents: item.product.priceCents * item.quantity
    }));
    return { id: cart.id, items, subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0) };
  }
};
