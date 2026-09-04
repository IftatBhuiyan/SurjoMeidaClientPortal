import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Surjo Media Client Portal',
  description:
    'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: 'Surjo Media Client Portal',
    description:
      'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90',
        width: 1200,
        height: 630,
        alt: 'Surjo Media Client Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surjo Media Client Portal',
    description:
      'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('surjo_theme_mode');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-[#FAF7F2] dark:bg-[#0C0B0A] text-[#1C1917] dark:text-[#F7F3EC] font-sans antialiased selection:bg-[#C88E3E] selection:text-white w-full max-w-full overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
