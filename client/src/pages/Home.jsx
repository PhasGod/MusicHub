import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { Play, Pause, Flame, Clock, Music, AlertCircle, Sparkles } from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const COUNTRY_TABS = [
  { id: 'vn', label: 'Việt Nam (V-Pop)', icon: '🇻🇳', desc: 'Top bản hit thịnh hành Việt Nam' },
  { id: 'us', label: 'Âu Mỹ (US-UK)', icon: '🇺🇸', desc: 'Bản xếp hạng Billboard & Toàn cầu' },
  { id: 'kr', label: 'Hàn Quốc (K-Pop)', icon: '🇰🇷', desc: 'Bản hit K-Pop & Idol hot nhất' }
];

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCountry, setActiveCountry] = useState('vn');

  const { currentSong, isPlaying, playSong, togglePlay } = useMusic();

  const fetchTopSongs = async (countryCode) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/music/chart`, {
        params: {
          country: countryCode,
          limit: 24
        }
      });
      if (res.data && res.data.data) {
        setSongs(res.data.data);
      } else {
        setSongs([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải bảng xếp hạng:', err);
      setError('Không thể kết nối đến máy chủ API nhạc. Vui lòng kiểm tra Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSongs(activeCountry);
  }, [activeCountry]);

  const handleSongClick = (song) => {
    if (currentSong?.songId === song.songId) {
      togglePlay();
    } else {
      playSong(song, songs);
    }
  };

  const currentTabInfo = COUNTRY_TABS.find((t) => t.id === activeCountry);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 text-white">
      {/* Banner Khám Phá Nổi Bật */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 p-6 md:p-8 mb-8 border border-zinc-800/80 shadow-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame size={14} className="fill-emerald-400" />
            Bảng Xếp Hạng Thịnh Hành
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
            Âm Nhạc Cho Mọi Khoảnh Khắc
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mb-4">
            Khám phá các bản hit đỉnh cao từ {currentTabInfo?.label}. Nhấp đúp để thưởng thức ngay lập tức!
          </p>
          {songs.length > 0 && (
            <button
              onClick={() => playSong(songs[0], songs)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <Play size={16} className="fill-black" />
              Phát Tất Cả ({currentTabInfo?.label})
            </button>
          )}
        </div>
      </div>

      {/* Thanh Chuyển Tab Quốc Gia (Country Tabs) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Chọn khu vực bảng xếp hạng
          </h2>
          <span className="text-xs text-zinc-500">Cập nhật liên tục</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {COUNTRY_TABS.map((tab) => {
            const isActive = activeCountry === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCountry(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trạng thái lỗi */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trạng thái Đang tải (Skeleton) */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/50 p-3.5 rounded-xl space-y-3 animate-pulse">
                <div className="aspect-square bg-zinc-800 rounded-lg" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Lưới bài hát đề xuất (Grid View) */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="text-emerald-400" size={20} />
              Gợi ý hôm nay ({currentTabInfo?.label})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {songs.slice(0, 6).map((song) => {
                const isCurrent = currentSong?.songId === song.songId;
                return (
                  <div
                    key={song.songId}
                    onDoubleClick={() => playSong(song, songs)}
                    className={`group relative bg-zinc-900/40 hover:bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-300 cursor-pointer ${
                      isCurrent ? 'border-emerald-500/50 bg-zinc-800/60 shadow-lg shadow-emerald-950/40' : ''
                    }`}
                  >
                    {/* Ảnh bài hát */}
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-zinc-800 shadow-md">
                      <Link to={`/song/${song.songId}`} onClick={(e) => e.stopPropagation()}>
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                      </Link>
                      {/* Nút Play nhanh khi hover hoặc khi bài đang phát */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSongClick(song);
                        }}
                        className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl transition-all duration-300 ${
                          isCurrent
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause size={18} className="fill-black" />
                        ) : (
                          <Play size={18} className="fill-black ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Tiêu đề & Nghệ sĩ */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="overflow-hidden min-w-0 flex-1">
                        <Link
                          to={`/song/${song.songId}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`block font-semibold text-sm truncate mb-0.5 hover:underline ${
                            isCurrent ? 'text-emerald-400' : 'text-zinc-100'
                          }`}
                          title={song.title}
                        >
                          {song.title}
                        </Link>
                        <Link
                          to={`/artist/${encodeURIComponent(song.artist || 'Unknown')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-xs text-zinc-400 hover:text-zinc-200 hover:underline truncate"
                          title={song.artist}
                        >
                          {song.artist}
                        </Link>
                      </div>
                      <AddToPlaylistButton song={song} className="flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sách Bảng xếp hạng chi tiết (List View) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="text-amber-400" size={20} />
                Bảng Xếp Hạng Top Hits ({currentTabInfo?.label})
              </h2>
              <span className="text-xs text-zinc-400">Nhấp đúp hoặc bấm nút để nghe</span>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
              {/* Tiêu đề bảng */}
              <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6 md:col-span-5">Tiêu đề</div>
                <div className="hidden md:block col-span-4">Album</div>
                <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
                  <Clock size={13} />
                  <span>Thời lượng</span>
                </div>
              </div>

              {/* Hàng bài hát */}
              {songs.map((song, index) => {
                const isCurrent = currentSong?.songId === song.songId;
                return (
                  <div
                    key={song.songId}
                    onDoubleClick={() => playSong(song, songs)}
                    className={`grid grid-cols-12 items-center px-4 py-2.5 text-sm hover:bg-zinc-800/50 transition cursor-pointer group ${
                      isCurrent ? 'bg-zinc-800/70' : ''
                    }`}
                  >
                    {/* Số thứ tự hoặc icon phát */}
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

                    {/* Thumbnail + Tên bài hát + Nghệ sĩ */}
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 pr-2 overflow-hidden">
                      <Link
                        to={`/song/${song.songId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0"
                      >
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-10 h-10 rounded-md object-cover hover:opacity-80 transition"
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
                          className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline truncate"
                        >
                          {song.artist}
                        </Link>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden md:block col-span-4 text-xs text-zinc-400 truncate pr-2">
                      {song.album || 'Đĩa đơn'}
                    </div>

                    {/* Thời lượng & Thêm vào Playlist */}
                    <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                      <span>{formatDuration(song.duration)}</span>
                      <AddToPlaylistButton song={song} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
