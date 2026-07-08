import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (hasBlobToken) {
      // Fetch from Vercel Blob
      const { blobs } = await list();
      const songs = blobs
        .filter(blob => blob.pathname.match(/\.(mp3|wav|ogg|m4a|flac)$/i))
        .map(blob => {
          const fileName = blob.pathname.split('/').pop() || blob.pathname;
          const title = fileName.replace(/\.[^/.]+$/, "");
          return {
            title,
            fileName,
            url: blob.url
          };
        });
      return NextResponse.json({ songs });
    } else {
      // Fallback to local disk
      const musicDirectory = path.join(process.cwd(), 'public', 'music');
      if (!fs.existsSync(musicDirectory)) {
        return NextResponse.json({ songs: [] });
      }

      const fileNames = fs.readdirSync(musicDirectory);
      const songs = fileNames
        .filter((fileName) => {
          const ext = path.extname(fileName).toLowerCase();
          return ['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext);
        })
        .map((fileName) => {
          const title = fileName.replace(/\.[^/.]+$/, "");
          return {
            title,
            fileName,
            url: `/music/${fileName}`
          };
        });

      return NextResponse.json({ songs });
    }
  } catch (error) {
    console.error('Error reading music:', error);
    return NextResponse.json({ error: 'Failed to read music list' }, { status: 500 });
  }
}
