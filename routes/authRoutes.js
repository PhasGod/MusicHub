const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * Hàm tạo JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Hạn sử dụng 30 ngày
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản người dùng mới
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng điền đầy đủ username, email và password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự'
      });
    }

    // Kiểm tra trùng username hoặc email
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Tên người dùng';
      return res.status(400).json({
        status: 'fail',
        message: `${field} này đã được sử dụng`
      });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: avatar || undefined
    });

    // Tạo token
    const token = generateToken(newUser._id);

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi đăng ký'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập tài khoản & nhận JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Tạo token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi đăng nhập'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin người dùng đang đăng nhập
 * @access  Private (yêu cầu JWT)
 */
router.get('/me', protect, async (req, res) => {
  res.json({
    status: 'success',
    user: req.user
  });
});

module.exports = router;
