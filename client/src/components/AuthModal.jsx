import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register
  } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form khi đóng/mở modal hoặc chuyển tab
  useEffect(() => {
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (authModalMode === 'register') {
      if (!username.trim() || !email.trim() || !password) {
        setError('Vui lòng điền đầy đủ tất cả các trường');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp');
        return;
      }

      setIsSubmitting(true);
      const res = await register(username, email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setError(res.message);
      }
    } else {
      if (!email.trim() || !password) {
        setError('Vui lòng nhập email và mật khẩu');
        return;
      }

      setIsSubmitting(true);
      const res = await login(email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Container Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
        {/* Nút đóng */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X size={20} />
        </button>

        {/* Tiêu đề & Chuyển Tab */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authModalMode === 'login' ? 'Chào Mừng Trở Lại!' : 'Tạo Tài Khoản MusicHub'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {authModalMode === 'login'
              ? 'Đăng nhập để tiếp tục nghe nhạc và quản lý playlist'
              : 'Đăng ký miễn phí để trải nghiệm toàn bộ tính năng'}
          </p>

          <div className="flex bg-zinc-950 p-1 rounded-xl mt-4 border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalMode === 'login'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalMode === 'register'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Đăng Ký
            </button>
          </div>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Nhập */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Tên người dùng
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: nguyenvana"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Email
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Nhập lại mật khẩu
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu phía trên"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{authModalMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
            )}
          </button>
        </form>

        {/* Footer chuyển đổi chế độ */}
        <div className="text-center mt-5 text-xs text-zinc-400">
          {authModalMode === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setError('');
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setError('');
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
