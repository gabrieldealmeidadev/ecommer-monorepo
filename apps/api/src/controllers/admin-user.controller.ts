import type { Request, Response } from 'express';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authService } from '../services/auth.service';
import { isEmail, isNonEmptyString } from '../utils/validation';

const safeUserFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
} as const;

const errorCode = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.values(Role).includes(value as Role);
}

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: safeUserFields,
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ message: 'Não foi possível listar os usuários.' });
  }
}

export async function createUser(req: Request, res: Response) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Informe os dados do usuário.' });
  }
  const { name, email, password, role } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(name) || name.trim().length < 3) {
    return res.status(400).json({ message: 'O nome deve ter pelo menos 3 caracteres.' });
  }
  if (!isNonEmptyString(email) || !isEmail(email.trim())) {
    return res.status(400).json({ message: 'Informe um e-mail válido.' });
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  if (role !== undefined && !isRole(role)) {
    return res.status(400).json({ message: 'Perfil de usuário inválido.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    const user = await authService.register({
      name,
      email: normalizedEmail,
      password,
      role: role === undefined ? Role.USER : role
    });
    return res.status(201).json({ user });
  } catch (error) {
    if (errorCode(error) === 'P2002') {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }
    return res.status(500).json({ message: 'Não foi possível criar o usuário.' });
  }
}

export async function updateUser(req: Request, res: Response) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Informe os dados para atualizar.' });
  }
  const body = req.body as Record<string, unknown>;
  const data: Prisma.UserUpdateInput = {};
  let emailToCheck: string | undefined;
  let passwordToHash: string | undefined;
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name) || body.name.trim().length < 3) {
      return res.status(400).json({ message: 'O nome deve ter pelo menos 3 caracteres.' });
    }
    data.name = body.name.trim();
  }
  if (body.email !== undefined) {
    if (!isNonEmptyString(body.email) || !isEmail(body.email.trim())) {
      return res.status(400).json({ message: 'Informe um e-mail válido.' });
    }
    emailToCheck = body.email.toLowerCase().trim();
    data.email = emailToCheck;
  }
  if (body.role !== undefined) {
    if (!isRole(body.role)) return res.status(400).json({ message: 'Perfil de usuário inválido.' });
    data.role = body.role;
  }
  if (body.password !== undefined && body.password !== '') {
    if (!isNonEmptyString(body.password) || body.password.length < 8) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
    }
    passwordToHash = body.password;
  }
  if (Object.keys(data).length === 0 && passwordToHash === undefined) {
    return res.status(400).json({ message: 'Informe ao menos um campo para atualizar.' });
  }

  try {
    if (passwordToHash) data.passwordHash = await authService.hashPassword(passwordToHash);
    const currentUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true }
    });
    if (!currentUser) return res.status(404).json({ message: 'Usuário não encontrado.' });
    if (currentUser.id === req.auth!.userId && data.role === Role.USER) {
      return res.status(409).json({ message: 'Não é possível rebaixar o próprio perfil administrativo.' });
    }
    if (emailToCheck) {
      const emailInUse = await prisma.user.findFirst({
        where: { email: emailToCheck, NOT: { id: req.params.id } },
        select: { id: true }
      });
      if (emailInUse) return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }

    const demotingAdmin = currentUser.role === Role.ADMIN && data.role === Role.USER;
    const user = demotingAdmin
      ? await prisma.$transaction(async transaction => {
        const adminCount = await transaction.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) throw new Error('LAST_ADMIN');
        return transaction.user.update({
          where: { id: req.params.id },
          data,
          select: safeUserFields
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      : await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: safeUserFields
      });
    return res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return res.status(409).json({ message: 'Não é possível remover o último administrador.' });
    }
    if (errorCode(error) === 'P2002') {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }
    if (errorCode(error) === 'P2034') {
      return res.status(409).json({ message: 'Houve uma alteração concorrente. Recarregue e tente novamente.' });
    }
    if (errorCode(error) === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    return res.status(500).json({ message: 'Não foi possível atualizar o usuário.' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  if (req.params.id === req.auth!.userId) {
    return res.status(409).json({ message: 'Não é possível excluir a própria conta administrativa.' });
  }

  try {
    await prisma.$transaction(async transaction => {
      const user = await transaction.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, role: true, _count: { select: { orders: true } } }
      });
      if (!user) throw new Error('USER_NOT_FOUND');
      if (user._count.orders > 0) throw new Error('USER_HAS_ORDERS');
      if (user.role === Role.ADMIN) {
        const adminCount = await transaction.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) throw new Error('LAST_ADMIN');
      }
      await transaction.user.delete({ where: { id: user.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    if ((error instanceof Error && error.message === 'USER_NOT_FOUND') || errorCode(error) === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    if (error instanceof Error && error.message === 'USER_HAS_ORDERS') {
      return res.status(409).json({ message: 'Não é possível excluir um usuário com pedidos; o histórico deve ser preservado.' });
    }
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return res.status(409).json({ message: 'Não é possível excluir o último administrador.' });
    }
    if (errorCode(error) === 'P2034') {
      return res.status(409).json({ message: 'Houve uma alteração concorrente. Recarregue e tente novamente.' });
    }
    if (errorCode(error) === 'P2003') {
      return res.status(409).json({ message: 'Não é possível excluir este usuário por causa de dados relacionados.' });
    }
    return res.status(500).json({ message: 'Não foi possível excluir o usuário.' });
  }
}
