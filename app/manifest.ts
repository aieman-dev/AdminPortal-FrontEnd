import { MetadataRoute } from 'next'
import { APP_NAME } from '@/lib/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "TP Portal",
    description: 'Secure Operational Access for Theme Park Management',
    start_url: '/',
    display: 'standalone', // Hides the browser UI (URL bar, navigation)
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon-app/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-app/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // Note: You can add high-res icons here later
      // { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      // { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}