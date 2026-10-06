import type { Metadata } from 'next';
import CardLoaderOverlay from '@/components/CardLoaderOverlay';
import LegacyScripts from '@/components/LegacyScripts';
import './globals.css';

export const metadata: Metadata = {
  title: "Gp Card's",
  description: 'Create and share celebration cards',
  icons: {
    icon: '/assets/image/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css" crossOrigin="anonymous" />
      </head>
      <body>
        <LegacyScripts />
        <CardLoaderOverlay />
        {children}
      </body>
    </html>
  );
}
