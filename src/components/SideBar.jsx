import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, NotebookPen, BookOpen, Settings, LogOut, Baby } from 'lucide-react';
import useStore from '../store/useStore';

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useStore(); 

  // 현재 경로가 활성화되었는지 확인
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: '홈 대시보드', icon: Home },
    { path: '/calendar', label: '육아 캘린더', icon: Calendar },
    { path: '/record', label: '성장 기록', icon: NotebookPen },
    { path: '/guide', label: '육아 가이드', icon: BookOpen },
    { path: '/settings', label: '가족 설정', icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col p-6">
      {/* 로고 영역 */}
      <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-200">
          <Baby className="w-5 h-5" />
        </div>
        <span className="text-xl font-black text-gray-800 tracking-tight">BebeHelper</span>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${
              isActive(item.path)
                ? 'bg-amber-50 text-amber-600 shadow-sm'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* 하단 로그아웃 */}
      <div className="mt-auto pt-6 border-t border-gray-100">
        <button 
            onClick={() => {
                // 로그아웃 처리 후 로그인 페이지로 이동 (나중에 구현)
                if(window.confirm('로그아웃 하시겠습니까?')) {
                    logout();
                    navigate('/');
                }
            }}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors text-sm font-bold w-full"
        >
            <LogOut className="w-5 h-5" />
            로그아웃
        </button>
      </div>
    </div>
  );
};

export default SideBar;