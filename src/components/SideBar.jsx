import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  PenTool, 
  BookOpen, 
  Settings, 
  LogOut,
  Users 
} from 'lucide-react';
import useStore from '../store/useStore'; 

const SideBar = () => {
  const { logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: '홈 대시보드', path: '/dashboard' },
    { icon: Calendar, label: '육아 캘린더', path: '/calendar' },
    { icon: PenTool, label: '성장 기록', path: '/record' },
    { icon: Users, label: '육아 커뮤니티', path: '/community' },
    { icon: BookOpen, label: '육아 가이드', path: '/guide' },
    { icon: Settings, label: '가족 설정', path: '/settings' },
  ];

  return (
      <div className="w-64 bg-white dark:bg-gray-800 h-full border-r border-stone-200 dark:border-gray-700 flex flex-col p-6 shadow-sm transition-colors duration-300">
      
      {/* 로고 영역 */}
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">B</span>
        </div>        
        <span className="text-xl font-serif-kr font-bold text-stone-800 dark:text-white transition-colors duration-300">
          BebeHelper
        </span>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${
                isActive
                  
                  ? 'bg-amber-50 text-amber-600 shadow-sm dark:bg-gray-700 dark:text-amber-400'
                  
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 로그아웃 버튼 */}
      <button 
        onClick={handleLogout}        
        className="flex items-center gap-3 px-4 py-3 text-stone-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">로그아웃</span>
      </button>
    </div>
  );
};

export default SideBar;