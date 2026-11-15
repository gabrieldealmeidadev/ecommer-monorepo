import { FrenetShippingProvider } from '../src/integrations/shipping/shipping.provider';

describe('FrenetShippingProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('converts product measurements and maps Frenet quotes', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      ShippingSevicesArray: [{
        Carrier: 'Correios',
        ServiceDescription: 'PAC',
        ShippingPrice: '15,90',
        DeliveryTime: '7 dias úteis'
      }]
    }), { status: 200 }));
    const provider = new FrenetShippingProvider('secret-token');

    const quotes = await provider.quote({
      originPostalCode: '01001000',
      postalCode: '20000-000',
      invoiceValueCents: 12345,
      items: [{ quantity: 2, weightGrams: 250, lengthCm: 16, widthCm: 10, heightCm: 50 }]
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.frenet.com.br/shipping/quote', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: 'secret-token' },
      body: JSON.stringify({
        SellerCEP: '01001000',
        RecipientCEP: '20000000',
        ShipmentInvoiceValue: 123.45,
        ShippingItemArray: [{ Weight: 0.25, Length: 16, Width: 10, Height: 50, Quantity: 2 }]
      })
    }));
    expect(quotes).toEqual([{ provider: 'Correios', service: 'PAC', priceCents: 1590, etaDays: 7 }]);
  });

  it('rejects unsuccessful Frenet responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
    const provider = new FrenetShippingProvider('secret-token');

    await expect(provider.quote({
      originPostalCode: '01001000',
      postalCode: '20000000',
      invoiceValueCents: 1000,
      items: [{ quantity: 1, weightGrams: 250, lengthCm: 16, widthCm: 10, heightCm: 50 }]
    })).rejects.toThrow('FRENET_REQUEST_FAILED');
  });

  it('does not expose services without a valid price', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      ShippingSevicesArray: [{
        Carrier: 'Correios',
        ServiceDescription: 'PAC',
        ShippingPrice: '',
        DeliveryTime: '7'
      }]
    }), { status: 200 }));
    const provider = new FrenetShippingProvider('secret-token');

    await expect(provider.quote({
      originPostalCode: '01001000',
      postalCode: '20000000',
      invoiceValueCents: 1000,
      items: [{ quantity: 1, weightGrams: 250, lengthCm: 16, widthCm: 10, heightCm: 50 }]
    })).resolves.toEqual([]);
  });
});
