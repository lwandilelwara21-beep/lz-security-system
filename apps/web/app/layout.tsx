import './globals.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { PwaRegister } from './pwa-register';

export const metadata: Metadata = {
  applicationName: 'Imivuyo Security Operations',
  title: 'Imivuyo Security Operations',
  description: 'Professional security operations and workforce attendance for Imivuyo Security & Cleaning Services.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Imivuyo Ops',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#073b4c',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
