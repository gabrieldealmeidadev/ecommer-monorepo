import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: 'Autenticação necessária.' });
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Você não tem permissão para realizar esta ação.' });
    }
    return next();
  };
}
