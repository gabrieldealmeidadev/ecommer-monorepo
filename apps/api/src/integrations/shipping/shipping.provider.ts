export type ShippingQuote = { provider: string; service: string; priceCents: number; etaDays: number };

export interface ShippingProvider {
  quote(input: { postalCode: string; items: Array<{ quantity: number; weightGrams: number }> }): Promise<ShippingQuote[]>;
}

// Somente para desenvolvimento: não representa preço/prazo real de transportadora.
export class MockShippingProvider implements ShippingProvider {
  async quote(input: { postalCode: string; items: Array<{ quantity: number; weightGrams: number }> }) {
    if (!/^\d{5}-?\d{3}$/.test(input.postalCode)) throw new Error('CEP inválido.');
    const units = input.items.reduce((sum, item) => sum + item.quantity, 0);
    return [
      { provider: 'DEMO', service: 'Econômico (demonstração)', priceCents: 1590 + units * 100, etaDays: 7 },
      { provider: 'DEMO', service: 'Expresso (demonstração)', priceCents: 2490 + units * 150, etaDays: 3 }
    ];
  }
}
