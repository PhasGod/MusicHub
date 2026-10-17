const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware bảo vệ các route yêu cầu đăng nhập
 */
const protect = async (req, res, next) => {
  let token;

  // Lấy token từ header Authorization theo dạng: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user theo id từ payload, loại trừ mật khẩu
      const currentUser = await User.findById(decoded.id).select('-password');

      if (!currentUser) {
        return res.status(401).json({
          status: 'fail',
          message: 'Tài khoản gắn với token này không còn tồn tại'
        });
      }

      // Gắn thông tin người dùng vào request
      req.user = currentUser;
      return next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
        });
      }

      return res.status(401).json({
        status: 'fail',
        message: 'Token không hợp lệ hoặc không có quyền truy cập'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Vui lòng cung cấp token đăng nhập (Bearer token)'
    });
  }
};

module.exports = { protect };
