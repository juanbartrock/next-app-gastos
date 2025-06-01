import { PrismaClient } from '@prisma/client'

// Configuración mejorada para manejar conexiones intermitentes de Neon
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: [], // Desactivar logs para evitar spam
    errorFormat: 'minimal',
    datasourceUrl: process.env.DATABASE_URL
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

// Función para conectar con reintentos
async function connectWithRetry(client: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.$connect();
      console.log('✅ Conexión a base de datos establecida');
      return;
    } catch (error) {
      console.log(`❌ Intento ${i + 1}/${maxRetries} falló:`, error);
      if (i === maxRetries - 1) throw error;
      
      // Esperar antes del próximo intento (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

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

// Conectar automáticamente al importar
connectWithRetry(prisma).catch(console.error);

export default prisma 