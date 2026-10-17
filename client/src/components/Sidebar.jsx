import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Search,
  Library,
  PlusSquare,
  Heart,
  Music2,
  ListMusic,
  Lock,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, token, openLoginModal } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      setPlaylists([]);
      return;
    }

    try {
      setLoadingPlaylists(true);
      const res = await axios.get(`${API_BASE_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.data && res.data.data) {
        setPlaylists(res.data.data);
      }
    } catch (err) {
      console.warn('Lỗi khi tải playlist cá nhân trên Sidebar:', err.message);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlaylists();

    // Lắng nghe sự kiện đồng bộ playlist toàn ứng dụng
    const handlePlaylistUpdate = () => {
      fetchPlaylists();
    };

    window.addEventListener('playlist-updated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('playlist-updated', handlePlaylistUpdate);
    };
  }, [fetchPlaylists, user, token]);

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/search', label: 'Tìm kiếm', icon: Search },
    { to: '/library', label: 'Thư viện', icon: Library }
  ];

  return (
    <>
      {/* Lớp phủ Backdrop khi mở drawer trên Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-zinc-950 flex flex-col h-full md:h-[calc(100vh-80px)] border-r border-zinc-900 select-none flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Thương hiệu & Nút Đóng trên mobile */}
        <div className="p-5 md:p-6 flex items-center justify-between border-b border-zinc-900/40 md:border-b-0">
          <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
            <img
              src="/favicon.png"
              alt="MusicHub Logo"
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-contain shadow-md shadow-emerald-500/20 group-hover:scale-105 transition"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              MusicHub
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850"
            title="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

      {/* Menu Điều Hướng Chính bằng NavLink */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className={isActive ? 'text-emerald-400' : ''} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Phím tắt tiện ích */}
      <div className="px-3 pt-4 space-y-1">
        {user ? (
          <NavLink
            to="/library"
            onClick={onClose}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`
            }
          >
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
              <PlusSquare size={16} />
            </div>
            <span>Tạo Playlist</span>
          </NavLink>
        ) : (
          <button
            onClick={() => {
              onClose();
              openLoginModal();
            }}
            className="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition group text-left"
          >
            <div className="w-6 h-6 rounded bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-zinc-300">
              <PlusSquare size={16} />
            </div>
            <span>Tạo Playlist</span>
          </button>
        )}

        <NavLink
          to="/favorites"
          onClick={onClose}
          className={({ isActive }) =>
            `w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`
          }
        >
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center text-white">
            <Heart size={14} className="fill-white" />
          </div>
          <span>Bài hát yêu thích</span>
        </NavLink>
      </div>

      <hr className="my-4 mx-6 border-zinc-800/80" />

      {/* Danh Sách Playlist Cá Nhân */}
      <div className="flex-1 px-4 overflow-y-auto space-y-1 text-sm">
        <div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Playlist của bạn</span>
          <ListMusic size={14} />
        </div>

        {(user || token) ? (
          loadingPlaylists ? (
            <div className="px-2 py-3 text-xs text-zinc-500 animate-pulse">
              Đang tải playlist...
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/playlist/${playlist._id}`}
                onClick={onClose}
                className="w-full text-left px-2 py-2 rounded text-zinc-400 hover:text-white hover:bg-zinc-900/60 text-xs truncate transition flex items-center gap-2 block group"
                title={playlist.name}
              >
                <Music2 size={13} className="text-zinc-600 group-hover:text-emerald-400 flex-shrink-0" />
                <span className="truncate group-hover:text-zinc-100">{playlist.name}</span>
              </Link>
            ))
          ) : (
            <div className="px-2 py-3 text-xs text-zinc-500">
              Chưa có playlist nào
            </div>
          )
        ) : (
          <div className="px-2 py-4 text-center">
            <p className="text-xs text-zinc-500 mb-2.5 leading-relaxed">
              Đăng nhập để xem danh sách playlist của bạn
            </p>
            <button
              onClick={openLoginModal}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 mx-auto"
            >
              <Lock size={12} />
              <span>Đăng nhập ngay</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  </>
);
}
