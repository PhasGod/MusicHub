import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, LogOut, User as UserIcon, Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, openLoginModal, openRegisterModal, logout } = useAuth();

  return (
    <header className="h-16 px-4 md:px-6 bg-zinc-950/40 backdrop-blur-md border-b border-zinc-900/60 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Cụm điều hướng lịch sử trang & Menu Hamburger trên Mobile */}
      <div className="flex items-center gap-2">
        {/* Nút Hamburger mở menu trên mobile */}
        <button
          onClick={onToggleSidebar}
          title="Mở menu"
          className="md:hidden w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition border border-zinc-800 active:scale-95"
        >
          <Menu size={19} />
        </button>

        <button
          onClick={() => navigate(-1)}
          title="Quay lại"
          className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => navigate(1)}
          title="Tiến lên"
          className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition hidden sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Cụm tài khoản người dùng góc phải */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 bg-zinc-900/80 hover:bg-zinc-800/90 py-1.5 px-3 rounded-full border border-zinc-800 transition">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <UserIcon size={14} className="text-white" />
              )}
            </div>

            {/* Tên người dùng */}
            <span className="text-xs font-semibold text-zinc-100 max-w-[120px] truncate">
              {user.username}
            </span>

            {/* Nút Đăng xuất */}
            <button
              onClick={logout}
              title="Đăng xuất"
              className="ml-1 p-1 text-zinc-400 hover:text-red-400 transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={openRegisterModal}
              className="text-xs font-semibold text-zinc-400 hover:text-white hover:scale-105 transition px-3 py-2"
            >
              Đăng ký
            </button>
            <button
              onClick={openLoginModal}
              className="px-5 py-2 rounded-full bg-white hover:bg-zinc-100 text-black font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition"
            >
              Đăng nhập
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
