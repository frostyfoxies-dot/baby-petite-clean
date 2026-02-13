import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { ToastProvider } from '@/components/ui/toast';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { ExitIntentProvider } from '@/components/exit-intent/exit-intent-provider';
import { ChatProvider, LazyLiveChat } from '@/components/chat';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Kids Petite - Curated Style for Little Ones',
    template: '%s | Kids Petite',
  },
  description: 'Discover curated children\'s clothing at Kids Petite. High-quality, adorable pieces for every occasion. Shop our collection of baby and kids fashion.',
  keywords: ['kids clothing', 'baby clothes', 'children fashion', 'kids boutique', 'baby registry'],
  authors: [{ name: 'Kids Petite' }],
  creator: 'Kids Petite',
  publisher: 'Kids Petite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kidspetite.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kidspetite.com',
    siteName: 'Kids Petite',
    title: 'Kids Petite - Curated Style for Little Ones',
    description: 'Discover curated children\'s clothing at Kids Petite. High-quality, adorable pieces for every occasion.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kids Petite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kids Petite - Curated Style for Little Ones',
    description: 'Discover curated children\'s clothing at Kids Petite.',
    images: ['/og-image.jpg'],
    creator: '@kidspetite',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kidspetite.com';
  
  // Organization and WebSite JSON-LD schema for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kids Petite',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://instagram.com/kidspetite',
      'https://facebook.com/kidspetite',
      'https://twitter.com/kidspetite',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kids Petite',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-4 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ExitIntentProvider
          variant="discount"
          discountPercent={10}
          disabledRoutes={['/checkout/*', '/auth/*', '/account/*']}
          onEmailSubmit={async (email) => {
            // This would typically call a newsletter subscription API
            console.log('Exit intent email capture:', email);
          }}
        >
          <ToastProvider>
            <ChatProvider>
              <div className="flex flex-col min-h-screen">
                <Header
                  logo="Kids Petite"
                  navLinks={[
                    { label: 'Shop', href: '/products' },
                    { label: 'Categories', href: '/category' },
                    { label: 'Collections', href: '/collection' },
                    { label: 'Registry', href: '/registry' },
                    { label: 'About', href: '/about' },
                  ]}
                  onSearch={(query) => {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }}
                  onCartClick={() => {
                    // Cart drawer will be controlled by state
                  }}
                  onWishlistClick={() => {
                    window.location.href = '/account/wishlist';
                  }}
                  onUserClick={() => {
                    window.location.href = '/account';
                  }}
                />
                <main id="main-content" className="flex-1 pb-16 md:pb-0">
                  {children}
                </main>
                <Footer
                  logo="Kids Petite"
                  linkGroups={[
                    {
                      title: 'Shop',
                      links: [
                        { label: 'All Products', href: '/products' },
                        { label: 'New Arrivals', href: '/products?sort=newest' },
                        { label: 'Best Sellers', href: '/products?sort=popular' },
                        { label: 'Sale', href: '/products?filter=sale' },
                      ],
                    },
                    {
                      title: 'Categories',
                      links: [
                        { label: 'Baby', href: '/category/baby' },
                        { label: 'Toddler', href: '/category/toddler' },
                        { label: 'Kids', href: '/category/kids' },
                        { label: 'Accessories', href: '/category/accessories' },
                      ],
                    },
                    {
                      title: 'Support',
                      links: [
                        { label: 'Contact Us', href: '/contact' },
                        { label: 'FAQ', href: '/faq' },
                        { label: 'Shipping', href: '/shipping' },
                        { label: 'Returns', href: '/returns' },
                      ],
                    },
                  ]}
                  socialLinks={[
                    { platform: 'instagram', href: 'https://instagram.com/kidspetite', label: 'Instagram' },
                    { platform: 'facebook', href: 'https://facebook.com/kidspetite', label: 'Facebook' },
                    { platform: 'twitter', href: 'https://twitter.com/kidspetite', label: 'Twitter' },
                  ]}
                />
              </div>
              <CartDrawer />
              {/* Mobile Bottom Navigation - visible only on mobile */}
              <MobileBottomNav />
              {/* Live Chat Widget - lazy loaded for performance */}
              <LazyLiveChat />
            </ChatProvider>
          </ToastProvider>
        </ExitIntentProvider>
      </body>
    </html>
  );
}
