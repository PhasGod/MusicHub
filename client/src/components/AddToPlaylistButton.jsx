import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { Plus, Check, Loader2, Music2, FolderPlus } from 'lucide-react';

export default function AddToPlaylistButton({ song, className = '', dropdownPosition = 'right' }) {
  const { user, token, openLoginModal } = useAuth();
  const { showToast } = useMusic();

  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenDropdown = async (e) => {
    e.stopPropagation();

    if (!user || !token) {
      openLoginModal();
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.data) {
        setPlaylists(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (e, playlist) => {
    e.stopPropagation();
    if (!token || !song) return;

    try {
      setAddingId(playlist._id);
      await axios.post(
        `http://localhost:5000/api/playlists/${playlist._id}/songs`,
        {
          songId: String(song.songId || song.id),
          title: song.title,
          artist: song.artists || song.artist || 'Nhiều nghệ sĩ',
          thumbnail: song.thumbnail || '',
          duration: song.duration || 0,
          audioUrl: song.streamUrl || song.audioUrl || ''
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Thông báo thành công và cập nhật lại dữ liệu
      showToast(`Đã thêm "${song.title}" vào playlist "${playlist.name}"`, 'info');
      window.dispatchEvent(new CustomEvent('playlist-updated'));
      setIsOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm bài hát vào playlist';
      showToast(msg, 'warning');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        title="Thêm vào playlist"
        className={`p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 ${className}`}
      >
        <Plus size={16} />
      </button>

      {/* Dropdown Menu mở bung lên trên (bottom-full mb-2) */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            dropdownPosition === 'left' ? 'left-0' : 'right-0'
          } bottom-full mb-2 w-56 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl py-2 z-50 text-left backdrop-blur-md animate-fadeIn`}
        >
          <div className="px-3 py-1.5 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Thêm vào playlist</span>
            <FolderPlus size={13} />
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-3 text-xs text-zinc-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-emerald-400" />
                <span>Đang tải playlist...</span>
              </div>
            ) : playlists.length > 0 ? (
              playlists.map((playlist) => (
                <button
                  key={playlist._id}
                  onClick={(e) => handleAddToPlaylist(e, playlist)}
                  disabled={addingId === playlist._id}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center justify-between transition disabled:opacity-50"
                >
                  <span className="truncate pr-2">{playlist.name}</span>
                  {addingId === playlist._id ? (
                    <Loader2 size={13} className="animate-spin text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Check size={13} className="opacity-0 group-hover:opacity-100 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2.5 text-xs text-zinc-500 text-center">
                Bạn chưa có playlist nào. Hãy vào Thư viện để tạo mới!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
