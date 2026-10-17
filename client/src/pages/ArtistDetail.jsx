import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useMusic } from '../context/MusicContext';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import {
  Play,
  Pause,
  Clock,
  Music,
  ChevronLeft,
  Users,
  Disc3,
  BadgeCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';

const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function ArtistDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = useMusic();

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:5000/api/music/artist/${encodeURIComponent(name)}`);
        if (res.data?.data) {
          setArtist(res.data.data);
        } else {
          setError('Không tìm thấy thông tin nghệ sĩ');
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin nghệ sĩ:', err);
        setError('Không thể tải thông tin nghệ sĩ này');
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [name]);

  const topSongs = artist?.topSongs || [];

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs);
    }
  };

  const handleSongClick = (song) => {
    if (currentSong?.songId === song.songId) {
      togglePlay();
    } else {
      playSong(song, topSongs);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32 text-zinc-400">
        <Loader2 size={32} className="animate-spin text-emerald-400 mr-3" />
        <span>Đang tải trang nghệ sĩ...</span>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center text-white">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Không tìm thấy nghệ sĩ'}</h2>
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

      {/* Banner Nghệ Sĩ Lớn */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-zinc-800/80 mb-8 shadow-2xl">
        {/* Ảnh đại diện tròn */}
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden bg-zinc-800 shadow-2xl ring-4 ring-emerald-500/30 flex-shrink-0">
          <img
            src={artist.picture}
            alt={artist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </div>

        <div className="flex flex-col text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs uppercase font-bold tracking-widest text-emerald-400 mb-1">
            <BadgeCheck size={16} className="text-emerald-400 fill-emerald-400 text-black" />
            <span>Nghệ Sĩ Được Xác Minh</span>
          </div>

          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight mb-3">
            {artist.name}
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-5 text-xs text-zinc-300">
            {artist.nb_fan > 0 && (
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-zinc-400" />
                {artist.nb_fan.toLocaleString()} người hâm mộ
              </span>
            )}
            {artist.nb_album > 0 && (
              <span className="flex items-center gap-1.5">
                <Disc3 size={14} className="text-zinc-400" />
                {artist.nb_album} album
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Music size={14} className="text-zinc-400" />
              {topSongs.length} ca khúc nổi bật
            </span>
          </div>
        </div>
      </div>

      {/* Cụm Nút Hành Động */}
      {topSongs.length > 0 && (
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handlePlayAll}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition"
          >
            <Play size={18} className="fill-black" />
            <span>Phát Tất Cả Bài Hát</span>
          </button>
        </div>
      )}

      {/* Bảng Danh Sách Bài Hát Nổi Bật */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Music className="text-emerald-400" size={20} />
          Các Ca Khúc Nổi Bật Nhất
        </h2>

        {topSongs.length > 0 ? (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-800/40">
            {/* Header Bảng */}
            <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 md:col-span-5">Tiêu đề</div>
              <div className="hidden md:block col-span-4">Album</div>
              <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
                <Clock size={13} />
                <span>Thời lượng</span>
              </div>
            </div>

            {topSongs.map((song, index) => {
              const isCurrent = currentSong?.songId === song.songId;
              return (
                <div
                  key={song.songId || index}
                  onDoubleClick={() => playSong(song, topSongs)}
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

                  <div className="col-span-6 md:col-span-5 flex items-center gap-3 pr-2 overflow-hidden">
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
                      <span className="text-xs text-zinc-400 truncate">{song.artist}</span>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-4 text-xs text-zinc-400 truncate pr-2">
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
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <Music size={40} className="mx-auto mb-2 text-zinc-600" />
            <p className="text-sm">Chưa có bài hát nào được liệt kê cho nghệ sĩ này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
