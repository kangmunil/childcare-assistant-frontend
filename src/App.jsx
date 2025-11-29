import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotebookPen, BookOpen, Settings } from 'lucide-react';
import useStore from './store/useStore'; 

// 페이지들
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import RecordPage from './pages/RecordPage'; 
import PlaceholderPage from './pages/PlaceholderPage';

// 컴포넌트들
import SideBar from './components/SideBar';
import BottomNavBar from './components/BottomNavBar';
import Header from './components/Header';
import ChatWindow, { FloatingChatButton } from './components/ChatWindow';

// 로그인 안 했으면 로그인 페이지(/)로 쫓아냄
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useStore();
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const MainLayout = ({ children }) => {
    return (
        <div className="h-screen bg-[#FDFCF8] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden flex flex-col md:flex-row">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-pink-200/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="hidden md:block relative z-20 h-full shrink-0"><SideBar /></div>
            <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto h-full animate-fade-in flex flex-col">
                        <Header />
                        <div className="flex-1 min-h-0">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
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
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><MainLayout><CalendarPage /></MainLayout></ProtectedRoute>} />
        <Route path="/record" element={<ProtectedRoute><MainLayout><RecordPage /></MainLayout></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><MainLayout><PlaceholderPage title="육아 가이드" icon={BookOpen} color="bg-emerald-400" /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><MainLayout><PlaceholderPage title="설정 관리" icon={Settings} color="bg-gray-400" /></MainLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
import { Calendar, NotebookPen, BookOpen, Settings, User } from 'lucide-react';
import useStore from './store/useStore'; 
import CalendarPage from './pages/CalendarPage';
// 컴포넌트 Import
import SideBar from './components/SideBar';
import BottomNavBar from './components/BottomNavBar';
import ChatWindow, { FloatingChatButton } from './components/ChatWindow';

// 페이지 Import
import DashboardPage from './pages/DashboardPage';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  const { activePage, isChatOpen } = useStore();

  return (
    <div className="h-screen bg-[#FDFCF8] font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden flex flex-col md:flex-row">
        
        {/* Background Ambient Light */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-200/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-pink-200/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Sidebar (PC) - Fixed Width */}
        <div className="hidden md:block relative z-20 h-full shrink-0">
             <SideBar />
        </div>

        {/* Main Content Area - Scrollable internally */}
        <main className="flex-1 relative z-10 h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                     <div className="max-w-6xl mx-auto h-full animate-fade-in">
                        {activePage === 'dashboard' && <DashboardPage />}
                        
                        {/* 2. activePage가 'calendar'일 때 CalendarPage 렌더링 */}
                        {activePage === 'calendar' && <CalendarPage />} 
                        
                        {activePage === 'record' && <PlaceholderPage title="성장 기록" icon={NotebookPen} color="bg-rose-400" />}
                        {activePage === 'guide' && <PlaceholderPage title="육아 가이드" icon={BookOpen} color="bg-emerald-400" />}
                        {(activePage === 'child_management' || activePage === 'family_management') && <PlaceholderPage title="설정 관리" icon={Settings} color="bg-gray-400" />}
                    </div>
                </div>
            </main>

        {/* Navbar (Mobile) */}
        <BottomNavBar />

        {/* Chat Features */}
        {isChatOpen && <ChatWindow />}
        <FloatingChatButton />
        
    </div>
  );
}

export default App;
