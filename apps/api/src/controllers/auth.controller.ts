import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { authService } from '../services/auth.service';
import { isEmail, isNonEmptyString } from '../utils/validation';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
});

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (name.trim().length < 3) return res.status(400).json({ message: 'O nome deve ter pelo menos 3 caracteres.' });
  if (!isEmail(email)) return res.status(400).json({ message: 'Informe um e-mail válido.' });
  if (password.length < 8) return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    const user = await authService.register({ name, email, password });
    return res.status(201).json({ message: 'Cadastro realizado com sucesso.', user });
  } catch {
    return res.status(500).json({ message: 'Não foi possível realizar o cadastro.' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as Record<string, unknown>;
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }
  if (!isEmail(email)) return res.status(400).json({ message: 'Informe um e-mail válido.' });
  try {
    const result = await authService.login(email, password);
    if (!result) return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    res.cookie(env.cookieName, result.token, cookieOptions());
    return res.status(200).json({ message: 'Login realizado com sucesso.', user: result.user });
  } catch {
    return res.status(500).json({ message: 'Não foi possível realizar o login.' });
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.cookieName, { httpOnly: true, secure: env.cookieSecure, sameSite: env.cookieSameSite, path: '/' });
  return res.status(200).json({ message: 'Logout realizado com sucesso.' });
}

export async function me(req: Request, res: Response) {
  if (!req.auth) return res.status(401).json({ message: 'Autenticação necessária.' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: 'Não foi possível consultar o usuário.' });
  }
}
