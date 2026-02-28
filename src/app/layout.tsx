import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/navigation/header';
import { Footer } from '@/components/navigation/footer';
import { Analytics } from '@/components/analytics/analytics';
import './globals.css';

const adsensePubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: 'Global Civic Development Tracker',
    template: '%s | Civic Dev Tracker',
  },
  description:
    'Track building permits, zoning changes, and development activity across major cities worldwide.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://civictracker.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {adsensePubId && (
        <head>
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePubId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        </head>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Analytics />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1 scroll-mt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
