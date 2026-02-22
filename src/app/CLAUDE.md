# src/app/ — Páginas y Routing

> **Prerequisito**: Lee `src/CLAUDE.md` para la arquitectura general.

## Skills Relevantes
- `next-best-practices` — Layouts, loading states, error boundaries, caching
- `ui-ux-pro-max` — Responsive design, accesibilidad, interacciones
- `frontend-design` — Estética premium, tipografía, motion

## Mapa de Rutas

### Páginas Públicas
| Ruta | Descripción |
|---|---|
| `/` | Landing / redirect a `/home` si autenticado |
| `/login` | Iniciar sesión (credentials) |
| `/register` | Registro de usuario |

### Páginas Principales
| Ruta | Descripción |
|---|---|
| `/home` | Dashboard resumen ejecutivo (StatCards, Alertas, QuickActions) |
| `/dashboard` | Dashboard con gráficos y widgets financieros |
| `/transacciones` | CRUD completo de gastos e ingresos |
| `/transacciones/nuevo` | Formulario de nueva transacción |
| `/transacciones/[id]/editar` | Edición con selector de gastos recurrentes |
| `/recurrentes` | Gestión de gastos recurrentes |
| `/presupuestos` | Presupuestos con imputaciones |
| `/prestamos` | Préstamos con amortización |
| `/inversiones` | Inversiones con cotizaciones |
| `/grupos` | Gastos grupales |
| `/tareas` | Tareas personales y financieras |

### Páginas de IA y Alertas
| Ruta | Descripción |
|---|---|
| `/ai-financiero` | Centro de IA: patrones, recomendaciones, anomalías |
| `/alertas` | Centro de alertas (Activas, Historial, Configuración) |
| `/financial-advisor` | Asesor financiero IA |
| `/recomendaciones-ahorro` | Recomendaciones de ahorro |

### Páginas de Administración
| Ruta | Descripción |
|---|---|
| `/admin/*` | Panel admin (usuarios, alertas, categorías, auditoría) |
| `/admin-general` | Admin general del sistema |
| `/configuracion` | Configuración de usuario |
| `/perfil` | Perfil de usuario |

### Páginas de Monetización
| Ruta | Descripción |
|---|---|
| `/planes` | Planes de suscripción |
| `/suscripcion/exito` | Pago exitoso (MercadoPago) |
| `/suscripcion/fallo` | Pago fallido |
| `/suscripcion/pendiente` | Pago pendiente |
| `/codigo-promocional` | Códigos promocionales |

### Otras Páginas
| Ruta | Descripción |
|---|---|
| `/voz` | Input por voz |
| `/seguimiento-precios` | Seguimiento de precios |
| `/financiacion` | Financiación de compras |
| `/informes` | Informes financieros |
| `/exportar-datos` | Exportación CSV/Excel |
| `/importar-datos` | Importación de datos |
| `/buzon` | Buzón de mensajes |
| `/beta-feedback` | Formulario feedback beta |

### Páginas de Test (desarrollo)
| Ruta | Función |
|---|---|
| `/test-alertas` | Pruebas del sistema de alertas |
| `/test-limits` | Pruebas de límites de plan |
| `/test-categorias-grupos` | Pruebas de categorías grupales |
| `/prueba-ocr-comprobantes` | Pruebas de OCR |

## Convenciones de Páginas

- Cada `page.tsx` es un Server Component a menos que necesite interactividad
- Usar `loading.tsx` para Suspense boundaries
- Usar `error.tsx` para error boundaries
- El layout principal (`layout.tsx`) ya incluye sidebar, header y providers
- Las páginas de test (`test-*`) no deben existir en producción

## Patrones de Diseño de Páginas

```typescript
// Página típica con datos dinámicos
"use client"
export default function MiPagina() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/mi-recurso')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />
  return <MiComponente data={data} />
}
```

> **Oportunidad de mejora**: Migrar fetching a Server Components donde sea posible para eliminar waterfalls (ver skill `vercel-react-best-practices`).
