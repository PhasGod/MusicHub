import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from './AddToPlaylistButton';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Music
} from 'lucide-react';

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Player() {
  const { user, token, openLoginModal } = useAuth();
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isShuffle,
    isRepeat,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    changeVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat
  } = useMusic();

  const [isLiked, setIsLiked] = useState(false);

  // Đồng bộ trạng thái yêu thích từ MongoDB Atlas
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !token || !currentSong) {
        setIsLiked(false);
        return;
      }
      const sId = currentSong.songId || currentSong.id;
      if (!sId) return;

      try {
        const res = await axios.get(`http://localhost:5000/api/favorites/check/${sId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(Boolean(res.data?.isFavorite));
      } catch (err) {
        setIsLiked(false);
      }
    };

    checkFavorite();
  }, [currentSong, user, token]);

  const handleToggleFavorite = async () => {
    if (!currentSong) return;
    if (!user || !token) {
      openLoginModal();
      return;
    }

    const sId = currentSong.songId || currentSong.id;
    try {
      if (isLiked) {
        await axios.delete(`http://localhost:5000/api/favorites/${sId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(false);
      } else {
        await axios.post(
          'http://localhost:5000/api/favorites',
          {
            songId: String(sId),
            title: currentSong.title,
            artist: currentSong.artists || currentSong.artist,
            thumbnail: currentSong.thumbnail,
            duration: currentSong.duration,
            audioUrl: currentSong.streamUrl || currentSong.audioUrl
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái yêu thích:', err);
    }
  };

  // Tính phần trăm tiến trình để render thanh seek bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-4 md:px-6 flex items-center justify-between z-50 text-white select-none">
      {/* Cụm bên trái: Thumbnail, Tiêu đề, Ca sĩ, Nút Thích & Thêm vào Playlist */}
      <div className="flex items-center gap-2.5 w-1/4 min-w-[200px] max-w-[32%] flex-shrink-0">
        {currentSong ? (
          <>
            <Link
              to={`/song/${currentSong.songId || currentSong.id}`}
              className="flex-shrink-0 group block"
            >
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-14 h-14 min-w-[3.5rem] rounded-md object-cover flex-shrink-0 shadow-md group-hover:opacity-80 transition"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';
                }}
              />
            </Link>
            <div className="flex flex-col min-w-0 overflow-hidden flex-1">
              <Link
                to={`/song/${currentSong.songId || currentSong.id}`}
                className="text-sm font-medium text-zinc-100 truncate hover:underline hover:text-white cursor-pointer"
                title={currentSong.title}
              >
                {currentSong.title}
              </Link>
              <Link
                to={`/artist/${encodeURIComponent(currentSong.artists || currentSong.artist)}`}
                className="text-xs text-zinc-400 truncate hover:text-emerald-400 hover:underline cursor-pointer"
                title={currentSong.artists || currentSong.artist}
              >
                {currentSong.artists || currentSong.artist}
              </Link>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={handleToggleFavorite}
                title={isLiked ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white transition active:scale-90"
              >
                <Heart
                  size={18}
                  className={isLiked ? 'fill-emerald-500 text-emerald-500' : 'hover:text-emerald-400'}
                />
              </button>
              <AddToPlaylistButton song={currentSong} dropdownPosition="left" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-zinc-500 overflow-hidden">
            <div className="w-14 h-14 min-w-[3.5rem] rounded-md bg-zinc-900 border border-zinc-800/60 flex items-center justify-center flex-shrink-0">
              <Music size={20} className="text-zinc-600" />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-medium text-zinc-400 truncate">Chưa chọn bài hát</span>
              <span className="text-[11px] text-zinc-600 truncate">Chọn bài từ danh sách</span>
            </div>
          </div>
        )}
      </div>

      {/* Cụm ở giữa: Điều khiển Play/Pause, Next, Prev, Shuffle, Repeat & Thanh Seek Bar */}
      <div className="flex flex-col items-center justify-center w-2/4 max-w-2xl px-2">
        {/* Nút điều khiển */}
        <div className="flex items-center gap-4 md:gap-6 mb-1.5">
          {/* Nút Shuffle */}
          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            className={`p-1 transition ${
              isShuffle ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shuffle size={16} />
          </button>

          {/* Nút Previous */}
          <button
            onClick={prevSong}
            title="Bài trước đó"
            className="text-zinc-300 hover:text-white transition active:scale-90"
          >
            <SkipBack size={20} className="fill-current" />
          </button>

          {/* Nút Play / Pause */}
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-md transition"
          >
            {isPlaying ? (
              <Pause size={18} className="fill-black" />
            ) : (
              <Play size={18} className="fill-black ml-0.5" />
            )}
          </button>

          {/* Nút Next */}
          <button
            onClick={nextSong}
            title="Bài tiếp theo"
            className="text-zinc-300 hover:text-white transition active:scale-90"
          >
            <SkipForward size={20} className="fill-current" />
          </button>

          {/* Nút Repeat */}
          <button
            onClick={toggleRepeat}
            title={isRepeat ? 'Tắt lặp lại' : 'Lặp lại bài hát'}
            className={`p-1 transition ${
              isRepeat ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Repeat size={16} />
          </button>
        </div>

        {/* Thanh Seek bar & Thời gian */}
        <div className="w-full flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <span className="w-9 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group h-4 cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              disabled={!currentSong}
              className="absolute w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white group-hover:accent-emerald-500 opacity-0 group-hover:opacity-100 z-10 transition-opacity"
            />
            {/* Thanh hiển thị tiến trình visual */}
            <div className="w-full h-1 bg-zinc-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-emerald-500 transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="w-9 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Cụm bên phải: Điều chỉnh âm lượng */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[140px]">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
          className="text-zinc-400 hover:text-white transition"
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={18} className="text-zinc-400" />
          ) : volume < 0.5 ? (
            <Volume1 size={18} />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
        <div className="relative w-20 md:w-28 flex items-center group">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(e.target.value)}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </footer>
  );
}
