import prisma from '@/lib/prisma';

// Verificar que el usuario sea administrador
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });
    
    return user?.isAdmin || false;
  } catch (error) {
    console.error('Error al verificar admin:', error);
    return false;
  }
} 