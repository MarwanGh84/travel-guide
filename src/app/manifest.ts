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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
    ],
  }
}
