import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Heart,
  Clock,
  Music,
  ChevronLeft,
  FileText,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, openLoginModal } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay, showToast } = useMusic();

  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchSongDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:5000/api/music/song/${id}`);
        if (res.data?.data) {
          setSong(res.data.data);
        } else {
          setError('Không tìm thấy thông tin bài hát');
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết bài hát:', err);
        setError('Không thể tải thông tin bài hát này');
      } finally {
        setLoading(false);
      }
    };

    fetchSongDetail();
  }, [id]);

  // Kiểm tra trạng thái yêu thích từ MongoDB
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !token || !id) {
        setIsLiked(false);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/favorites/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(Boolean(res.data?.isFavorite));
      } catch (err) {
        setIsLiked(false);
      }
    };

    checkFavorite();
  }, [id, user, token]);

  const handleToggleFavorite = async () => {
    if (!song) return;
    if (!user || !token) {
      openLoginModal();
      return;
    }

    try {
      if (isLiked) {
        await axios.delete(`http://localhost:5000/api/favorites/${song.songId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(false);
        showToast(`Đã xóa "${song.title}" khỏi bài hát yêu thích`, 'info');
      } else {
        await axios.post(
          'http://localhost:5000/api/favorites',
          {
            songId: String(song.songId),
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            duration: song.duration,
            audioUrl: song.audioUrl || song.streamUrl
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setIsLiked(true);
        showToast(`Đã thêm "${song.title}" vào bài hát yêu thích`, 'info');
      }
    } catch (err) {
      console.error('Lỗi toggle favorite:', err);
    }
  };

  const isCurrentPlaying = currentSong?.songId === song?.songId;

  const handlePlayMainSong = () => {
    if (!song) return;
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      const allQueue = [song, ...(song.relatedSongs || [])];
      playSong(song, allQueue);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-zinc-400">
        <Loader2 size={32} className="animate-spin text-emerald-400 mr-3" />
        <span>Đang tải thông tin ca khúc...</span>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Không tìm thấy bài hát'}</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 text-white">
      {/* Nút Quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition"
      >
        <ChevronLeft size={16} />
        <span>Quay lại</span>
      </button>

      {/* Banner Chi Tiết Bài Hát */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-zinc-800/80 mb-8 shadow-2xl">
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-xl overflow-hidden bg-zinc-800 shadow-2xl flex-shrink-0 group">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-emerald-400 mb-1">
            <Music size={14} />
            <span>Đĩa Đơn / Bài Hát</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
            {song.title}
          </h1>

          {/* Nghệ sĩ liên kết */}
          <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3 flex-wrap">
            <span>Trình bày bởi</span>
            <Link
              to={`/artist/${encodeURIComponent(song.artist)}`}
              className="font-bold text-white hover:text-emerald-400 hover:underline transition"
            >
              {song.artist}
            </Link>
            {song.album && (
              <>
                <span>•</span>
                <span className="text-zinc-400">Album: {song.album}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock size={13} />
              {formatDuration(song.duration)}
            </span>
            {song.releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                Phát hành: {song.releaseDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cụm Nút Hành Động */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handlePlayMainSong}
          className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition"
          title={isCurrentPlaying && isPlaying ? 'Tạm dừng' : 'Phát bài hát'}
        >
          {isCurrentPlaying && isPlaying ? (
            <Pause size={22} className="fill-black" />
          ) : (
            <Play size={22} className="fill-black ml-0.5" />
          )}
        </button>

        <button
          onClick={handleToggleFavorite}
          className="p-3 rounded-full border border-zinc-700/80 hover:border-white text-zinc-400 hover:text-white transition active:scale-95"
          title={isLiked ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <Heart
            size={20}
            className={isLiked ? 'fill-emerald-500 text-emerald-500' : 'hover:text-emerald-400'}
          />
        </button>

        <AddToPlaylistButton
          song={song}
          className="p-3 border border-zinc-700/80 hover:border-white"
        />
      </div>

      {/* Khung Hiển Thị Lời Bài Hát (Lyrics Box) */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Lời Bài Hát (Lyrics)</h2>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 max-h-80 overflow-y-auto leading-relaxed shadow-inner">
          {song.lyrics ? (
            <p className="whitespace-pre-line text-sm md:text-base text-zinc-300 font-sans tracking-wide">
              {song.lyrics}
            </p>
          ) : (
            <div className="text-center py-10 text-zinc-500 text-sm">
              <Music size={32} className="mx-auto mb-2 text-zinc-600" />
              <p>Lời bài hát cho ca khúc này đang được cập nhật.</p>
              <p className="text-xs text-zinc-600 mt-1">Hãy cùng lắng nghe giai điệu tuyệt vời nhé!</p>
            </div>
          )}
        </div>
      </div>

      {/* Danh Sách Gợi Ý Bài Hát Liên Quan */}
      {song.relatedSongs && song.relatedSongs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Bài hát khác của {song.artist}
            </h2>
            <Link
              to={`/artist/${encodeURIComponent(song.artist)}`}
              className="text-xs text-emerald-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
            {song.relatedSongs.map((related, index) => {
              const isCurrent = currentSong?.songId === related.songId;
              return (
                <div
                  key={related.songId || index}
                  onDoubleClick={() => playSong(related, [related, ...song.relatedSongs])}
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
                        if (isCurrent) togglePlay();
                        else playSong(related, [related, ...song.relatedSongs]);
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

                  <div className="col-span-7 md:col-span-6 flex items-center gap-3 pr-2 overflow-hidden">
                    <Link
                      to={`/song/${related.songId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <img
                        src={related.thumbnail}
                        alt={related.title}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow hover:opacity-80 transition"
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex flex-col min-w-0">
                      <Link
                        to={`/song/${related.songId}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`font-medium truncate text-sm hover:underline ${
                          isCurrent ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
                        }`}
                      >
                        {related.title}
                      </Link>
                      <Link
                        to={`/artist/${encodeURIComponent(related.artist || song.artist)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline truncate"
                      >
                        {related.artist}
                      </Link>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-3 text-xs text-zinc-400 truncate pr-2">
                    {related.album || 'Đĩa đơn'}
                  </div>

                  <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                    <span>{formatDuration(related.duration)}</span>
                    <AddToPlaylistButton song={related} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
