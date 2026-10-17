import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { Heart, Play, Pause, Trash2, Clock, Music, Lock } from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Favorites() {
  const { user, token, openLoginModal } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = useMusic();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.data) {
        setFavorites(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, token]);

  const handleRemoveFavorite = async (e, songId) => {
    e.stopPropagation();
    if (!token) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/favorites/${songId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites((prev) => prev.filter((item) => (item.songId || item.id) !== songId));
    } catch (err) {
      console.error('Lỗi khi xóa bài hát yêu thích:', err);
    }
  };

  const handleSongClick = (song) => {
    if (currentSong?.songId === song.songId) {
      togglePlay();
    } else {
      playSong(song, favorites);
    }
  };

  // Màn hình khóa khi chưa đăng nhập
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-950/40">
          <Lock size={36} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          Bài Hát Yêu Thích Đang Khóa
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
          Hãy đăng nhập để lưu trữ và quản lý danh sách các bài hát bạn đã thích, đồng bộ và thưởng thức trên mọi thiết bị.
        </p>
        <button
          onClick={openLoginModal}
          className="px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-28 text-white w-full max-w-full overflow-x-hidden">
      {/* Header Banner Bài hát đã thích */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-zinc-950 border border-indigo-800/40 mb-8 shadow-2xl">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl bg-gradient-to-br from-indigo-600 to-pink-500 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart size={64} className="fill-white text-white drop-shadow-md" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold tracking-widest text-indigo-300 mb-1">Playlist Yêu Thích</span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            Bài Hát Đã Thích
          </h1>
          <p className="text-sm text-zinc-300">
            {user.username} • {favorites.length} bài hát đã lưu
          </p>
        </div>
      </div>

      {/* Nút hành động */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => playSong(favorites[0], favorites)}
            className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition"
            title="Phát tất cả"
          >
            <Play size={22} className="fill-black ml-0.5" />
          </button>
        </div>
      )}

      {/* Danh Sách Bài Hát */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
          <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 md:col-span-7">Tiêu đề</div>
            <div className="hidden md:block col-span-2">Ca sĩ</div>
            <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
              <Clock size={13} />
              <span>Thời lượng</span>
            </div>
          </div>

          {favorites.map((song, index) => {
            const isCurrent = currentSong?.songId === (song.songId || song.id);
            return (
              <div
                key={song.songId || song.id || index}
                onDoubleClick={() => playSong(song, favorites)}
                className={`grid grid-cols-12 items-center px-4 py-2.5 text-sm hover:bg-zinc-800/50 transition cursor-pointer group ${
                  isCurrent ? 'bg-zinc-800/70' : ''
                }`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  <span
                    className={`text-xs font-medium group-hover:hidden ${
                      isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSongClick(song);
                    }}
                    className="hidden group-hover:flex text-white hover:text-emerald-400"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={15} className="fill-current text-emerald-400" />
                    ) : (
                      <Play size={15} className="fill-current" />
                    )}
                  </button>
                </div>

                <div className="col-span-6 md:col-span-7 flex items-center gap-3 pr-2 overflow-hidden">
                  <Link
                    to={`/song/${song.songId || song.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0"
                  >
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow hover:opacity-80 transition"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                  </Link>
                  <div className="flex flex-col min-w-0">
                    <Link
                      to={`/song/${song.songId || song.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`font-medium truncate text-sm hover:underline ${
                        isCurrent ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
                      }`}
                    >
                      {song.title}
                    </Link>
                    <Link
                      to={`/artist/${encodeURIComponent(song.artist || 'Unknown')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline truncate md:hidden"
                    >
                      {song.artist}
                    </Link>
                  </div>
                </div>

                <div className="hidden md:block col-span-2 text-xs text-zinc-400 truncate pr-2">
                  <Link
                    to={`/artist/${encodeURIComponent(song.artist || 'Unknown')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-zinc-200 hover:underline"
                  >
                    {song.artist}
                  </Link>
                </div>

                <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                  <span>{formatDuration(song.duration)}</span>
                  <AddToPlaylistButton song={song} />
                  <button
                    onClick={(e) => handleRemoveFavorite(e, song.songId || song.id)}
                    title="Xóa khỏi yêu thích"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <Music size={48} className="mx-auto mb-3 text-zinc-700" />
          <h3 className="text-base font-semibold text-zinc-300">Chưa có bài hát yêu thích nào</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Bấm vào biểu tượng trái tim trên trình phát để lưu bài hát bạn yêu thích vào đây.
          </p>
        </div>
      )}
    </div>
  );
}
