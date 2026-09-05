import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');
    const requestedName = searchParams.get('filename') || 'photograph.jpg';

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Clean and validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl, req.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch upstream image with stream or buffer
    const upstreamRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'SurjoMedia-Vault-Downloader/1.0',
      },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream download failed with status ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(requestedName)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    console.error('Download proxy error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Download failed' },
      { status: 500 }
    );
  }
}
