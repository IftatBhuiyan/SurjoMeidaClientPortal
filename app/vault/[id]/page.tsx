import type { Metadata } from 'next';
import { resolveGalleryFromMasterList } from '@/lib/vault-resolver';
import { getServerGallery } from '@/lib/server-vault-store';
import VaultClientPage from '@/components/VaultClientPage';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pin?: string; passcode?: string; role?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const gallery = (await getServerGallery(id)) || resolveGalleryFromMasterList(id);

  if (!gallery) {
    return {
      title: 'Private Client Vault | Surjo Media',
      description: 'Private high-resolution photo & film archive protected by two-factor passkey encryption.',
    };
  }

  const title = `${gallery.title} — ${gallery.clientName}`;
  const description = `Private high-resolution photography & cinema vault for ${gallery.clientName}. Lossless master proofs, selection lightbox, and secure encrypted delivery.`;
  const coverImage =
    gallery.coverPhotoUrl ||
    `/api/og?title=${encodeURIComponent(gallery.title)}&client=${encodeURIComponent(gallery.clientName)}`;

  return {
    title: `${gallery.title} | Surjo Media Vault`,
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

export default async function VaultPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const serverGallery = await getServerGallery(id);

  return (
    <VaultClientPage
      initialIdOrSlug={id}
      initialPin={sp.pin}
      initialPasscode={sp.passcode}
      initialRole={sp.role}
      initialGallery={serverGallery ?? undefined}
    />
  );
}
