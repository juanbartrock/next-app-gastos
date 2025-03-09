/**
 * Categorización de productos para mejorar la simulación de búsqueda de precios
 */

// Categorías principales de productos
export enum ProductCategory {
  ALIMENTOS = 'alimentos',
  BEBIDAS = 'bebidas',
  LIMPIEZA = 'limpieza',
  ELECTRODOMESTICOS = 'electrodomesticos',
  TECNOLOGIA = 'tecnologia',
  HOGAR = 'hogar',
  CUIDADO_PERSONAL = 'cuidado_personal',
  ROPA = 'ropa',
  OTROS = 'otros'
}

// Interfaz para tiendas con sus categorías soportadas
export interface StoreInfo {
  name: string;
  categories: ProductCategory[];
  baseUrl: string;
  priceMultiplier?: number; // Factor para simular precios más altos o bajos
}

// Mapeo de tiendas a sus categorías soportadas
export const stores: Record<string, StoreInfo> = {
  'Carrefour': {
    name: 'Carrefour',
    categories: [
      ProductCategory.ALIMENTOS, 
      ProductCategory.BEBIDAS, 
      ProductCategory.LIMPIEZA,
      ProductCategory.ELECTRODOMESTICOS,
      ProductCategory.HOGAR,
      ProductCategory.CUIDADO_PERSONAL
    ],
    baseUrl: 'https://www.carrefour.com.ar/search?q=',
    priceMultiplier: 1.0
  },
  'Coto': {
    name: 'Coto',
    categories: [
      ProductCategory.ALIMENTOS, 
      ProductCategory.BEBIDAS, 
      ProductCategory.LIMPIEZA,
      ProductCategory.HOGAR,
      ProductCategory.CUIDADO_PERSONAL
    ],
    baseUrl: 'https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt=',
    priceMultiplier: 0.98
  },
  'Día': {
    name: 'Día',
    categories: [
      ProductCategory.ALIMENTOS, 
      ProductCategory.BEBIDAS, 
      ProductCategory.LIMPIEZA
    ],
    baseUrl: 'https://diaonline.supermercadosdia.com.ar/search?q=',
    priceMultiplier: 0.95
  },
  'Frávega': {
    name: 'Frávega',
    categories: [
      ProductCategory.ELECTRODOMESTICOS, 
      ProductCategory.TECNOLOGIA
    ],
    baseUrl: 'https://www.fravega.com/search?q=',
    priceMultiplier: 1.05
  },
  'Garbarino': {
    name: 'Garbarino',
    categories: [
      ProductCategory.ELECTRODOMESTICOS, 
      ProductCategory.TECNOLOGIA
    ],
    baseUrl: 'https://www.garbarino.com/search?q=',
    priceMultiplier: 1.08
  },
  'Mercado Libre': {
    name: 'Mercado Libre',
    categories: [
      ProductCategory.ALIMENTOS, 
      ProductCategory.BEBIDAS, 
      ProductCategory.LIMPIEZA,
      ProductCategory.ELECTRODOMESTICOS,
      ProductCategory.TECNOLOGIA,
      ProductCategory.HOGAR,
      ProductCategory.CUIDADO_PERSONAL,
      ProductCategory.ROPA,
      ProductCategory.OTROS
    ],
    baseUrl: 'https://listado.mercadolibre.com.ar/',
    priceMultiplier: 1.0
  },
  'Disco': {
    name: 'Disco',
    categories: [
      ProductCategory.ALIMENTOS, 
      ProductCategory.BEBIDAS, 
      ProductCategory.LIMPIEZA,
      ProductCategory.CUIDADO_PERSONAL
    ],
    baseUrl: 'https://www.disco.com.ar/search?q=',
    priceMultiplier: 1.03
  },
  'Musimundo': {
    name: 'Musimundo',
    categories: [
      ProductCategory.ELECTRODOMESTICOS, 
      ProductCategory.TECNOLOGIA,
      ProductCategory.HOGAR
    ],
    baseUrl: 'https://www.musimundo.com/search/?text=',
    priceMultiplier: 1.06
  },
};

// Patrones para detectar categorías basados en el nombre del producto
export const categoryPatterns: Array<{ pattern: RegExp; category: ProductCategory }> = [
  // Alimentos
  { pattern: /leche|yogur|queso|manteca|dulce de leche|serenito|danonino|postre|flan|helado|crema/i, category: ProductCategory.ALIMENTOS },
  { pattern: /pan|galletitas|galletas|arroz|fideos|pastas|salsa|aceite|vinagre|mayonesa|ketchup|mostaza/i, category: ProductCategory.ALIMENTOS },
  { pattern: /carne|pollo|pescado|hamburguesa|milanesa|nugget|salchicha|jamón|salame|mortadela/i, category: ProductCategory.ALIMENTOS },
  { pattern: /fruta|verdura|papa|cebolla|tomate|lechuga|zanahoria|manzana|banana|naranja/i, category: ProductCategory.ALIMENTOS },
  { pattern: /cereal|avena|granola|barra|chocolate|caramelo|golosina|alfajor|dulce|mermelada|azúcar/i, category: ProductCategory.ALIMENTOS },
  
  // Bebidas
  { pattern: /agua|gaseosa|jugo|refresco|cerveza|vino|whisky|vodka|gin|ron|fernet|aperitivo|bebida/i, category: ProductCategory.BEBIDAS },
  { pattern: /coca|sprite|fanta|pepsi|seven|pritty|paso de los toros|schweppes|energizante|energética/i, category: ProductCategory.BEBIDAS },
  { pattern: /café|te|mate|yerba|jugo/i, category: ProductCategory.BEBIDAS },
  
  // Limpieza
  { pattern: /detergente|jabón|lavandina|desinfectante|limpiador|trapo|esponja|escoba|balde|cepillo/i, category: ProductCategory.LIMPIEZA },
  { pattern: /servilleta|papel|toalla|higiénico|pañuelo|bolsa de residuo|limpia|desodorante de ambiente/i, category: ProductCategory.LIMPIEZA },
  
  // Electrodomésticos
  { pattern: /heladera|freezer|microondas|horno|cocina|anafe|lavarropas|secadora|lavavajillas/i, category: ProductCategory.ELECTRODOMESTICOS },
  { pattern: /licuadora|batidora|mixer|procesadora|cafetera|tostadora|pava|plancha|aspiradora/i, category: ProductCategory.ELECTRODOMESTICOS },
  { pattern: /ventilador|aire acondicionado|calefactor|estufa|radiador|termotanque|calefón/i, category: ProductCategory.ELECTRODOMESTICOS },
  
  // Tecnología
  { pattern: /celular|smartphone|teléfono|tablet|ipad|notebook|laptop|pc|computadora|monitor/i, category: ProductCategory.TECNOLOGIA },
  { pattern: /teclado|mouse|cámara|impresora|escáner|parlante|altavoz|auricular|headset|hdmi/i, category: ProductCategory.TECNOLOGIA },
  { pattern: /pendrive|disco|ssd|memoria|ram|usb|cable|cargador|batería|power bank/i, category: ProductCategory.TECNOLOGIA },
  { pattern: /tv|televisor|televisión|smart|led|oled|qled|consola|playstation|xbox|nintendo/i, category: ProductCategory.TECNOLOGIA },
  
  // Hogar
  { pattern: /silla|mesa|sillón|sofá|mueble|cama|colchón|almohada|frazada|acolchado|cortina/i, category: ProductCategory.HOGAR },
  { pattern: /plato|vaso|taza|cubierto|olla|sartén|fuente|bandeja|termo|mate|bombilla/i, category: ProductCategory.HOGAR },
  { pattern: /lámpara|luz|foco|led|aplique|colgante|espejo|cuadro|alfombra|tapete|mantel/i, category: ProductCategory.HOGAR },
  
  // Cuidado personal
  { pattern: /shampoo|acondicionador|crema|loción|perfume|colonia|desodorante|antitranspirante/i, category: ProductCategory.CUIDADO_PERSONAL },
  { pattern: /pasta dental|cepillo|dental|hilo dental|enjuague|bucal|jabón|gel de ducha|esponja/i, category: ProductCategory.CUIDADO_PERSONAL },
  { pattern: /maquinita|afeitadora|máquina de afeitar|gillette|prestobarba|espuma|crema de afeitar/i, category: ProductCategory.CUIDADO_PERSONAL },
  { pattern: /maquillaje|labial|lápiz|rimmel|base|rubor|sombra|corrector|toallita|algodón/i, category: ProductCategory.CUIDADO_PERSONAL },
  
  // Ropa
  { pattern: /remera|camisa|pantalón|jean|pollera|falda|vestido|campera|buzo|sweater|pullover/i, category: ProductCategory.ROPA },
  { pattern: /medias|ropa interior|bombacha|calzón|calzoncillo|corpiño|brassier|sujetador/i, category: ProductCategory.ROPA },
  { pattern: /zapatilla|zapato|bota|sandalia|calzado|mocasín|alpargata|ojotas|havaianas/i, category: ProductCategory.ROPA },
];

/**
 * Detecta la categoría más probable de un producto basado en su descripción
 */
export function detectProductCategory(productName: string): ProductCategory {
  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(productName)) {
      return category;
    }
  }
  return ProductCategory.OTROS;
}

/**
 * Obtiene tiendas compatibles con una categoría de producto
 */
export function getStoresForCategory(category: ProductCategory): StoreInfo[] {
  return Object.values(stores).filter(store => 
    store.categories.includes(category)
  );
}

/**
 * Genera una URL real para un producto en una tienda específica
 */
export function generateProductUrl(productName: string, store: StoreInfo): string {
  const encodedQuery = encodeURIComponent(productName);
  return `${store.baseUrl}${encodedQuery}`;
}

/**
 * Simula un precio realista para un producto teniendo en cuenta su tienda
 */
export function simulatePrice(basePrice: number, store: StoreInfo): number {
  const multiplier = store.priceMultiplier || 1;
  // Añadir algo de variación aleatoria (±10%)
  const randomFactor = 0.9 + (Math.random() * 0.2);
  return basePrice * multiplier * randomFactor;
} 