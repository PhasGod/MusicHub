const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Favorite phải thuộc về một User'],
      index: true
    },
    songId: {
      type: String,
      required: [true, 'ID bài hát là bắt buộc'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Tên bài hát là bắt buộc'],
      trim: true
    },
    artist: {
      type: String,
      required: [true, 'Tên ca sĩ / nghệ sĩ là bắt buộc'],
      trim: true
    },
    thumbnail: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 0 // Thời lượng tính bằng giây
    },
    audioUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Đảm bảo mỗi người dùng chỉ thêm 1 bài hát vào danh sách yêu thích một lần
favoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
