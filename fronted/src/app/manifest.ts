import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sistema ERP - Carey',
    short_name: 'Carey ERP',
    description: 'Sistema Integral de Gestion y Trazabilidad para Carey',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F7FB',
    theme_color: '#b91c1c',
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  }
}
