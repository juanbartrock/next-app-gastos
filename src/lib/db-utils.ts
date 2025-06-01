import prisma from './prisma'

// Función para ejecutar operaciones de base de datos con reintentos
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Intentar la operación
      const result = await operation();
      
      // Si llegamos aquí, la operación fue exitosa
      if (attempt > 1) {
        console.log(`✅ Operación exitosa en el intento ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      console.log(`❌ Intento ${attempt}/${maxRetries} falló:`, error.message);
      
      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Si es un error de conexión, intentar reconectar
      if (isConnectionError(error)) {
        console.log('🔄 Reintentando conexión a base de datos...');
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (reconnectError) {
          console.log('⚠️ Error al reconectar:', reconnectError);
        }
      }
      
      // Esperar antes del próximo intento (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Función para detectar errores de conexión
function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('can\'t reach database server') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection timeout') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('connection lost') ||
    errorCode.includes('p1001') || // Prisma connection error
    errorCode.includes('p1008') || // Operations timed out
    errorCode.includes('p1017')    // Server has closed the connection
  );
}

// Wrapper para operaciones comunes de Prisma
export const db = {
  // Wrapper para findMany con reintentos
  async findMany<T>(model: string, args?: any): Promise<T[]> {
    return executeWithRetry(async () => {
      // @ts-ignore
      return await prisma[model].findMany(args);
    });
  },
  
  // Wrapper para findUnique con reintentos
  async findUnique<T>(model: string, args: any): Promise<T | null> {
    return executeWithRetry(async () => {
      // @ts-ignore
      return await prisma[model].findUnique(args);
    });
  },
  
  // Wrapper para create con reintentos
  async create<T>(model: string, args: any): Promise<T> {
    return executeWithRetry(async () => {
      // @ts-ignore
      return await prisma[model].create(args);
    });
  },
  
  // Wrapper para update con reintentos
  async update<T>(model: string, args: any): Promise<T> {
    return executeWithRetry(async () => {
      // @ts-ignore
      return await prisma[model].update(args);
    });
  },
  
  // Wrapper para delete con reintentos
  async delete<T>(model: string, args: any): Promise<T> {
    return executeWithRetry(async () => {
      // @ts-ignore
      return await prisma[model].delete(args);
    });
  }
};

export default prisma; 