import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { slugify } from '../utils/slug';
import { isNonEmptyString } from '../utils/validation';

export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ categories });
  } catch {
    return res.status(500).json({ message: 'Não foi possível listar as categorias.' });
  }
}

export async function createCategory(req: Request, res: Response) {
  const { name } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(name) || name.trim().length < 2) return res.status(400).json({ message: 'Informe um nome com pelo menos 2 caracteres.' });
  try {
    const slug = slugify(name);
    const exists = await prisma.category.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } });
    if (exists) return res.status(409).json({ message: 'Já existe uma categoria com esse nome.' });
    const category = await prisma.category.create({ data: { name: name.trim(), slug } });
    return res.status(201).json({ category });
  } catch {
    return res.status(500).json({ message: 'Não foi possível criar a categoria.' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  const { name } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(name) || name.trim().length < 2) return res.status(400).json({ message: 'Informe um nome válido.' });
  try {
    const exists = await prisma.category.findFirst({ where: { slug: slugify(name), NOT: { id: req.params.id } } });
    if (exists) return res.status(409).json({ message: 'Já existe uma categoria com esse nome.' });
    const category = await prisma.category.update({ where: { id: req.params.id }, data: { name: name.trim(), slug: slugify(name) } });
    return res.status(200).json({ category });
  } catch {
    return res.status(404).json({ message: 'Categoria não encontrada ou não foi possível atualizar.' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Categoria removida com sucesso.' });
  } catch {
    return res.status(404).json({ message: 'Categoria não encontrada.' });
  }
}
