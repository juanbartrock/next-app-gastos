import { PrismaClient } from '@prisma/client'

// Añadir manejo global de errores y configuración de log
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Declaración para TypeScript
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Variables para el manejo global de la instancia
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Crear o reutilizar la instancia existente
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// En desarrollo, usar la variable global para evitar múltiples instancias
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma 