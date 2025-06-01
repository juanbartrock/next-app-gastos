import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import priceSearchManager from "@/scraping/services/price-search";
import ratoneandoService from "@/scraping/services/ratoneando";
import prisma from "@/lib/prisma";
import { detectProductCategory } from "@/scraping/services/price-search/productCategories";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

/**
 * Guarda los resultados de la búsqueda en un archivo de log
 * @param queryInfo Información de la consulta
 * @param results Resultados obtenidos
 */
async function logSearchResults(queryInfo: any, results: any) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const logData = {
      timestamp: new Date().toISOString(),
      query: queryInfo,
      results
    };
    
    // Solo en modo desarrollo
    if (process.env.NODE_ENV === "development") {
      const logDir = path.join(process.cwd(), 'logs');
      const logPath = path.join(logDir, `search-${timestamp}.json`);
      
      // Asegurar que el directorio exista
      try {
        // Verificar si el directorio existe, y crearlo si no
        if (!fs.existsSync(logDir)) {
          await mkdir(logDir, { recursive: true });
          console.log(`[API] Directorio de logs creado: ${logDir}`);
        }
        
        await writeFile(logPath, JSON.stringify(logData, null, 2));
        console.log(`[API] Resultados guardados en ${logPath}`);
      } catch (error) {
        console.error("[API] Error al guardar log:", error);
      }
    }
    
    // Siempre registrar en la consola
    console.log(`[API] Búsqueda: "${queryInfo.query}" (${queryInfo.optimizedQuery})`);
    console.log(`[API] Resultados: ${results.length} productos encontrados`);
    
    if (results.length > 0) {
      // Registrar información detallada de los primeros 3 resultados
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`[API] Resultado #${index + 1}: "${result.productName}" - Precio: ${result.price} (${result.store})`);
      });
    }
  } catch (error) {
    console.error("[API] Error al registrar resultados:", error);
  }
}

/**
 * Comprobar si un producto está habilitado para la búsqueda de precios
 * @param query Consulta de búsqueda
 * @returns true si el producto está habilitado
 */
function isEnabledProduct(query: string): boolean {
  // Permitir todos los productos para búsqueda de precios
  return !!(query && query.trim().length > 2); // Solo requiere que tenga al menos 3 caracteres
}

/**
 * Endpoint para buscar precios de productos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options);
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de la solicitud
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const currentPrice = searchParams.get("currentPrice");
    const exactMatch = searchParams.get("exactMatch") === "true";
    
    // Validar parámetros
    if (!query) {
      return NextResponse.json(
        { error: "El parámetro 'query' es requerido" },
        { status: 400 }
      );
    }

    if (!currentPrice || isNaN(parseFloat(currentPrice))) {
      return NextResponse.json(
        { error: "El parámetro 'currentPrice' es requerido y debe ser un número" },
        { status: 400 }
      );
    }

    // Verificar si el producto está habilitado para búsqueda
    if (!isEnabledProduct(query)) {
      return NextResponse.json({
        foundBetterPrice: false,
        message: "Este producto no está habilitado para búsqueda de precios todavía",
        productCategory: detectProductCategory(query),
        allResults: []
      });
    }

    // Detectar categoría del producto para información
    const productCategory = detectProductCategory(query);
    console.log(`[API] Búsqueda de precio para "${query}" (categoría: ${productCategory})`);

    // SIMPLIFICACIÓN: Usar directamente el término SERENITO para todos los productos
    const searchTerm = "SERENITO";
    console.log(`[API] Usando término de búsqueda simplificado: "${searchTerm}"`);
    
    // Ejecutar búsqueda en Ratoneando con el término simplificado
    const startTime = Date.now();
    const searchResults = await ratoneandoService.search(searchTerm, { exactMatch: false });
    const searchDuration = Date.now() - startTime;
    console.log(`[API] Búsqueda completada en ${searchDuration}ms`);
    
    // Registrar resultados
    await logSearchResults(
      { 
        query, 
        optimizedQuery: searchTerm,
        currentPrice,
        category: productCategory,
        exactMatch,
        duration: searchDuration
      }, 
      searchResults
    );
    
    // Procesar los resultados 
    if (searchResults.length > 0) {
      // Ordenar por precio (menor a mayor) para asegurar el mejor precio primero
      const sortedResults = [...searchResults].sort((a, b) => a.price - b.price);
      
      // NUEVO: Limitar a los 3 precios más bajos
      const top3Results = sortedResults.slice(0, 3);
      console.log(`[API] Limitando resultados a los 3 precios más bajos (de ${sortedResults.length} encontrados)`);
      
      const currentPriceNum = parseFloat(currentPrice);
      const bestResult = top3Results[0]; // Mejor resultado (precio más bajo)
      const foundBetterPrice = bestResult.price < currentPriceNum;
      
      if (foundBetterPrice) {
        console.log(`[API] ¡Mejor precio encontrado! ${bestResult.price} vs ${currentPriceNum} (Ahorro: ${(currentPriceNum - bestResult.price).toFixed(2)})`);
      } else {
        console.log(`[API] No se encontró un mejor precio. Mejor oferta: ${bestResult.price} vs precio actual: ${currentPriceNum}`);
      }
      
      return NextResponse.json({
        foundBetterPrice,
        bestPrice: bestResult.price,
        saving: foundBetterPrice ? currentPriceNum - bestResult.price : undefined,
        savingPercentage: foundBetterPrice 
          ? Math.round(((currentPriceNum - bestResult.price) / currentPriceNum) * 100) 
          : undefined,
        store: bestResult.store,
        url: bestResult.url,
        productCategory,
        // Incluir solo los 3 mejores resultados para que la interfaz los muestre
        allResults: [{ 
          service: 'ratoneando', 
          results: top3Results, 
          count: searchResults.length,
          searchTerm
        }]
      });
    }
    
    // Si no se encontraron resultados
    console.log(`[API] No se encontraron resultados para "${searchTerm}"`);
    return NextResponse.json({
      foundBetterPrice: false,
      message: `No se encontraron resultados para SERENITO`,
      productCategory,
      allResults: []
    });
  } catch (error) {
    console.error("Error al buscar precios:", error);
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para buscar precios de productos marcados para seguimiento
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options);
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email || "" }
    });
    
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener productos marcados para seguimiento
    const productosParaSeguimiento = await prisma.gastoDetalle.findMany({
      where: {
        seguimiento: true,
        gasto: {
          userId: usuario.id
        }
        // Permitir todos los productos marcados para seguimiento
      },
      include: {
        gasto: true
      }
    });

    if (productosParaSeguimiento.length === 0) {
      return NextResponse.json({
        message: "No hay productos marcados para seguimiento",
        results: [],
        stats: {
          totalProductos: 0,
          busquedasRealizadas: 0,
          alternativasUsadas: 0,
          resultadosEncontrados: 0,
          mejoresPrecios: 0,
          errores: 0,
          totalTime: 0
        }
      });
    }

    console.log(`[API] Buscando mejores precios para ${productosParaSeguimiento.length} productos marcados para seguimiento`);

    // Estadísticas generales para el log
    const startTime = Date.now();
    const searchStats = {
      totalProductos: productosParaSeguimiento.length,
      resultadosEncontrados: 0,
      busquedasRealizadas: 0,
      alternativasUsadas: 0,
      mejoresPrecios: 0,
      errores: 0
    };

    // Procesamiento de productos individuales
    const resultados = await Promise.all(
      productosParaSeguimiento.map(async (producto: any) => {
        const precioActual = producto.precioUnitario || (producto.subtotal / producto.cantidad);
        const categoria = detectProductCategory(producto.descripcion);
        
        console.log(`[API] Analizando "${producto.descripcion}" (categoría: ${categoria}, precio: ${precioActual})`);
        
        try {
          // Buscar específicamente este producto
          searchStats.busquedasRealizadas++;
          
          const searchResults = await ratoneandoService.search(
            producto.descripcion,
            { exactMatch: false }
          );
          
          // Registrar resultados para este producto
          await logSearchResults(
            { 
              query: producto.descripcion,
              optimizedQuery: producto.descripcion,
              precioActual,
              categoria
            }, 
            searchResults
          );
          
          // Actualizar estadísticas
          searchStats.resultadosEncontrados += searchResults.length;
          
          if (searchResults.length > 0) {
            // Ordenar por precio (menor a mayor)
            const sortedResults = [...searchResults].sort((a, b) => a.price - b.price);
            
            // Limitar a los 3 mejores precios
            const top3Results = sortedResults.slice(0, 3);
            const bestResult = top3Results[0];
            const foundBetterPrice = bestResult.price < precioActual;
            
            if (foundBetterPrice) {
              searchStats.mejoresPrecios++;
              console.log(`[API] ¡Mejor precio encontrado para "${producto.descripcion}"! ${bestResult.price} vs ${precioActual} (Ahorro: ${(precioActual - bestResult.price).toFixed(2)})`);
            }
            
            return {
              producto: {
                id: producto.id,
                descripcion: producto.descripcion,
                precioActual,
                gastoId: producto.gastoId,
                fecha: producto.gasto.fecha,
                categoria
              },
              resultado: {
                foundBetterPrice,
                bestPrice: bestResult.price,
                saving: foundBetterPrice ? precioActual - bestResult.price : undefined,
                savingPercentage: foundBetterPrice 
                  ? Math.round(((precioActual - bestResult.price) / precioActual) * 100) 
                  : undefined,
                store: bestResult.store,
                url: bestResult.url,
                productCategory: categoria,
                allResults: [{ 
                  service: 'ratoneando', 
                  results: top3Results,
                  count: searchResults.length,
                  searchTerm: producto.descripcion
                }]
              }
            };
          } else {
            // Si no hay resultados para este producto
            return {
              producto: {
                id: producto.id,
                descripcion: producto.descripcion,
                precioActual,
                gastoId: producto.gastoId,
                fecha: producto.gasto.fecha,
                categoria
              },
              resultado: {
                foundBetterPrice: false,
                message: `No se encontraron resultados para "${producto.descripcion}"`,
                productCategory: categoria,
                allResults: []
              }
            };
          }
        } catch (error) {
          searchStats.errores++;
          console.error(`[API] Error procesando producto "${producto.descripcion}":`, error);
          
          return {
            producto: {
              id: producto.id,
              descripcion: producto.descripcion,
              precioActual,
              gastoId: producto.gastoId,
              fecha: producto.gasto.fecha,
              categoria
            },
            resultado: {
              error: true,
              message: error instanceof Error ? error.message : "Error desconocido",
              productCategory: categoria,
              allResults: []
            }
          };
        }
      })
    );

    // Calcular tiempo total
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Actualizar y mostrar estadísticas finales
    console.log(`[API] Resumen de búsqueda de precios:
  - Total productos: ${searchStats.totalProductos}
  - Búsquedas realizadas: ${searchStats.busquedasRealizadas}
  - Alternativas usadas: ${searchStats.alternativasUsadas}
  - Resultados encontrados: ${searchStats.resultadosEncontrados}
  - Mejores precios: ${searchStats.mejoresPrecios}
  - Errores: ${searchStats.errores}
  - Tiempo total: ${totalTime}ms`);

    // Responder con resultados
    return NextResponse.json({
      results: resultados,
      stats: {
        ...searchStats,
        totalTime
      }
    });
  } catch (error) {
    console.error("Error al buscar precios:", error);
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud",
        message: error instanceof Error ? error.message : "Error desconocido" 
      },
      { status: 500 }
    );
  }
} 