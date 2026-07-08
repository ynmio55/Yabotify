import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error reading music:', error);
    return NextResponse.json({ error: 'Failed to read music list' }, { status: 500 });
  }
}
