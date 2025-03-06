const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, pattern, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern, callback);
    } else if (pattern.test(file)) {
      callback(filePath);
    }
  }
}

// Actualizar importaciones en un archivo
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Reemplazar importación de authOptions
    if (content.includes("import { authOptions } from \"@/app/api/auth/[...nextauth]/route\"")) {
      content = content.replace(
        "import { authOptions } from \"@/app/api/auth/[...nextauth]/route\"",
        "import { options } from \"@/app/api/auth/[...nextauth]/options\""
      );
      updated = true;
    }
    
    // Reemplazar uso de authOptions en getServerSession
    if (content.includes("getServerSession(authOptions)")) {
      content = content.replace(
        /getServerSession\(authOptions\)/g,
        "getServerSession(options)"
      );
      updated = true;
    }
    
    // Guardar archivo si se actualizó
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Actualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
  }
}

// Directorio principal
const srcDir = path.join(__dirname, 'src');

// Buscar archivos .ts y .tsx
findFiles(srcDir, /\.(ts|tsx)$/, updateImports);

console.log('Proceso completado'); 