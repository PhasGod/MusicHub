import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import {
  Play,
  Pause,
  Trash2,
  Clock,
  Music,
  ChevronLeft,
  Lock,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, openLoginModal } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay, showToast } = useMusic();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlaylistDetail = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.data) {
        setPlaylist(res.data.data);
      } else {
        setError('Không tìm thấy thông tin playlist');
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết playlist:', err);
      setError(err.response?.data?.message || 'Không thể tải playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchPlaylistDetail();
    } else {
      setLoading(false);
    }
  }, [id, user, token]);

  const handleDeletePlaylist = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa playlist "${playlist?.name}"?`)) return;

    try {
      setDeleting(true);
      await axios.delete(`${API_BASE_URL}/api/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.dispatchEvent(new CustomEvent('playlist-updated'));
      showToast('Đã xóa playlist thành công', 'info');
      navigate('/library');
    } catch (err) {
      console.error('Lỗi khi xóa playlist:', err);
      showToast('Không thể xóa playlist: ' + (err.response?.data?.message || err.message), 'warning');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveSong = async (e, songId) => {
    e.stopPropagation();

    try {
      await axios.delete(`${API_BASE_URL}/api/playlists/${id}/songs/${songId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylist((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s.songId !== String(songId))
      }));

      window.dispatchEvent(new CustomEvent('playlist-updated'));
      showToast('Đã xóa bài hát khỏi playlist', 'info');
    } catch (err) {
      console.error('Lỗi xóa bài hát khỏi playlist:', err);
      showToast('Không thể xóa bài hát: ' + (err.response?.data?.message || err.message), 'warning');
    }
  };

  const handleSongClick = (song) => {
    if (currentSong?.songId === song.songId) {
      togglePlay();
    } else {
      playSong(song, playlist.songs);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
          <Lock size={36} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
          Vui Lòng Đăng Nhập
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mb-8">
          Bạn cần đăng nhập để xem chi tiết và phát nhạc từ danh sách phát này.
        </p>
        <button
          onClick={openLoginModal}
          className="px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-zinc-400">
        <Loader2 size={32} className="animate-spin text-emerald-400 mr-3" />
        <span>Đang tải thông tin playlist...</span>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Không tìm thấy playlist'}</h2>
        <p className="text-zinc-400 text-sm mb-6">Playlist này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link
          to="/library"
          className="px-6 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition"
        >
          Quay lại Thư viện
        </Link>
      </div>
    );
  }

  const songs = playlist.songs || [];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-28 text-white w-full max-w-full overflow-x-hidden">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition"
      >
        <ChevronLeft size={16} />
        <span>Quay lại</span>
      </button>

      {/* Banner Header Playlist */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-zinc-800/80 mb-8 shadow-2xl">
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-xl overflow-hidden bg-zinc-800 shadow-2xl flex-shrink-0">
          <img
            src={playlist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'}
            alt={playlist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-emerald-400 mb-1">
            <span>Danh Sách Phát</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {playlist.isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {playlist.isPublic ? 'Công khai' : 'Riêng tư'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            {playlist.name}
          </h1>

          <p className="text-sm text-zinc-300 mb-2">
            {playlist.description || 'Chưa có mô tả cho playlist này.'}
          </p>

          <p className="text-xs text-zinc-400">
            Tạo bởi <span className="text-zinc-200 font-semibold">{playlist.userId?.username || user.username}</span> • {songs.length} bài hát
          </p>
        </div>
      </div>

      {/* Nút Hành Động: Phát tất cả & Xóa */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {songs.length > 0 && (
            <button
              onClick={() => playSong(songs[0], songs)}
              className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition"
              title="Phát tất cả"
            >
              <Play size={22} className="fill-black ml-0.5" />
            </button>
          )}
        </div>

        <button
          onClick={handleDeletePlaylist}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition disabled:opacity-50"
        >
          <Trash2 size={14} />
          <span>Xóa Playlist</span>
        </button>
      </div>

      {/* Danh sách bài hát */}
      {songs.length > 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
          <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 md:col-span-7">Tiêu đề</div>
            <div className="hidden md:block col-span-2">Nghệ sĩ</div>
            <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
              <Clock size={13} />
              <span>Thời lượng</span>
            </div>
          </div>

          {songs.map((song, index) => {
            const isCurrent = currentSong?.songId === song.songId;
            return (
              <div
                key={song.songId || song._id || index}
                onDoubleClick={() => playSong(song, songs)}
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
                    to={`/song/${song.songId}`}
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
                      to={`/song/${song.songId}`}
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

                <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-3 text-xs text-zinc-400 font-mono">
                  <span>{formatDuration(song.duration)}</span>
                  <button
                    onClick={(e) => handleRemoveSong(e, song.songId)}
                    title="Xóa bài hát khỏi playlist"
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
          <h3 className="text-base font-semibold text-zinc-300">Playlist này chưa có bài hát nào</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy khám phá tại Trang chủ hoặc Tìm kiếm và nhấn nút '+' trên bài hát để thêm vào danh sách phát này!
          </p>
        </div>
      )}
    </div>
  );
}
