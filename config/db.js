const mongoose = require('mongoose');
const dns = require('dns');

// Thiết lập DNS Google để khắc phục lỗi "querySrv ECONNREFUSED" thường gặp trên Windows & mạng Việt Nam
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('Không thể gán DNS tuỳ chỉnh, dùng DNS mặc định của hệ thống.');
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Kết nối MongoDB Atlas thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.warn('⚠️ Gợi ý: Hãy mở file .env và thay thế "mat_khau_that_cua_ban" bằng mật khẩu thật của Database User trên MongoDB Atlas.');
    }
  }
};

module.exports = connectDB;
