import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/media-store';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing media ID' }, { status: 400 });
    }

    const media = await getMediaFile(id);
    if (!media) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1';

    const headers: Record<string, string> = {
      'Content-Type': media.mimeType,
      'Content-Length': media.buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(media.originalName)}"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new NextResponse(new Uint8Array(media.buffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error('Error serving media file:', err);
    return NextResponse.json({ error: 'Failed to retrieve media file' }, { status: 500 });
  }
}
