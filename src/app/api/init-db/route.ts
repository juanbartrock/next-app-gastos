import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/dbSetup";

// Endpoint para inicializar la base de datos
export async function GET() {
  try {
    console.log("Iniciando configuración de la base de datos desde API");
    
    // Llamar a la función de inicialización
    await initializeDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: "Base de datos inicializada correctamente" 
    });
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error al inicializar la base de datos", 
        error: String(error) 
      },
      { status: 500 }
    );
  }
} 