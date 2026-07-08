"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from "lucide-react";

interface Song {
  title: string;
  fileName: string;
  url: string;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/music")
      .then((res) => res.json())
      .then((data) => {
        if (data.songs) {
          setSongs(data.songs);
        }
      })
      .catch((err) => console.error("Failed to fetch songs", err));
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || currentSongIndex === null) {
      if (songs.length > 0) playSong(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && currentSongIndex !== null) {
      audioRef.current.src = songs[currentSongIndex].url;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [currentSongIndex]);

  const handleNext = () => {
    if (currentSongIndex === null || songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
  };

  const handlePrev = () => {
    if (currentSongIndex === null || songs.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      if (dur) {
        setDuration(dur);
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="px-8 py-8 flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Yabotify
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Library</h2>
          
          {songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-neutral-500">
              <Music className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-base font-medium">Your library is empty</p>
              <p className="text-sm mt-1 opacity-70">Add some audio files to the public/music folder.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-900 mb-2 uppercase tracking-wider">
                <div className="w-8 text-center">#</div>
                <div className="flex-1">Title</div>
                <div className="w-24 text-right">Source</div>
              </div>

              {/* Song List */}
              {songs.map((song, index) => {
                const isActive = currentSongIndex === index;
                return (
                  <div
                    key={song.url}
                    onClick={() => playSong(index)}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-neutral-900/60' 
                        : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="w-8 flex justify-center text-sm text-neutral-500">
                      {isActive && isPlaying ? (
                        <div className="flex gap-[3px] items-end h-3">
                          <div className="w-[3px] bg-white animate-pulse h-full rounded-full"></div>
                          <div className="w-[3px] bg-white animate-pulse h-2/3 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-[3px] bg-white animate-pulse h-4/5 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : isActive ? (
                        <span className="text-white">{(index + 1).toString().padStart(2, '0')}</span>
                      ) : (
                        <span className="group-hover:hidden">{(index + 1).toString().padStart(2, '0')}</span>
                      )}
                      {!isActive && (
                        <Play className="w-4 h-4 hidden group-hover:block text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 truncate">
                      <h3 className={`text-sm truncate transition-colors ${
                        isActive ? 'text-white font-medium' : 'text-neutral-300 font-normal group-hover:text-white'
                      }`}>
                        {song.title}
                      </h3>
                    </div>

                    <div className="w-24 text-right text-xs text-neutral-500">
                      Local
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#000000] border-t border-neutral-900 px-6 flex items-center justify-between z-50">
        {/* Current Song Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
          {currentSongIndex !== null && songs[currentSongIndex] ? (
             <>
               <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center flex-shrink-0 rounded-sm">
                 <Music className="w-5 h-5 text-neutral-600" />
               </div>
               <div className="truncate flex flex-col justify-center">
                 <h4 className="text-sm font-medium text-white truncate">{songs[currentSongIndex].title}</h4>
                 <p className="text-xs text-neutral-500 mt-0.5 truncate">Yabotify Player</p>
               </div>
             </>
          ) : (
            <div className="text-xs text-neutral-600 font-medium uppercase tracking-wider">No song selected</div>
          )}
        </div>

        {/* Controls & Progress */}
        <div className="flex flex-col items-center justify-center w-1/3 max-w-xl gap-2">
          <div className="flex items-center gap-6">
            <button onClick={handlePrev} className="text-neutral-400 hover:text-white transition-colors active:scale-95">
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button onClick={handleNext} className="text-neutral-400 hover:text-white transition-colors active:scale-95">
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
          
          <div className="w-full flex items-center gap-2 group">
            <span className="text-[11px] text-neutral-400 w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 h-1 flex items-center group">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress || 0} 
                onChange={handleSeek}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-neutral-400 w-10 tabular-nums">
               {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end w-1/3 gap-3 min-w-[150px]">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="relative w-24 h-1 flex items-center group">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolume}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onLoadedMetadata={handleTimeUpdate}
      />
    </div>
  );
}
