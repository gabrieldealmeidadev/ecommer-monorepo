import { OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { MockPaymentProvider } from '../integrations/payments/payment.provider';

const paymentProvider = new MockPaymentProvider();

export const orderService = {
  async createFromCart(userId: string, input: { addressId: string; shippingProvider: string; shippingService: string; shippingCents: number; shippingEtaDays: number }) {
    return prisma.$transaction(async tx => {
      const address = await tx.address.findFirst({ where: { id: input.addressId, userId } });
      if (!address) throw new Error('ADDRESS_NOT_FOUND');
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
      });
      if (!cart || cart.items.length === 0) throw new Error('CART_EMPTY');

      let subtotalCents = 0;
      for (const item of cart.items) {
        if (item.product.status !== ProductStatus.ACTIVE) throw new Error('PRODUCT_UNAVAILABLE');
        if (item.quantity > item.product.stock) throw new Error('INSUFFICIENT_STOCK');
        subtotalCents += item.product.priceCents * item.quantity;
      }
      if (!Number.isInteger(input.shippingCents) || input.shippingCents < 0) throw new Error('INVALID_SHIPPING');

      const order = await tx.order.create({
        data: {
          userId, status: OrderStatus.PENDING, subtotalCents, shippingCents: input.shippingCents,
          totalCents: subtotalCents + input.shippingCents,
          shippingProvider: input.shippingProvider, shippingService: input.shippingService,
          shippingEtaDays: input.shippingEtaDays, shippingPostalCode: address.postalCode,
          items: { create: cart.items.map(item => ({
            productId: item.productId, productName: item.product.name,
            unitPriceCents: item.product.priceCents, quantity: item.quantity,
            lineTotalCents: item.product.priceCents * item.quantity
          })) }
        },
        include: { items: true }
      });

      for (const item of cart.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (result.count !== 1) throw new Error('INSUFFICIENT_STOCK');
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (!user) throw new Error('USER_NOT_FOUND');
      const payment = await paymentProvider.createPayment({
        orderId: order.id, amountCents: order.totalCents, customerEmail: user.email
      });
      await tx.payment.create({
        data: { orderId: order.id, provider: payment.provider, externalReference: payment.externalReference,
          status: PaymentStatus.PENDING, amountCents: order.totalCents }
      });
      return { ...order, payment: { provider: payment.provider, externalReference: payment.externalReference, status: payment.status } };
    });
  }
};
