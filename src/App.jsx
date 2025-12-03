import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotebookPen, BookOpen, Settings } from 'lucide-react';
import useStore from './store/useStore'; 

// 페이지들
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import RecordPage from './pages/RecordPage'; 
import PlaceholderPage from './pages/PlaceholderPage';

// 컴포넌트들
import SideBar from './components/SideBar';
import BottomNavBar from './components/BottomNavBar';
import ChatWindow, { FloatingChatButton } from './components/ChatWindow';
import Header from './components/Header'; // ★ [New] 만든 헤더 불러오기

const MainLayout = ({ children }) => {
    return (
        <div className="h-screen bg-[#FDFCF8] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden flex flex-col md:flex-row">
            {/* 배경 효과 */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-pink-200/20 rounded-full blur-[100px]"></div>
            </div>

            {/* 사이드바 (PC) */}
            <div className="hidden md:block relative z-20 h-full shrink-0"><SideBar /></div>
            
            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                
                {/* ★ [핵심] 헤더를 여기에 고정! (shrink-0으로 찌그러짐 방지) */}
                <div className="shrink-0 px-4 pt-2 md:px-6 md:pt-4 lg:px-8 lg:pt-6 pb-0 z-30">
                    <Header />
                </div>

                {/* 실제 페이지 내용 (여기만 스크롤됨) */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-4 scroll-smooth custom-scrollbar">
                    <div className="max-w-6xl mx-auto h-full animate-fade-in flex flex-col">
                        <div className="flex-1 min-h-0 flex flex-col">
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
        <Route path="/record" element={<MainLayout><RecordPage /></MainLayout>} />
        <Route path="/guide" element={<MainLayout><PlaceholderPage title="육아 가이드" icon={BookOpen} color="bg-emerald-400" /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><PlaceholderPage title="설정 관리" icon={Settings} color="bg-gray-400" /></MainLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;