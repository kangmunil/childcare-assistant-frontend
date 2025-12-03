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

// 아직 로그인/헤더 컴포넌트가 없을 수 있어서 주석 처리하거나 간소화했습니다.
// 나중에 로그인 페이지 만드시면 ProtectedRoute 적용하면 됩니다.

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
            
            {/* 메인 콘텐츠 */}
            <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto h-full animate-fade-in flex flex-col">
                        {/* <Header /> 헤더가 있다면 주석 해제하세요 */}
                        <div className="flex-1 min-h-0">
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
        {/* 기본 경로(/)로 오면 대시보드로 바로 이동시킴 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 각 페이지 연결 */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
        <Route path="/record" element={<MainLayout><RecordPage /></MainLayout>} />
        
        {/* 아직 안 만든 페이지들 */}
        <Route path="/guide" element={<MainLayout><PlaceholderPage title="육아 가이드" icon={BookOpen} color="bg-emerald-400" /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><PlaceholderPage title="설정 관리" icon={Settings} color="bg-gray-400" /></MainLayout>} />

        {/* 이상한 주소로 오면 대시보드로 보냄 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;