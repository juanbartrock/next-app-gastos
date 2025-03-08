const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertarGrupo() {
  console.log('=== SCRIPT: INSERTAR GRUPO ===');
  
  try {
    // Obtener usuario existente
    const usuario = await prisma.user.findFirst();
    if (!usuario) {
      console.error('No se encontró ningún usuario');
      return;
    }
    console.log(`Usuario encontrado: ${usuario.name} (${usuario.id})`);
    
    // Crear el grupo según el modelo exacto
    console.log('Creando grupo...');
    const grupo = await prisma.grupo.create({
      data: {
        nombre: "Grupo Test",
        descripcion: "Grupo de prueba",
        // Relación admin - obligatoria
        admin: {
          connect: {
            id: usuario.id
          }
        }
        // Los campos id, createdAt y updatedAt se generan automáticamente
      }
    });
    
    console.log(`✅ Grupo creado exitosamente: ${grupo.nombre} (ID: ${grupo.id})`);
    
    // Ahora crear un GrupoMiembro para añadir al usuario como miembro
    console.log('Añadiendo usuario como miembro al grupo...');
    
    const grupoMiembro = await prisma.grupoMiembro.create({
      data: {
        rol: "miembro", // Valor por defecto pero lo explicitamos
        // Relaciones
        grupo: {
          connect: {
            id: grupo.id
          }
        },
        user: {
          connect: {
            id: usuario.id
          }
        }
        // Los campos id y createdAt se generan automáticamente
      }
    });
    
    console.log(`✅ Usuario añadido como miembro al grupo: ${grupoMiembro.id}`);
    
  } catch (error) {
    console.error('❌ Error durante la inserción:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('=== SCRIPT FINALIZADO ===');
  }
}

insertarGrupo(); 