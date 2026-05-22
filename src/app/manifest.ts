import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Travel Guide',
    short_name: 'Travel',
    description: 'A personal AI vacation planner for trips, itineraries, budgets, and memories.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f1',
    theme_color: '#31190d',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
