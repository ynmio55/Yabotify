import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (hasBlobToken) {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: 'public',
      });
      return NextResponse.json({ success: true, fileName: file.name, url: blob.url });
    } else {
      // Fallback to local disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const musicDirectory = path.join(process.cwd(), 'public', 'music');
      
      // Ensure directory exists
      if (!fs.existsSync(musicDirectory)) {
        fs.mkdirSync(musicDirectory, { recursive: true });
      }

      const filePath = path.join(musicDirectory, file.name);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({ success: true, fileName: file.name, url: `/music/${file.name}` });
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
