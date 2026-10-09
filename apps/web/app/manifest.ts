import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Imivuyo Security Operations',
    short_name: 'Imivuyo Ops',
    description: 'Security operations and attendance for Imivuyo Security & Cleaning Services.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f3f5f2',
    theme_color: '#073b4c',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}