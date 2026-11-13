import { hash, compare } from 'bcryptjs';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';

const hashPassword = (password: string) => hash(password, 12);

export const authService = {
  hashPassword,
  async register(input: { name: string; email: string; password: string; role?: Role }) {
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        ...(input.role ? { role: input.role } : {})
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return user;
  },
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    if (!user || !(await compare(password, user.passwordHash))) return null;
    const token = jwt.sign({ role: user.role }, env.jwtSecret, {
      subject: user.id,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn']
    });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }
};
