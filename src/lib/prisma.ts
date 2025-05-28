import { PrismaClient } from '@prisma/client'

// Añadir manejo global de errores y configuración de log
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: [], // Desactivar TODOS los logs de Prisma
    errorFormat: 'minimal',
  });
  
  // Crear un proxy que permita acceder a modelos que no sean reconocidos por TypeScript
  return new Proxy(client, {
    get(target, prop) {
      // Si es una propiedad conocida del cliente, devuélvela
      if (prop in target) return target[prop as keyof typeof target];
      
      // Para gastoDetalle y GastoDetalle, usar la versión correcta del modelo
      if (prop === 'gastoDetalle' || prop === 'GastoDetalle') {
        console.log(`Accediendo a modelo ${String(prop)} (normalizado a "gastoDetalle")`);
        // @ts-ignore - Permitir acceder al modelo aunque TypeScript no lo reconozca
        return target['gastoDetalle'] || target['$queryRaw'];
      }
      
      // Para otras propiedades, intentar acceder como están
      // @ts-ignore - Permitir acceder a propiedades que TypeScript no reconoce
      return target[prop];
    }
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