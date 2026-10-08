import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LZ Security Operations',
  description: 'Security operations management and attendance platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
