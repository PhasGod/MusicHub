const mongoose = require('mongoose');

// Schema phụ cho từng bài hát trong danh sách phát
const songItemSchema = new mongoose.Schema(
  {
    songId: {
      type: String,
      required: [true, 'ID bài hát là bắt buộc']
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
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const playlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Playlist phải thuộc về một User'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên Playlist'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80'
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    songs: [songItemSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Playlist', playlistSchema);
