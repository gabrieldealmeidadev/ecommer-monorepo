import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { isNonEmptyString } from '../utils/validation';

const requiredFields = ['recipient', 'postalCode', 'street', 'number', 'district', 'city', 'state'] as const;

function validateAddress(body: Record<string, unknown>): string | null {
  for (const field of requiredFields) {
    if (!isNonEmptyString(body[field])) return `O campo ${field} é obrigatório.`;
  }
  if (!/^\d{5}-?\d{3}$/.test(String(body.postalCode))) return 'CEP inválido.';
  if (String(body.state).trim().length !== 2) return 'Estado deve conter a sigla de 2 letras.';
  return null;
}

export async function listAddresses(req: Request, res: Response) {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ addresses });
  } catch { return res.status(500).json({ message: 'Não foi possível listar endereços.' }); }
}

export async function createAddress(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const error = validateAddress(body);
  if (error) return res.status(400).json({ message: error });
  try {
    const address = await prisma.address.create({ data: {
      userId: req.auth!.userId, label: isNonEmptyString(body.label) ? body.label : 'Principal',
      recipient: String(body.recipient).trim(), postalCode: String(body.postalCode).trim(),
      street: String(body.street).trim(), number: String(body.number).trim(),
      complement: isNonEmptyString(body.complement) ? body.complement.trim() : null,
      district: String(body.district).trim(), city: String(body.city).trim(), state: String(body.state).trim().toUpperCase()
    } });
    return res.status(201).json({ address });
  } catch { return res.status(500).json({ message: 'Não foi possível cadastrar o endereço.' }); }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const result = await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.auth!.userId } });
    if (result.count === 0) return res.status(404).json({ message: 'Endereço não encontrado.' });
    return res.status(200).json({ message: 'Endereço removido.' });
  } catch { return res.status(500).json({ message: 'Não foi possível remover o endereço.' }); }
}
