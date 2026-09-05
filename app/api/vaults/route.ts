import { NextRequest, NextResponse } from 'next/server';
import {
  getAllServerGalleries,
  upsertServerGallery,
  saveServerGalleries,
} from '@/lib/server-vault-store';
import { ClientGallery } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const galleries = await getAllServerGalleries();
    return NextResponse.json({ galleries });
  } catch (error) {
    console.error('Error in GET /api/vaults:', error);
    return NextResponse.json({ error: 'Failed to retrieve vaults' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Batch sync support: array of galleries from client localStorage
    if (Array.isArray(body)) {
      const existing = await getAllServerGalleries();
      const existingMap = new Map<string, ClientGallery>(existing.map((g) => [g.id, g]));

      for (const item of body as ClientGallery[]) {
        if (!item || !item.id) continue;
        const current = existingMap.get(item.id);
        if (!current) {
          existingMap.set(item.id, item);
        } else {
          // Merge based on most recent updatedAt
          const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
          const currentTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
          if (itemTime >= currentTime) {
            existingMap.set(item.id, { ...current, ...item });
          }
        }
      }

      const merged = Array.from(existingMap.values());
      await saveServerGalleries(merged);
      return NextResponse.json({ success: true, count: merged.length, galleries: merged });
    }

    // Single gallery upsert
    const gallery = body as ClientGallery;
    if (!gallery || !gallery.id || !gallery.title) {
      return NextResponse.json({ error: 'Invalid gallery payload' }, { status: 400 });
    }

    const saved = await upsertServerGallery(gallery);
    return NextResponse.json({ success: true, gallery: saved });
  } catch (error) {
    console.error('Error in POST /api/vaults:', error);
    return NextResponse.json({ error: 'Failed to save vault' }, { status: 500 });
  }
}
