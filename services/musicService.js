const axios = require('axios');

const DEEZER_BASE_URL = 'https://api.deezer.com';

/**
 * Chuẩn hóa dữ liệu bài hát từ Deezer API theo cấu trúc của MusicHub
 */
const formatTrack = (track) => {
  if (!track) return null;
  return {
    songId: String(track.id),
    title: track.title,
    artist: track.artist ? track.artist.name : 'Unknown Artist',
    album: track.album ? track.album.title : '',
    thumbnail: track.album?.cover_big || track.album?.cover_medium || track.artist?.picture_medium || '',
    duration: track.duration || 0, // thời lượng tính bằng giây
    audioUrl: track.preview || '', // link mp3 stream nghe thử trực tiếp
    rank: track.rank || null
  };
};

// Mapping playlist theo từng quốc gia/khu vực trên Deezer
const COUNTRY_PLAYLISTS = {
  vn: '8925646822', // Top Hits Vietnam
  vpop: '8925646822',
  kr: '4096400722', // Top K-Pop
  kpop: '4096400722',
  us: null, // US-UK dùng chart/0/tracks mặc định
  usuk: null
};

/**
 * Lấy danh sách bài hát thuộc BXH / Top trending theo quốc gia
 * @param {number} limit - Số lượng bài hát muốn lấy (mặc định 20)
 * @param {string} country - Mã quốc gia ('vn', 'us', 'kr')
 */
const getTopSongs = async (limit = 20, country = null) => {
  try {
    let url = `${DEEZER_BASE_URL}/chart/0/tracks`;
    const normalizedCountry = country ? country.toLowerCase().trim() : null;

    if (normalizedCountry && COUNTRY_PLAYLISTS[normalizedCountry]) {
      url = `${DEEZER_BASE_URL}/playlist/${COUNTRY_PLAYLISTS[normalizedCountry]}/tracks`;
    }

    const response = await axios.get(url, {
      params: { limit },
      timeout: 10000
    });

    const tracks = response.data?.data || [];
    return tracks.map(formatTrack);
  } catch (error) {
    console.error('Lỗi khi lấy BXH bài hát:', error.message);
    throw new Error('Không thể lấy danh sách bài hát BXH: ' + error.message);
  }
};

/**
 * Tìm kiếm bài hát theo từ khóa
 * @param {string} query - Từ khóa tìm kiếm (tên bài hát, ca sĩ, album)
 * @param {number} limit - Số lượng kết quả trả về (mặc định 20)
 */
const searchSongs = async (query, limit = 20) => {
  try {
    if (!query || !query.trim()) {
      return [];
    }

    const response = await axios.get(`${DEEZER_BASE_URL}/search`, {
      params: {
        q: query.trim(),
        limit
      },
      timeout: 10000
    });

    const tracks = response.data?.data || [];
    return tracks.map(formatTrack);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm bài hát:', error.message);
    throw new Error('Không thể tìm kiếm bài hát: ' + error.message);
  }
};

/**
 * Lấy thông tin chi tiết bài hát theo ID (kèm lời bài hát và gợi ý bài hát liên quan)
 * @param {string} songId - ID của bài hát
 */
const getSongById = async (songId) => {
  try {
    const response = await axios.get(`${DEEZER_BASE_URL}/track/${songId}`, {
      timeout: 10000
    });

    if (response.data?.error) {
      throw new Error(response.data.error.message || 'Không tìm thấy bài hát');
    }

    const track = response.data;
    const formatted = formatTrack(track);

    // 1. Lấy danh sách bài hát gợi ý liên quan (từ cùng nghệ sĩ)
    let relatedSongs = [];
    if (track.artist?.id) {
      try {
        const relatedRes = await axios.get(`${DEEZER_BASE_URL}/artist/${track.artist.id}/top`, {
          params: { limit: 10 },
          timeout: 5000
        });
        const relatedTracks = relatedRes.data?.data || [];
        relatedSongs = relatedTracks
          .filter((t) => String(t.id) !== String(songId))
          .slice(0, 8)
          .map(formatTrack);
      } catch (err) {
        console.warn('Không thể lấy bài hát gợi ý:', err.message);
      }
    }

    // 2. Thử lấy lời bài hát từ lyrics API công khai
    let lyrics = null;
    try {
      const lyricsRes = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist.name)}/${encodeURIComponent(track.title)}`,
        { timeout: 3500 }
      );
      if (lyricsRes.data?.lyrics) {
        lyrics = lyricsRes.data.lyrics.trim();
      }
    } catch (err) {
      // Bỏ qua nếu bài hát chưa có lời trên lyrics.ovh
    }

    return {
      ...formatted,
      artistId: String(track.artist?.id || ''),
      albumId: String(track.album?.id || ''),
      releaseDate: track.release_date || null,
      bpm: track.bpm || null,
      lyrics: lyrics || null,
      relatedSongs
    };
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin bài hát ${songId}:`, error.message);
    throw new Error('Không thể lấy thông tin bài hát: ' + error.message);
  }
};

/**
 * Lấy thông tin nghệ sĩ và danh sách các ca khúc nổi bật nhất
 * @param {string} name - Tên nghệ sĩ
 */
const getArtistDetails = async (name) => {
  try {
    if (!name || !name.trim()) {
      throw new Error('Vui lòng cung cấp tên nghệ sĩ');
    }

    // 1. Tìm kiếm nghệ sĩ theo tên
    const searchRes = await axios.get(`${DEEZER_BASE_URL}/search/artist`, {
      params: { q: name.trim(), limit: 1 },
      timeout: 10000
    });

    const artist = searchRes.data?.data?.[0];

    if (!artist) {
      // Nếu không tìm thấy profile nghệ sĩ, tìm kiếm bài hát theo tên này làm fallback
      const fallbackSongs = await searchSongs(name, 20);
      return {
        id: 'artist-' + Date.now(),
        name: name.trim(),
        picture: fallbackSongs[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        nb_album: 0,
        nb_fan: 0,
        topSongs: fallbackSongs
      };
    }

    // 2. Lấy danh sách bài hát nổi bật nhất của nghệ sĩ
    let topSongs = [];
    try {
      const topRes = await axios.get(`${DEEZER_BASE_URL}/artist/${artist.id}/top`, {
        params: { limit: 25 },
        timeout: 8000
      });
      topSongs = (topRes.data?.data || []).map(formatTrack);
    } catch (err) {
      console.warn('Lỗi khi lấy top bài hát của nghệ sĩ:', err.message);
    }

    return {
      id: String(artist.id),
      name: artist.name,
      picture: artist.picture_xl || artist.picture_big || artist.picture_medium || '',
      nb_album: artist.nb_album || 0,
      nb_fan: artist.nb_fan || 0,
      topSongs
    };
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin nghệ sĩ ${name}:`, error.message);
    throw new Error('Không thể lấy thông tin nghệ sĩ: ' + error.message);
  }
};

/**
 * Lấy link stream audio để phát nhạc trực tuyến
 * @param {string} songId - ID của bài hát
 */
const getStreamUrl = async (songId) => {
  try {
    const song = await getSongById(songId);
    if (!song || !song.audioUrl) {
      throw new Error('Bài hát không có sẵn luồng audio phát trực tuyến');
    }

    return {
      songId: song.songId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      streamUrl: song.audioUrl
    };
  } catch (error) {
    console.error(`Lỗi khi lấy link stream cho bài hát ${songId}:`, error.message);
    throw new Error('Không thể lấy link phát nhạc: ' + error.message);
  }
};

module.exports = {
  getTopSongs,
  searchSongs,
  getSongById,
  getArtistDetails,
  getStreamUrl
};
