import type { Request, Response } from 'express';
import { ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { slugify } from '../utils/slug';
import { isNonEmptyString, parsePage } from '../utils/validation';

export async function listProducts(req: Request, res: Response) {
  const page = parsePage(req.query.page);
  const limitRaw = Number(req.query.limit || 12);
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  try {
    const where = { status: ProductStatus.ACTIVE, ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}), ...(categoryId ? { categoryId } : {}) };
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.product.count({ where })
    ]);
    return res.status(200).json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: 'Não foi possível listar os produtos.' });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }], status: ProductStatus.ACTIVE }, include: { category: true } });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    return res.status(200).json({ product });
  } catch {
    return res.status(500).json({ message: 'Não foi possível consultar o produto.' });
  }
}

export async function createProduct(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const { name, description, priceCents, stock, categoryId, imageUrl, status } = body;
  if (!isNonEmptyString(name) || name.trim().length < 2) return res.status(400).json({ message: 'Nome do produto inválido.' });
  if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents < 1) return res.status(400).json({ message: 'priceCents deve ser um inteiro maior que zero.' });
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) return res.status(400).json({ message: 'Estoque inválido.' });
  if (description !== undefined && typeof description !== 'string') return res.status(400).json({ message: 'Descrição inválida.' });
  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') return res.status(400).json({ message: 'URL da imagem inválida.' });
  if (categoryId !== undefined && categoryId !== null && typeof categoryId !== 'string') return res.status(400).json({ message: 'Categoria inválida.' });
  const productStatus = status === 'ACTIVE' ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
  try {
    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const product = await prisma.product.create({ data: {
      name: name.trim(), slug, description: typeof description === 'string' ? description : '',
      priceCents, stock, categoryId: typeof categoryId === 'string' ? categoryId : null,
      imageUrl: typeof imageUrl === 'string' ? imageUrl : null, status: productStatus
    }, include: { category: true } });
    return res.status(201).json({ product });
  } catch {
    return res.status(400).json({ message: 'Não foi possível criar o produto. Confira a categoria informada.' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) return res.status(400).json({ message: 'Nome inválido.' });
    data.name = body.name.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return res.status(400).json({ message: 'Descrição inválida.' });
    data.description = body.description;
  }
  if (body.priceCents !== undefined) {
    if (typeof body.priceCents !== 'number' || !Number.isInteger(body.priceCents) || body.priceCents < 1) return res.status(400).json({ message: 'Preço inválido.' });
    data.priceCents = body.priceCents;
  }
  if (body.stock !== undefined) {
    if (typeof body.stock !== 'number' || !Number.isInteger(body.stock) || body.stock < 0) return res.status(400).json({ message: 'Estoque inválido.' });
    data.stock = body.stock;
  }
  if (body.categoryId !== undefined) data.categoryId = body.categoryId === null ? null : String(body.categoryId);
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl === null ? null : String(body.imageUrl);
  if (body.status !== undefined) {
    if (!Object.values(ProductStatus).includes(body.status as ProductStatus)) return res.status(400).json({ message: 'Status inválido.' });
    data.status = body.status;
  }
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: data as never, include: { category: true } });
    return res.status(200).json({ product });
  } catch {
    return res.status(404).json({ message: 'Produto não encontrado ou categoria inválida.' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { status: ProductStatus.ARCHIVED } });
    return res.status(200).json({ message: 'Produto arquivado com sucesso.' });
  } catch {
    return res.status(404).json({ message: 'Produto não encontrado.' });
  }
}
