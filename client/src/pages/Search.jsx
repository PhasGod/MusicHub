import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { Search as SearchIcon, X, Play, Pause, Clock, Music, Sparkles } from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const POPULAR_TAGS = ['Sơn Tùng M-TP', 'Vũ', 'Đen Vâu', 'Acoustic Chill', 'Lofi Hip Hop', 'EDM Party', 'Nhạc Trẻ'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { currentSong, isPlaying, playSong, togglePlay } = useMusic();

  const handleSearch = async (searchTerm) => {
    const term = searchTerm !== undefined ? searchTerm : query;
    if (!term || !term.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await axios.get(`${API_BASE_URL}/api/music/search`, {
        params: { q: term.trim(), limit: 25 }
      });
      if (res.data && res.data.data) {
        setResults(res.data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm bài hát:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search khi người dùng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSongClick = (song) => {
    if (currentSong?.songId === song.songId) {
      togglePlay();
    } else {
      playSong(song, results);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-28 text-white w-full max-w-full overflow-x-hidden">
      {/* Ô Nhập Tìm Kiếm */}
      <div className="max-w-2xl mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight text-white flex items-center gap-2">
          <SearchIcon className="text-emerald-400" size={28} />
          Tìm Kiếm Bài Hát
        </h1>
        <div className="relative flex items-center">
          <SearchIcon size={20} className="absolute left-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bạn muốn nghe bài hát, nghệ sĩ hay giai điệu gì?"
            className="w-full pl-12 pr-10 py-3.5 bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 border border-zinc-700/60 focus:border-emerald-500 rounded-full text-sm text-zinc-100 placeholder-zinc-500 outline-none transition shadow-lg"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              className="absolute right-4 text-zinc-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Các Thẻ Tìm Kiếm Phổ Biến */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
            <Sparkles size={13} className="text-amber-400" /> Gợi ý:
          </span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                handleSearch(tag);
              }}
              className="px-3 py-1 rounded-full text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700/40"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị Trạng Thái Đang Tải */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Kết Quả Tìm Kiếm */}
      {!loading && hasSearched && results.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-zinc-200 mb-3">
            Kết quả ({results.length} bài hát)
          </h2>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
            {/* Header Bảng */}
            <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 md:col-span-6">Tiêu đề</div>
              <div className="hidden md:block col-span-3">Album</div>
              <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
                <Clock size={13} />
                <span>Thời lượng</span>
              </div>
            </div>

            {results.map((song, index) => {
              const isCurrent = currentSong?.songId === song.songId;
              return (
                <div
                  key={song.songId}
                  onDoubleClick={() => playSong(song, results)}
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

                  <div className="col-span-6 md:col-span-6 flex items-center gap-3 pr-2 overflow-hidden">
                    <Link
                      to={`/song/${song.songId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-10 h-10 rounded-md object-cover shadow hover:opacity-80 transition"
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

                  <div className="hidden md:block col-span-3 text-xs text-zinc-400 truncate pr-2">
                    {song.album || 'Đĩa đơn'}
                  </div>

                  <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                    <span>{formatDuration(song.duration)}</span>
                    <AddToPlaylistButton song={song} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trạng Thái Không Tìm Thấy Kết Quả */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <Music size={48} className="mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-zinc-200">Không tìm thấy bài hát nào cho "{query}"</h3>
          <p className="text-sm text-zinc-500 mt-1">Hãy thử tìm với từ khóa khác như tên nghệ sĩ hoặc giai điệu.</p>
        </div>
      )}

      {/* Trạng Thái Chưa Tìm Kiếm */}
      {!hasSearched && (
        <div className="text-center py-16 text-zinc-500">
          <SearchIcon size={44} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">Nhập tên bài hát hoặc ca sĩ vào thanh tìm kiếm phía trên để bắt đầu nghe nhạc.</p>
        </div>
      )}
    </div>
  );
}
