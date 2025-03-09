import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import priceSearchManager from "@/scraping/services/price-search";
import prisma from "@/lib/prisma";
import { detectProductCategory } from "@/scraping/services/price-search/productCategories";

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

    // Detectar categoría del producto para información
    const productCategory = detectProductCategory(query);
    console.log(`[API] Búsqueda de precio para "${query}" (categoría: ${productCategory})`);

    // Buscar precios
    const result = await priceSearchManager.findBestPrice(
      query,
      parseFloat(currentPrice),
      { exactMatch }
    );

    // Agregar información para el frontend
    return NextResponse.json({
      ...result,
      simulation: true, // Indicar que es una simulación
      message: "Resultados simulados para fines de demostración"
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
      },
      include: {
        gasto: true
      }
    });

    if (productosParaSeguimiento.length === 0) {
      return NextResponse.json({
        message: "No hay productos marcados para seguimiento",
        simulation: true,
        results: []
      });
    }

    console.log(`[API] Buscando mejores precios para ${productosParaSeguimiento.length} productos en seguimiento`);

    // Buscar precios para cada producto
    const resultados = await Promise.all(
      productosParaSeguimiento.map(async (producto: any) => {
        const precioActual = producto.precioUnitario || (producto.subtotal / producto.cantidad);
        const categoria = detectProductCategory(producto.descripcion);
        
        console.log(`[API] Analizando "${producto.descripcion}" (categoría: ${categoria}, precio: ${precioActual})`);
        
        try {
          const resultado = await priceSearchManager.findBestPrice(
            producto.descripcion,
            precioActual,
            { exactMatch: false }
          );

          return {
            producto: {
              id: producto.id,
              descripcion: producto.descripcion,
              precioActual,
              gastoId: producto.gastoId,
              fecha: producto.gasto.fecha,
              categoria: categoria
            },
            resultado: {
              ...resultado,
              simulation: true
            }
          };
        } catch (error) {
          console.error(`[API] Error al buscar precio para "${producto.descripcion}":`, error);
          // Devolver un resultado con error pero no interrumpir toda la búsqueda
          return {
            producto: {
              id: producto.id,
              descripcion: producto.descripcion,
              precioActual,
              gastoId: producto.gastoId,
              fecha: producto.gasto.fecha,
              categoria: categoria
            },
            resultado: {
              foundBetterPrice: false,
              error: true,
              errorMessage: error instanceof Error ? error.message : "Error desconocido",
              simulation: true,
              productCategory: categoria,
              allResults: []
            }
          };
        }
      })
    );

    // Filtrar solo los productos con mejores precios
    const mejoresOfertas = resultados.filter(r => r.resultado.foundBetterPrice);
    const productosConError = resultados.filter(r => r.resultado.error);

    console.log(`[API] Resultados: ${mejoresOfertas.length} ofertas encontradas, ${productosConError.length} errores`);

    return NextResponse.json({
      totalProductos: productosParaSeguimiento.length,
      ofertasEncontradas: mejoresOfertas.length,
      errores: productosConError.length,
      ofertas: mejoresOfertas,
      simulation: true,
      message: "Resultados simulados para fines de demostración"
    });
  } catch (error) {
    console.error("Error al buscar precios de seguimiento:", error);
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud", 
        message: error instanceof Error ? error.message : "Error desconocido",
        simulation: true
      },
      { status: 500 }
    );
  }
} 