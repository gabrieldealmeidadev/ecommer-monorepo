import { PrismaClient } from '@prisma/client';

declare global {
  // Evita múltiplas instâncias durante hot reload em desenvolvimento.
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined;
}

export const prisma = globalThis.prismaInstance || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prismaInstance = prisma;
