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
    let localSongs = fileNames
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
            
            if (tags.image && typeof tags.image !== 'string' && tags.image.imageBuffer) {
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
          url: `/music/${fileName}`,
          source: 'Local'
        };
      });

    let jamendoSongs: any[] = [];
    try {
      const jamendoRes = await fetch("https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=20&hasimage=true&boost=downloads_month");
      if (jamendoRes.ok) {
        const jamendoData = await jamendoRes.json();
        if (jamendoData.results) {
          jamendoSongs = jamendoData.results.map((track: any) => ({
            title: track.name,
            artist: track.artist_name,
            album: track.album_name || "Jamendo",
            coverArt: track.image,
            fileName: `jamendo-${track.id}.mp3`,
            url: track.audio,
            source: 'Jamendo'
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching Jamendo songs:", err);
    }

    const allSongs = [...localSongs, ...jamendoSongs];

    return NextResponse.json({ songs: allSongs });
  } catch (error) {
    console.error('Error reading music:', error);
    return NextResponse.json({ error: 'Failed to read music list' }, { status: 500 });
  }
}
