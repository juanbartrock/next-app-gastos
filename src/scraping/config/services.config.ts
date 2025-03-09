/**
 * Configuración de los servicios de scraping
 */

export interface ServiceConfig {
  url: string;
  name: string;
  displayName: string;
  category: string;
  country: string;
  currency: string;
  enabled: boolean;
  scrapingUrls: string[];
  scrapingFrequency: 'daily' | 'weekly' | 'monthly';
}

// Configuraciones para cada servicio que vamos a scrapear
export const serviceConfig: Record<string, ServiceConfig> = {
  netflix: {
    url: 'https://www.netflix.com/ar/',
    name: 'netflix',
    displayName: 'Netflix',
    category: 'streaming',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.netflix.com/ar/browse/plan-selector',
      'https://help.netflix.com/es-es/node/24926'
    ],
    scrapingFrequency: 'weekly'
  },
  spotify: {
    url: 'https://www.spotify.com/ar/',
    name: 'spotify',
    displayName: 'Spotify',
    category: 'streaming',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.spotify.com/ar/premium/',
      'https://www.spotify.com/ar/premium/#plans'
    ],
    scrapingFrequency: 'weekly'
  },
  personal: {
    url: 'https://www.personal.com.ar/',
    name: 'personal',
    displayName: 'Personal',
    category: 'telecom',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.personal.com.ar/planes/movil'
    ],
    scrapingFrequency: 'weekly'
  },
  claro: {
    url: 'https://www.claro.com.ar/',
    name: 'claro',
    displayName: 'Claro',
    category: 'telecom',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://tienda.claro.com.ar/planes/planes-moviles'
    ],
    scrapingFrequency: 'weekly'
  },
  movistar: {
    url: 'https://www.movistar.com.ar/',
    name: 'movistar',
    displayName: 'Movistar',
    category: 'telecom',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.movistar.com.ar/productos-y-servicios/movil/planes'
    ],
    scrapingFrequency: 'weekly'
  },
  directv: {
    url: 'https://www.directv.com.ar/',
    name: 'directv',
    displayName: 'DirecTV',
    category: 'streaming',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.directv.com.ar/paquetes'
    ],
    scrapingFrequency: 'weekly'
  },
  elmejortrato: {
    url: 'https://www.elmejortrato.com.ar/',
    name: 'elmejortrato',
    displayName: 'El Mejor Trato',
    category: 'aggregator',
    country: 'ar',
    currency: 'ARS',
    enabled: true,
    scrapingUrls: [
      'https://www.elmejortrato.com.ar/servicios/internet',
      'https://www.elmejortrato.com.ar/servicios/tv-cable-satelital',
      'https://www.elmejortrato.com.ar/servicios/telefonia',
      'https://www.elmejortrato.com.ar/salud/obras-sociales',
      'https://www.elmejortrato.com.ar/salud/prepagas'
    ],
    scrapingFrequency: 'weekly'
  }
};

// Lista de servicios habilitados
export const enabledServices = Object.keys(serviceConfig).filter(
  key => serviceConfig[key].enabled
);

export default serviceConfig; 