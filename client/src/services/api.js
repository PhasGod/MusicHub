// Cấu hình URL gốc của backend API
// Tự động lấy từ biến môi trường VITE_API_BASE_URL (trên Vercel)
// hoặc fallback về domain Render đã deploy
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://musichub-qddm.onrender.com'
).replace(/\/+$/, '');

export default API_BASE_URL;
