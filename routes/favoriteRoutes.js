const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/authMiddleware');

// Tất cả các routes trong file này đều yêu cầu đăng nhập
router.use(protect);

/**
 * @route   GET /api/favorites
 * @desc    Lấy danh sách tất cả bài hát yêu thích của user hiện tại
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      status: 'success',
      total: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu thích:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy danh sách yêu thích'
    });
  }
});

/**
 * @route   GET /api/favorites/check/:songId
 * @desc    Kiểm tra một bài hát đã được user yêu thích hay chưa
 * @access  Private
 */
router.get('/check/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const exists = await Favorite.exists({
      userId: req.user._id,
      songId: String(songId)
    });

    res.json({
      status: 'success',
      songId,
      isFavorite: Boolean(exists)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/favorites
 * @desc    Thêm một bài hát vào danh sách yêu thích
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { songId, title, artist, thumbnail, duration, audioUrl } = req.body;

    if (!songId || !title || !artist) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ thông tin: songId, title và artist'
      });
    }

    // Kiểm tra xem bài hát đã được yêu thích chưa
    const existing = await Favorite.findOne({
      userId: req.user._id,
      songId: String(songId)
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bài hát này đã có trong danh sách yêu thích'
      });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      songId: String(songId),
      title: title.trim(),
      artist: artist.trim(),
      thumbnail: thumbnail || '',
      duration: duration || 0,
      audioUrl: audioUrl || ''
    });

    res.status(201).json({
      status: 'success',
      message: 'Đã thêm bài hát vào danh sách yêu thích',
      data: favorite
    });
  } catch (error) {
    console.error('Lỗi thêm bài hát yêu thích:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi thêm bài hát yêu thích'
    });
  }
});

/**
 * @route   DELETE /api/favorites/:songId
 * @desc    Xóa bài hát khỏi danh sách yêu thích theo songId
 * @access  Private
 */
router.delete('/:songId', async (req, res) => {
  try {
    const { songId } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      userId: req.user._id,
      songId: String(songId)
    });

    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Bài hát không tồn tại trong danh sách yêu thích của bạn'
      });
    }

    res.json({
      status: 'success',
      message: 'Đã xóa bài hát khỏi danh sách yêu thích',
      data: deleted
    });
  } catch (error) {
    console.error('Lỗi xóa bài hát yêu thích:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi xóa bài hát yêu thích'
    });
  }
});

module.exports = router;
