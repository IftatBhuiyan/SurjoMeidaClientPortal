import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { resolveGalleryFromMasterList } from '@/lib/vault-resolver';

interface PageProps {
  searchParams: Promise<{
    vault?: string;
    galleryId?: string;
    pin?: string;
    passcode?: string;
    view?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const vaultId = sp.vault || sp.galleryId;

  if (vaultId) {
    const gallery = resolveGalleryFromMasterList(vaultId);
    if (gallery) {
      const title = `${gallery.title} — ${gallery.clientName}`;
      const description = `Private high-resolution photo & film vault for ${gallery.clientName}. Encrypted client access by Surjo Media.`;
      const coverImage =
        gallery.coverPhotoUrl ||
        `/api/og?title=${encodeURIComponent(gallery.title)}&client=${encodeURIComponent(gallery.clientName)}`;

      return {
        title: `${gallery.title} | Surjo Media Client Archive`,
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: 'Surjo Media — Private Client Vault',
          images: [
            {
              url: coverImage,
              width: 1200,
              height: 630,
              alt: gallery.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [coverImage],
        },
      };
    }
  }

  return {
    title: 'Surjo Media Client Portal',
    description:
      'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
    openGraph: {
      title: 'Surjo Media Client Portal',
      description:
        'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90',
          width: 1200,
          height: 630,
          alt: 'Surjo Media Private Client Portal',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Surjo Media Client Portal',
      description:
        'Private client photo gallery portal for Surjo Media with Google Photos lossless master ingest, password protection, and role-based access control.',
      images: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90',
      ],
    },
  };
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <HomeClient
      initialVaultId={sp.vault || sp.galleryId}
      initialPin={sp.pin}
      initialPasscode={sp.passcode}
    />
  );
}
