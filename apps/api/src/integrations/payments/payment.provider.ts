export type PaymentCreation = { provider: string; externalReference: string; status: 'PENDING' };

export interface PaymentProvider {
  createPayment(input: { orderId: string; amountCents: number; customerEmail: string }): Promise<PaymentCreation>;
}

// Adaptador local para desenvolvimento; não processa dinheiro real.
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: { orderId: string; amountCents: number; customerEmail: string }) {
    return {
      provider: 'MOCK',
      externalReference: `mock_${input.orderId}`,
      status: 'PENDING' as const
    };
  }
}
