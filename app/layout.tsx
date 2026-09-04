import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Surjo Media Client Portal',
  description: 'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
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
    description: 'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surjo Media Client Portal',
    description: 'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,300;0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAF7F2] dark:bg-[#0C0B0A] text-[#1C1917] dark:text-[#F7F3EC] font-sans antialiased selection:bg-[#C88E3E] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
