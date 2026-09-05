import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');
    const requestedName = searchParams.get('filename') || 'photograph.jpg';
    const fileId = searchParams.get('fileId');
    const token = searchParams.get('token') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    // 1. Direct Google Drive API master file retrieval if fileId + token are present
    if (fileId && token) {
      try {
        const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'SurjoMedia-Vault-Downloader/1.0',
          },
        });

        if (driveRes.ok) {
          const contentType = driveRes.headers.get('content-type') || 'application/octet-stream';
          const buffer = await driveRes.arrayBuffer();

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': buffer.byteLength.toString(),
              'Content-Disposition': `attachment; filename="${encodeURIComponent(requestedName)}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
        }
      } catch (driveErr) {
        console.warn('Drive direct alt=media download error, falling back to url:', driveErr);
      }
    }

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

    // 2. Google Photos direct original byte download: ensure =d suffix is applied
    if (parsedUrl.hostname.includes('googleusercontent.com')) {
      const pathname = parsedUrl.pathname;
      const base = pathname.replace(/=[^/]*$/, '');
      parsedUrl.pathname = `${base}=d`;
    }

    // 3. Fetch upstream uncompressed master
    const upstreamRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'SurjoMedia-Vault-Downloader/1.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
