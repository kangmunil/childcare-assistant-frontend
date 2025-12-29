import React, { useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react'; 
import useStore from './store/useStore'; 

// 페이지들
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import RecordPage from './pages/RecordPage'; 
import GuidePage from './pages/GuidePage'; 
import PlaceholderPage from './pages/PlaceholderPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CommunityPage from './pages/CommunityPage';
import PostWritePage from './pages/PostWritePage';
import PostDetailPage from './pages/PostDetailPage';
import ChildSetupPage from './pages/ChildSetupPage'; 

import SideBar from './components/SideBar'; 
import BottomNavBar from './components/BottomNavBar';
import ChatWindow, { FloatingChatButton } from './components/ChatWindow';
import Header from './components/Header';

// MainLayout: 사이드바, 헤더, 채팅창이 있는 '메인 화면' 껍데기
const MainLayout = ({ children }) => {
    return (
        <div className="h-screen bg-[#F9F8F6] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-900 dark:selection:text-amber-100 overflow-hidden flex flex-col md:flex-row transition-colors duration-300">
            
            {/* 사이드바 (PC) */}
            <div className="hidden md:block relative z-20 h-full shrink-0"><SideBar /></div>
            
            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                <div className="shrink-0 px-4 pt-2 md:px-6 md:pt-4 lg:px-8 lg:pt-6 pb-0 z-30">
                    <Header />
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 scroll-smooth custom-scrollbar no-scrollbar">
                    
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
  // 필요한 액션들 가져오기
  const { initTheme, checkSession, fetchUserInfo } = useStore();

  useEffect(() => {
    initTheme(); // 테마 초기화

    // 앱 시작 시 로그인 체크 및 정보 갱신 로직 추가
    const initApp = async () => {
      // 1. 세션 복구 (새로고침 해도 로그인 유지)
      await checkSession(); 
      
      // 2. 로그인이 확인되면 백엔드에서 최신 유저 정보(이름 등) 가져오기
      // (useStore.getState()를 쓰면 가장 최신 상태를 확실하게 가져올 수 있음)
      if (useStore.getState().isLoggedIn) {
        fetchUserInfo();
      }
    };

    initApp();
  }, [initTheme, checkSession, fetchUserInfo]);

  return (
    <Routes>
        {/* --- 인증 관련 (Layout 없음) --- */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/child-setup" element={<ChildSetupPage />} />
        
        {/* --- 메인 앱 (Layout 적용) --- */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
        <Route path="/record" element={<MainLayout><RecordPage /></MainLayout>} />
        <Route path="/guide" element={<MainLayout><GuidePage /></MainLayout>} /> 
        <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
        <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
        
        <Route path="/community/write" element={<PostWritePage />} />
        <Route path="/community/:id" element={<PostDetailPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;