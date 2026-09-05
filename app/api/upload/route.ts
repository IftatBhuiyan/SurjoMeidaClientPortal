import { NextRequest, NextResponse } from 'next/server';
import { saveMediaFile } from '@/lib/media-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided for upload' },
        { status: 400 }
      );
    }

    const savedFiles = [];

    for (const fileItem of files) {
      if (!(fileItem instanceof Blob)) continue;

      const file = fileItem as File;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const saved = await saveMediaFile(
        buffer,
        file.name || 'photo.jpg',
        file.type || 'image/jpeg'
      );

      savedFiles.push(saved);
    }

    return NextResponse.json({
      success: true,
      files: savedFiles,
      file: savedFiles[0] || null,
    });
  } catch (err: unknown) {
    console.error('Error handling media upload:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal upload failure' },
      { status: 500 }
    );
  }
}
