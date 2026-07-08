import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import NodeID3 from 'node-id3';

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
        const filePath = path.join(musicDirectory, fileName);
        let title = fileName.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";
        let album = "Unknown Album";
        let coverArt = null;

        try {
          const tags = NodeID3.read(filePath);
          if (tags) {
            if (tags.title) title = tags.title;
            if (tags.artist) artist = tags.artist;
            if (tags.album) album = tags.album;
            
            if (tags.image && tags.image.imageBuffer) {
              const base64 = tags.image.imageBuffer.toString('base64');
              const mime = tags.image.mime || 'image/jpeg';
              coverArt = `data:${mime};base64,${base64}`;
            }
          }
        } catch (err) {
          console.error(`Error reading ID3 tags for ${fileName}:`, err);
        }

        return {
          title,
          artist,
          album,
          coverArt,
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
