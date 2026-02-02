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
    <div className="w-64 md:w-20 lg:w-72 bg-white dark:bg-gray-800 h-full border-r border-stone-200 dark:border-gray-700 flex flex-col px-4 md:px-3 lg:px-6 py-8 shadow-sm transition-all duration-300 ease-out overflow-hidden">
      
      {/* 로고 영역 */}
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-amber-400 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none">
            <span className="text-white text-xl font-bold">B</span>
        </div>        
        <span className="text-xl font-serif-kr font-bold text-stone-800 dark:text-white transition-all duration-300 whitespace-nowrap md:hidden lg:block">
          BebeHelper
        </span>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 space-y-3 md:space-y-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center lg:justify-start gap-4 px-3 py-3.5 rounded-2xl transition-all duration-300 ease-out font-medium group ${
                isActive
                  ? 'bg-amber-50 text-amber-600 shadow-sm dark:bg-gray-700 dark:text-amber-400'
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-6 h-6 flex-shrink-0" />
            <span className="text-[15px] transition-all duration-300 whitespace-nowrap md:hidden lg:block">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* 로그아웃 버튼 */}
      <button 
        onClick={handleLogout}        
        className="flex items-center justify-center lg:justify-start gap-4 px-3 py-3.5 text-stone-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all duration-300 ease-out mt-auto"
      >
        <LogOut className="w-6 h-6 flex-shrink-0" />
        <span className="text-[15px] font-medium transition-all duration-300 whitespace-nowrap md:hidden lg:block">
          로그아웃
        </span>
      </button>
    </div>
  );
};

export default SideBar;