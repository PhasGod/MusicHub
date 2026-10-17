import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import SongDetail from './pages/SongDetail';
import ArtistDetail from './pages/ArtistDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MusicProvider>
          <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white font-sans select-none">
            {/* Khu vực chính: Sidebar bên trái và Nội dung cuộn ở giữa */}
            <div className="flex flex-1 h-[calc(100vh-80px)] overflow-hidden">
              <Sidebar />

              {/* Vùng nội dung chính */}
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-black">
                {/* Header cố định trên đỉnh của khung nội dung */}
                <Header />

                {/* Vùng nội dung cuộn thay đổi theo Router */}
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/playlist/:id" element={<PlaylistDetail />} />
                    <Route path="/song/:id" element={<SongDetail />} />
                    <Route path="/artist/:name" element={<ArtistDetail />} />
                    {/* Điều hướng mặc định nếu route không tồn tại */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>

            {/* Trình phát nhạc cố định dưới đáy màn hình */}
            <Player />

            {/* Modal Đăng nhập / Đăng ký toàn cục */}
            <AuthModal />
          </div>
        </MusicProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
