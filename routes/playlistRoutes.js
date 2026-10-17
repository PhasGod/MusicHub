const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { protect } = require('../middleware/authMiddleware');

// Tất cả routes playlist dưới đây đều yêu cầu đăng nhập
router.use(protect);

/**
 * @route   GET /api/playlists
 * @desc    Lấy danh sách playlist của người dùng hiện tại
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user._id })
      .select('-songs') // Ẩn danh sách bài hát chi tiết để giảm kích thước payload
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      total: playlists.length,
      data: playlists
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy danh sách playlist'
    });
  }
});

/**
 * @route   POST /api/playlists
 * @desc    Tạo một playlist mới
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, thumbnail, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tên playlist không được để trống'
      });
    }

    const newPlaylist = await Playlist.create({
      userId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      thumbnail: thumbnail || undefined,
      isPublic: isPublic !== undefined ? isPublic : true,
      songs: []
    });

    res.status(201).json({
      status: 'success',
      message: 'Tạo playlist thành công',
      data: newPlaylist
    });
  } catch (error) {
    console.error('Lỗi tạo playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi tạo playlist'
    });
  }
});

/**
 * @route   GET /api/playlists/:id
 * @desc    Lấy chi tiết một playlist kèm toàn bộ bài hát
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('userId', 'username avatar');

    if (!playlist) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy playlist'
      });
    }

    // Nếu playlist riêng tư và không phải của user hiện tại
    if (!playlist.isPublic && playlist.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền truy cập playlist riêng tư này'
      });
    }

    res.json({
      status: 'success',
      data: playlist
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy chi tiết playlist'
    });
  }
});

/**
 * @route   PUT /api/playlists/:id
 * @desc    Cập nhật thông tin playlist (tên, mô tả, ảnh, chế độ công khai)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy playlist'
      });
    }

    // Kiểm tra quyền sở hữu
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền chỉnh sửa playlist này'
      });
    }

    const { name, description, thumbnail, isPublic } = req.body;
    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (thumbnail) playlist.thumbnail = thumbnail;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    const updated = await playlist.save();

    res.json({
      status: 'success',
      message: 'Cập nhật playlist thành công',
      data: updated
    });
  } catch (error) {
    console.error('Lỗi cập nhật playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi cập nhật playlist'
    });
  }
});

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Xóa một playlist
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy playlist'
      });
    }

    // Kiểm tra quyền sở hữu
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền xóa playlist này'
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Đã xóa playlist thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi xóa playlist'
    });
  }
});

/**
 * @route   POST /api/playlists/:id/songs
 * @desc    Thêm một bài hát vào playlist
 * @access  Private
 */
router.post('/:id/songs', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy playlist'
      });
    }

    // Kiểm tra quyền sở hữu
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền thêm bài hát vào playlist này'
      });
    }

    const { songId, title, artist, thumbnail, duration, audioUrl } = req.body;

    if (!songId || !title || !artist) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp đầy đủ thông tin: songId, title và artist'
      });
    }

    // Kiểm tra xem bài hát đã có trong playlist chưa
    const alreadyExists = playlist.songs.some((song) => song.songId === String(songId));
    if (alreadyExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bài hát này đã có sẵn trong playlist'
      });
    }

    // Thêm bài hát vào danh sách
    playlist.songs.push({
      songId: String(songId),
      title: title.trim(),
      artist: artist.trim(),
      thumbnail: thumbnail || '',
      duration: duration || 0,
      audioUrl: audioUrl || ''
    });

    await playlist.save();

    res.status(201).json({
      status: 'success',
      message: 'Đã thêm bài hát vào playlist',
      totalSongs: playlist.songs.length,
      data: playlist
    });
  } catch (error) {
    console.error('Lỗi thêm bài hát vào playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi thêm bài hát vào playlist'
    });
  }
});

/**
 * @route   DELETE /api/playlists/:id/songs/:songId
 * @desc    Xóa một bài hát khỏi playlist
 * @access  Private
 */
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy playlist'
      });
    }

    // Kiểm tra quyền sở hữu
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền sửa playlist này'
      });
    }

    const { songId } = req.params;
    const initialCount = playlist.songs.length;

    playlist.songs = playlist.songs.filter((song) => song.songId !== String(songId));

    if (playlist.songs.length === initialCount) {
      return res.status(404).json({
        status: 'fail',
        message: 'Bài hát không tồn tại trong playlist'
      });
    }

    await playlist.save();

    res.json({
      status: 'success',
      message: 'Đã xóa bài hát khỏi playlist',
      totalSongs: playlist.songs.length,
      data: playlist
    });
  } catch (error) {
    console.error('Lỗi xóa bài hát khỏi playlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi xóa bài hát khỏi playlist'
    });
  }
});

module.exports = router;
