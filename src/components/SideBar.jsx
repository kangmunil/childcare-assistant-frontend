import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, NotebookPen, BookOpen, Settings, LogOut } from 'lucide-react';
import useStore from '../store/useStore';

const SideBar = () => {
  const { logout } = useStore();
  const menuItems = [
    { id: 'dashboard', label: '홈 대시보드', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'calendar', label: '육아 캘린더', icon: Calendar, path: '/calendar' },
    { id: 'record', label: '성장 기록', icon: NotebookPen, path: '/record' },
    { id: 'guide', label: '육아 가이드', icon: BookOpen, path: '/guide' },
    { id: 'settings', label: '가족 설정', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="bg-white h-full w-64 border-r border-gray-100 flex flex-col p-6">
       {/* 로고 영역 */}
       <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-amber-200">
                B
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tight">BebeHelper</span>
       </div>
       
       {/* 메뉴 리스트 */}
       <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
             <NavLink 
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                   `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      isActive 
                      ? 'bg-amber-100 text-amber-900 shadow-sm' 
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                   }`
                }
             >
                <item.icon className="w-5 h-5" />
                {item.label}
             </NavLink>
          ))}
       </nav>

       {/* 하단 로그아웃 등 */}
       <div className="pt-6 border-t border-gray-100 mt-auto">
            <button onClick={logout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
                로그아웃
            </button>
       </div>
    </div>
  );
};

export default SideBar;