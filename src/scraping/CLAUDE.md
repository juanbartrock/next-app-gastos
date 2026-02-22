# src/scraping/ — Motor de Scraping de Promociones

> **Prerequisito**: Lee `src/CLAUDE.md` para la arquitectura general.

## Skills Relevantes
- `architecture-patterns` — Patrones de servicios, abstracción
- `systematic-debugging` — Debugging de scrapers que fallan

## Propósito

Motor de scraping que busca promociones, descuentos y alternativas de servicios para ayudar al usuario a ahorrar. Usa Puppeteer para sitios con JavaScript y Cheerio para HTML estático.

## Estructura

```
scraping/
├── index.ts               # Punto de entrada, coordinator
├── types.ts               # Tipos (Promocion, ServicioAlternativo, ScrapingResult)
├── config/                # Configuración
│   ├── selectors.ts       # Selectores CSS por sitio
│   └── urls.ts            # URLs objetivo
├── lib/                   # Utilidades del scraper
│   ├── browser.ts         # Gestión de Puppeteer browser
│   └── parser.ts          # Parseo de HTML
├── services/              # Scrapers por entidad (18 archivos)
│   ├── telefoniaService.ts
│   ├── internetService.ts
│   ├── streamingService.ts
│   ├── segurosService.ts
│   └── ... (14 más)
└── analysis/              # Análisis de resultados
    ├── comparator.ts      # Comparación con servicios actuales
    ├── scorer.ts          # Scoring de oportunidades
    └── reporter.ts        # Generación de reportes
```

## Patrón de Servicio de Scraping

```typescript
export async function scrapeTelefonia(): Promise<ScrapingResult> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })
    // Extraer datos con selectores
    const data = await page.evaluate(() => { ... })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  } finally {
    await browser.close()
  }
}
```

## Reglas

- ✅ Rate limiting: esperar entre requests
- ✅ Respetar robots.txt
- ✅ Manejo robusto de errores (sitios caídos, cambios de estructura)
- ✅ Guardar resultados con `fechaVencimiento`
- ❌ No hacer scraping en cada request del usuario (cachear resultados)
