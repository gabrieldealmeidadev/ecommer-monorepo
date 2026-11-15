export type ShippingQuote = { provider: string; service: string; priceCents: number; etaDays: number };

export type ShippingQuoteInput = {
  originPostalCode: string;
  postalCode: string;
  invoiceValueCents: number;
  items: Array<{
    quantity: number;
    weightGrams: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  }>;
};

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuote[]>;
}

// Somente para desenvolvimento: não representa preço/prazo real de transportadora.
export class MockShippingProvider implements ShippingProvider {
  async quote(input: ShippingQuoteInput) {
    if (!/^\d{5}-?\d{3}$/.test(input.postalCode)) throw new Error('CEP inválido.');
    const units = input.items.reduce((sum, item) => sum + item.quantity, 0);
    return [
      { provider: 'DEMO', service: 'Econômico (demonstração)', priceCents: 1590 + units * 100, etaDays: 7 },
      { provider: 'DEMO', service: 'Expresso (demonstração)', priceCents: 2490 + units * 150, etaDays: 3 }
    ];
  }
}

type FrenetService = {
  Carrier?: string;
  CarrierCode?: string;
  DeliveryTime?: string;
  ServiceCode?: string;
  ServiceDescription?: string;
  ShippingPrice?: string | number;
  Error?: boolean;
};

type FrenetQuoteResponse = {
  ShippingSevicesArray?: FrenetService[];
};

function parseShippingPrice(value: string | number | undefined): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const normalized = String(value).trim().replace(/[^\d,.-]/g, '');
  if (!normalized) return undefined;
  const decimalValue = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized;
  const price = Number(decimalValue);
  if (!Number.isFinite(price) || price < 0) return undefined;
  return Math.round(price * 100);
}

export class FrenetShippingProvider implements ShippingProvider {
  constructor(private readonly token: string) {}

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    const response = await fetch('https://api.frenet.com.br/shipping/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: this.token },
      body: JSON.stringify({
        SellerCEP: input.originPostalCode,
        RecipientCEP: input.postalCode.replace(/\D/g, ''),
        ShipmentInvoiceValue: input.invoiceValueCents / 100,
        ShippingItemArray: input.items.map(item => ({
          Weight: item.weightGrams / 1000,
          Length: item.lengthCm,
          Width: item.widthCm,
          Height: item.heightCm,
          Quantity: item.quantity
        }))
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error('FRENET_REQUEST_FAILED');
    const payload = await response.json() as FrenetQuoteResponse;
    if (!Array.isArray(payload.ShippingSevicesArray)) throw new Error('FRENET_INVALID_RESPONSE');

    return payload.ShippingSevicesArray.flatMap(service => {
      const priceCents = parseShippingPrice(service.ShippingPrice);
      const etaDays = Number.parseInt(service.DeliveryTime || '', 10);
      const provider = service.Carrier || service.CarrierCode;
      const description = service.ServiceDescription || service.ServiceCode;
      if (service.Error || priceCents === undefined || !Number.isInteger(etaDays) || etaDays < 0 || !provider || !description) {
        return [];
      }
      return [{ provider, service: description, priceCents, etaDays }];
    });
  }
}
