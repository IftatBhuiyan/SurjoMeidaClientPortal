import { NextRequest, NextResponse } from 'next/server';
import {
  getServerGallery,
  upsertServerGallery,
  deleteServerGallery,
} from '@/lib/server-vault-store';
import { ClientGallery } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 });
    }

    const gallery = await getServerGallery(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    return NextResponse.json({ gallery });
  } catch (error) {
    console.error('Error in GET /api/vaults/[id]:', error);
    return NextResponse.json({ error: 'Failed to retrieve vault' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await getServerGallery(id);
    const updatedPayload: ClientGallery = {
      ...(existing || {}),
      ...body,
      id: existing ? existing.id : id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await upsertServerGallery(updatedPayload);
    return NextResponse.json({ success: true, gallery: saved });
  } catch (error) {
    console.error('Error in PUT /api/vaults/[id]:', error);
    return NextResponse.json({ error: 'Failed to update vault' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getServerGallery(id);
    const targetId = existing ? existing.id : id;

    const deleted = await deleteServerGallery(targetId);
    if (!deleted) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/vaults/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete vault' }, { status: 500 });
  }
}
