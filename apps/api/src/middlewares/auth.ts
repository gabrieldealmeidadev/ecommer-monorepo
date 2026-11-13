import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

type TokenPayload = { sub: string; role: 'ADMIN' | 'USER' };

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.cookieName] as string | undefined;
  if (!token) return res.status(401).json({ message: 'Autenticação necessária.' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    if (!payload.sub || !payload.role) return res.status(401).json({ message: 'Token inválido.' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
    if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });
    req.auth = { userId: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
