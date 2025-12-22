import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen, Settings } from 'lucide-react';
import useStore from './store/useStore'; 

// 페이지들
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import RecordPage from './pages/RecordPage'; 
import PlaceholderPage from './pages/PlaceholderPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

import SideBar from './components/SideBar'; 
import BottomNavBar from './components/BottomNavBar';
import ChatWindow, { FloatingChatButton } from './components/ChatWindow';
import Header from './components/Header';

// MainLayout: 사이드바, 헤더, 채팅창이 있는 '메인 화면' 껍데기
const MainLayout = ({ children }) => {
    return (
        <div className="h-screen bg-[#F9F8F6] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden flex flex-col md:flex-row">
            
            {/* 사이드바 (PC) */}
            <div className="hidden md:block relative z-20 h-full shrink-0"><SideBar /></div>
            
            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                <div className="shrink-0 px-4 pt-2 md:px-6 md:pt-4 lg:px-8 lg:pt-6 pb-0 z-30">
                    <Header />
                </div>
                
                {/* ▼▼▼ [수정됨] 스크롤 통 (여기선 padding을 뺍니다) ▼▼▼ */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 scroll-smooth custom-scrollbar no-scrollbar">
                    
                    {/* ▼▼▼ [핵심 수정] 여기에 padding을 주고, h-full을 min-h-full로 변경 ▼▼▼ */}
                    {/* min-h-full: 내용이 적어도 화면 꽉 참, 많으면 늘어남 */}
                    {/* pb-40: 맨 밑에 물리적인 빈 공간 160px 강제 추가 (메뉴바/챗봇 자리) */}
                    <div className="max-w-6xl mx-auto min-h-full pb-40 md:pb-12 animate-fade-in flex flex-col">
                        <div className="flex-1 flex flex-col">
                            {children}
                        </div>
                    </div>

                </div>
            </main>
            
            {/* 하단바 (모바일) */}
            <BottomNavBar />
            
            {/* 채팅 기능 */}
            <ChatWindowWrapper /> 
        </div>
    );
};

const ChatWindowWrapper = () => {
    const { isChatOpen } = useStore();
    return (
        <>
            {isChatOpen && <ChatWindow />}
            <FloatingChatButton />
        </>
    );
}

function App() {
  return (
    <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
        <Route path="/record" element={<MainLayout><RecordPage /></MainLayout>} />
        <Route path="/guide" element={<MainLayout><PlaceholderPage title="육아 가이드" icon={BookOpen} color="bg-emerald-400" /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;