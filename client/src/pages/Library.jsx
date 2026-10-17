import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import {
  Library as LibraryIcon,
  Plus,
  Trash2,
  Play,
  FolderPlus,
  Lock,
  Globe
} from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { user, token, openLoginModal } = useAuth();
  const { playSong } = useMusic();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlaylists = async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/playlists', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      if (res.data && res.data.data) {
        setPlaylists(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải playlists từ MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }

    const handlePlaylistUpdate = () => {
      fetchPlaylists();
    };

    window.addEventListener('playlist-updated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('playlist-updated', handlePlaylistUpdate);
    };
  }, [user, token]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !token) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        'http://localhost:5000/api/playlists',
        {
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim(),
          isPublic: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data && res.data.data) {
        setPlaylists([res.data.data, ...playlists]);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setShowCreateModal(false);
        window.dispatchEvent(new CustomEvent('playlist-updated'));
      }
    } catch (err) {
      console.error('Lỗi khi tạo playlist:', err);
      alert('Không thể tạo playlist: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa playlist này?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(playlists.filter((p) => p._id !== playlistId));
      window.dispatchEvent(new CustomEvent('playlist-updated'));
    } catch (err) {
      console.error('Lỗi khi xóa playlist:', err);
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    } else {
      alert('Playlist này chưa có bài hát nào!');
    }
  };

  // Màn hình khóa khi chưa đăng nhập
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-950/40">
          <Lock size={36} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          Thư Viện Cá Nhân Đang Khóa
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mb-8 leading-relaxed">
          Hãy đăng nhập để xem và quản lý danh sách phát cá nhân của bạn, tạo bộ sưu tập âm nhạc và lưu trữ trên cơ sở dữ liệu MongoDB.
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
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <LibraryIcon className="text-emerald-400" size={28} />
            Thư Viện Của {user.username}
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Quản lý {playlists.length} danh sách phát của bạn trên MongoDB Atlas
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          <span>Tạo Playlist Mới</span>
        </button>
      </div>

      {/* Danh sách Playlist Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-zinc-900/50 p-4 rounded-xl space-y-3 animate-pulse">
              <div className="aspect-square bg-zinc-800 rounded-lg" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              onClick={() => navigate(`/playlist/${playlist._id}`)}
              className="group relative bg-zinc-900/40 hover:bg-zinc-800/80 p-4 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-zinc-800 shadow">
                  <img
                    src={playlist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {/* Nút Play nhanh */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(playlist);
                    }}
                    title="Phát playlist"
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 transition-all duration-300"
                  >
                    <Play size={18} className="fill-black ml-0.5" />
                  </button>
                </div>

                <h3 className="font-semibold text-sm text-zinc-100 truncate mb-1" title={playlist.name}>
                  {playlist.name}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2" title={playlist.description}>
                  {playlist.description || 'Không có mô tả'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  {playlist.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                  {playlist.songs?.length || 0} bài hát
                </span>
                <button
                  onClick={(e) => handleDeletePlaylist(e, playlist._id)}
                  title="Xóa playlist"
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <FolderPlus size={48} className="mx-auto mb-3 text-zinc-700" />
          <h3 className="text-base font-semibold text-zinc-300">Chưa có Playlist nào trong CSDL</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Bấm nút "Tạo Playlist Mới" phía trên để tạo danh sách phát đầu tiên của bạn.
          </p>
        </div>
      )}

      {/* Modal Tạo Playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Tạo Playlist Mới</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Tên Playlist *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ví dụ: Giai Điệu Thư Giãn"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Thêm mô tả cho playlist của bạn..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newPlaylistName.trim()}
                  className="px-5 py-2 rounded-lg text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Tạo Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
