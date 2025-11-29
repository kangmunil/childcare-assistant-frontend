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
import { Home, Calendar, NotebookPen, BookOpen, User, Settings } from 'lucide-react';
// 1. Zustand 스토어 불러오기
import useStore from '../store/useStore';

// 2. 파라미터에서 { activePage, setActivePage } 제거 (Props 안 씀)
const SideBar = () => {
    // 3. 스토어에서 직접 상태(activePage)와 변경함수(setActivePage) 가져오기
    const { activePage, setActivePage } = useStore();

    const navItems = [
        { name: 'dashboard', label: '홈 대시보드', icon: Home, type: 'primary' },        
        { name: 'calendar', label: '육아 캘린더', icon: Calendar, type: 'primary' },
        { name: 'record', label: '성장 기록', icon: NotebookPen, type: 'primary' },
        { name: 'guide', label: '육아 가이드', icon: BookOpen, type: 'primary' },
    ];

    const settingsItems = [
         { name: 'child_management', label: '아이 관리', icon: User },
         { name: 'family_management', label: '가족 설정', icon: Settings },
    ];
    
    return (
        <aside className="hidden md:flex flex-col w-[280px] h-screen sticky top-0 p-6 z-20">
            <div className="flex-1 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-white/50 p-6 flex flex-col">
                
                {/* Logo */}
                <div className="mb-10 px-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <span className="text-2xl font-black text-gray-800 tracking-tight">Bebe<span className="text-amber-500">Helper</span></span>
                </div>

                {/* Menu */}
                <div className="space-y-8 flex-1">
                    <div>
                        <p className="px-4 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Menu</p>
                        <nav className="space-y-2">
                            {navItems.map((item) => {                                
                                const isActive = activePage === item.name;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}                                        
                                        onClick={() => setActivePage(item.name)}                                        
                                        className={`w-full flex items-center p-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                                            isActive 
                                                ? 'bg-amber-100 text-amber-700 shadow-md shadow-amber-100/50' 
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                                        {item.label}
                                        {/* 활성화 시 우측에 포인트 점 표시 */}
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div>
                        <p className="px-4 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Settings</p>
                        <nav className="space-y-2">
                             {settingsItems.map((item) => {
                                const isActive = activePage === item.name;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => setActivePage(item.name)}
                                        className={`w-full flex items-center p-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                                            isActive 
                                                ? 'bg-gray-100 text-gray-800' 
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 mr-3 text-gray-400" strokeWidth={2} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Profile */}
                <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-10 h-10 rounded-full bg-amber-100 border-2 border-white shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">지우맘</p>
                            <p className="text-xs text-gray-400 truncate">프리미엄 멤버</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SideBar;