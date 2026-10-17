import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { AlertCircle, X } from 'lucide-react';

const MusicContext = createContext(null);

// Đường dẫn MP3 demo công khai không bản quyền dùng làm Fallback khi bài hát bị khóa VIP/lỗi stream
const FALLBACK_STREAM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [toast, setToast] = useState(null);

  const audioRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Hiển thị thông báo nhẹ dạng Toast
  const showToast = useCallback((message, type = 'warning', durationMs = 4500) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, durationMs);
  }, []);

  // Chuẩn hóa định dạng bài hát đồng bộ giữa API và các components
  const normalizeSong = (song) => {
    if (!song) return null;
    return {
      id: song.id || song.songId || song.encodeId || String(song._id || ''),
      songId: song.songId || song.id || song.encodeId || String(song._id || ''),
      encodeId: song.encodeId || song.songId || song.id || '',
      title: song.title || 'Không có tiêu đề',
      artist: song.artist || song.artists || 'Nhiều nghệ sĩ',
      artists: song.artists || song.artist || 'Nhiều nghệ sĩ',
      thumbnail: song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
      streamUrl: song.streamUrl || song.audioUrl || '',
      audioUrl: song.audioUrl || song.streamUrl || '',
      duration: song.duration || 0
    };
  };

  /**
   * Phát một bài hát cụ thể và cập nhật hàng đợi
   * Tự động lấy link stream từ backend nếu chưa có và có cơ chế Fallback sang nhạc demo khi bị bản quyền VIP
   */
  const playSong = useCallback(async (song, newQueue = null) => {
    if (!song) return;
    const normalized = normalizeSong(song);

    // Cập nhật queue nếu có danh sách mới được truyền vào
    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      setQueue(newQueue.map(normalizeSong));
    } else {
      setQueue((prevQueue) => {
        const exists = prevQueue.some((item) => (item.id || item.songId) === normalized.id);
        if (!exists) {
          return [...prevQueue, normalized];
        }
        return prevQueue;
      });
    }

    let finalStreamUrl = normalized.streamUrl || normalized.audioUrl;
    const songId = normalized.id || normalized.songId || normalized.encodeId;

    // 1. Nếu streamUrl chưa có hoặc rỗng, tự động gọi API backend để lấy link trực tiếp
    if (!finalStreamUrl || finalStreamUrl.trim() === '') {
      try {
        console.log(`[MusicHub] Đang lấy link stream từ backend cho bài hát: "${normalized.title}" (ID: ${songId})...`);
        const res = await axios.get(`${API_BASE_URL}/api/music/song/${songId}`, {
          timeout: 6000
        });

        if (res.data?.data?.audioUrl) {
          finalStreamUrl = res.data.data.audioUrl;
          normalized.streamUrl = finalStreamUrl;
          normalized.audioUrl = finalStreamUrl;
        }
      } catch (err) {
        console.warn(`[MusicHub] Không thể lấy streamUrl từ backend cho ID ${songId}:`, err.message);
      }
    }

    // 2. Kiểm tra nếu link vẫn rỗng hoặc không hợp lệ -> Kích hoạt Fallback demo URL
    let usedFallback = false;
    if (!finalStreamUrl || finalStreamUrl.trim() === '' || !finalStreamUrl.startsWith('http')) {
      console.warn(`[MusicHub] Bài hát "${normalized.title}" chưa có streamUrl hợp lệ. Chuyển sang fallback demo.`);
      finalStreamUrl = FALLBACK_STREAM_URL;
      normalized.streamUrl = FALLBACK_STREAM_URL;
      normalized.audioUrl = FALLBACK_STREAM_URL;
      usedFallback = true;
      showToast('Bài hát này có bản quyền VIP, đang phát bản demo thử nghiệm');
    }

    setCurrentSong(normalized);
    setCurrentTime(0);

    // 3. Gán vào audio element và phát an toàn với khối try/catch
    if (audioRef.current) {
      try {
        console.log(`[MusicHub] Đang tải audio cho "${normalized.title}" | Stream URL: ${finalStreamUrl}`);
        audioRef.current.src = finalStreamUrl;
        audioRef.current.volume = volume;

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      } catch (err) {
        console.error(`[MusicHub] Lỗi khi gọi audio.play() với URL: ${finalStreamUrl}`, err);
        setIsPlaying(false);

        // Nếu link gốc bị lỗi (NotSupportedError, 403, 404, CORS) và chưa dùng fallback, kích hoạt ngay fallback
        if (!usedFallback) {
          console.warn(`[MusicHub] Tự động thử lại với URL demo fallback cho bài: "${normalized.title}"`);
          try {
            audioRef.current.src = FALLBACK_STREAM_URL;
            normalized.streamUrl = FALLBACK_STREAM_URL;
            normalized.audioUrl = FALLBACK_STREAM_URL;
            setCurrentSong({ ...normalized });
            await audioRef.current.play();
            setIsPlaying(true);
            showToast('Bài hát này có bản quyền VIP, đang phát bản demo thử nghiệm');
          } catch (fallbackError) {
            console.error('[MusicHub] Cả URL fallback cũng không thể phát:', fallbackError);
          }
        }
      }
    }
  }, [volume, showToast]);

  /**
   * Bật / Tắt phát nhạc (Play / Pause)
   */
  const togglePlay = useCallback(() => {
    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0]);
      }
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error(`[MusicHub] Lỗi khi tiếp tục phát (URL: ${audioRef.current.src}):`, err);
          setIsPlaying(false);
        });
    }
  }, [currentSong, isPlaying, queue, playSong]);

  /**
   * Chuyển bài hát tiếp theo trong danh sách chờ
   */
  const nextSong = useCallback(() => {
    if (queue.length === 0) return;

    // Chế độ lặp lại 1 bài
    if (isRepeat && currentSong && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('[MusicHub] Lỗi khi lặp lại bài hát:', err);
        });
      return;
    }

    // Chế độ phát ngẫu nhiên (Shuffle)
    if (isShuffle && queue.length > 1) {
      const currentIndex = queue.findIndex(
        (item) => (item.id || item.songId) === (currentSong?.id || currentSong?.songId)
      );
      let randomIndex = Math.floor(Math.random() * queue.length);
      while (randomIndex === currentIndex && queue.length > 1) {
        randomIndex = Math.floor(Math.random() * queue.length);
      }
      playSong(queue[randomIndex]);
      return;
    }

    // Phát bài kế tiếp theo thứ tự
    const currentIndex = queue.findIndex(
      (item) => (item.id || item.songId) === (currentSong?.id || currentSong?.songId)
    );

    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playSong(queue[currentIndex + 1]);
    } else if (queue.length > 0) {
      // Quay về bài đầu tiên
      playSong(queue[0]);
    }
  }, [queue, isRepeat, currentSong, isShuffle, playSong]);

  /**
   * Quay lại bài hát trước đó
   */
  const prevSong = useCallback(() => {
    if (queue.length === 0) return;

    // Nếu bài đang phát quá 3 giây, tua lại từ đầu
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const currentIndex = queue.findIndex(
      (item) => (item.id || item.songId) === (currentSong?.id || currentSong?.songId)
    );

    if (currentIndex > 0) {
      playSong(queue[currentIndex - 1]);
    } else if (queue.length > 0) {
      playSong(queue[queue.length - 1]);
    }
  }, [queue, currentSong, playSong]);

  /**
   * Tua đến một giây cụ thể trong bài hát
   */
  const seekTo = useCallback((seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  /**
   * Điều chỉnh âm lượng (0.0 đến 1.0)
   */
  const changeVolume = useCallback((val) => {
    const newVol = Math.max(0, Math.min(1, Number(val)));
    setVolume(newVol);
    if (newVol > 0) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  }, []);

  /**
   * Bật/Tắt chế độ câm tiếng (Mute)
   */
  const toggleMute = useCallback(() => {
    if (isMuted) {
      changeVolume(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      changeVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, prevVolume, volume, changeVolume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  // Xử lý các sự kiện từ audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    nextSong();
  };

  // Bắt lỗi thẻ audio khi nguồn audio không thể tải trong lúc chạy
  const handleAudioError = (e) => {
    const currentSrc = audioRef.current ? audioRef.current.src : '';
    console.warn(`[MusicHub] Thẻ audio phát sinh lỗi khi nạp nguồn (URL: ${currentSrc})`, e);

    // Nếu nguồn bị lỗi khác fallback URL, tự động chuyển sang fallback
    if (currentSong && currentSrc && currentSrc !== FALLBACK_STREAM_URL) {
      console.log(`[MusicHub] Nguồn phát bị lỗi hoặc hết hạn, kích hoạt link fallback demo cho "${currentSong.title}"...`);
      if (audioRef.current) {
        audioRef.current.src = FALLBACK_STREAM_URL;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            showToast('Bài hát này có bản quyền VIP, đang phát bản demo thử nghiệm');
          })
          .catch((err) => {
            console.error('[MusicHub] Không thể phát fallback sau lỗi audio:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        queue,
        isShuffle,
        isRepeat,
        toast,
        showToast,
        playSong,
        togglePlay,
        nextSong,
        prevSong,
        seekTo,
        changeVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        setQueue
      }}
    >
      {children}

      {/* Thẻ audio ẩn xử lý toàn bộ âm thanh nền */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Toast thông báo nhẹ nhàng */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border border-amber-500/70 text-amber-200 rounded-xl shadow-2xl backdrop-blur-md text-xs md:text-sm max-w-md select-none transition-all duration-300">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-white p-0.5 rounded transition"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic phải được sử dụng bên trong MusicProvider');
  }
  return context;
};
