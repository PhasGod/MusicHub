const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');

/**
 * @route   GET /api/music/chart (hoặc /api/music/top)
 * @desc    Lấy danh sách bài hát thuộc Bảng xếp hạng (Top Trending)
 * @access  Public
 */
router.get('/chart', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const country = req.query.country || null;
    const songs = await musicService.getTopSongs(limit, country);

    res.json({
      status: 'success',
      country: country || 'all',
      total: songs.length,
      data: songs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Alias cho /chart
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const country = req.query.country || null;
    const songs = await musicService.getTopSongs(limit, country);

    res.json({
      status: 'success',
      country: country || 'all',
      total: songs.length,
      data: songs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/music/search
 * @desc    Tìm kiếm bài hát theo từ khóa (?q=...)
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp từ khóa tìm kiếm (tham số ?q=...)'
      });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const songs = await musicService.searchSongs(q, limit);

    res.json({
      status: 'success',
      query: q,
      total: songs.length,
      data: songs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/music/stream/:id
 * @desc    Lấy link stream audio để phát bài hát
 * @access  Public
 */
router.get('/stream/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const streamData = await musicService.getStreamUrl(songId);

    res.json({
      status: 'success',
      data: streamData
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/music/song/:id
 * @desc    Lấy chi tiết một bài hát theo ID
 * @access  Public
 */
router.get('/song/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const song = await musicService.getSongById(songId);

    res.json({
      status: 'success',
      data: song
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/music/artist/:name
 * @desc    Lấy thông tin nghệ sĩ và các bài hát nổi bật nhất
 * @access  Public
 */
router.get('/artist/:name', async (req, res) => {
  try {
    const artistName = decodeURIComponent(req.params.name);
    const artistData = await musicService.getArtistDetails(artistName);

    res.json({
      status: 'success',
      data: artistData
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
