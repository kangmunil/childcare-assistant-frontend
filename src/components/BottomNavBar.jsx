import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, NotebookPen, BookOpen, Settings } from 'lucide-react';

const BottomNavBar = () => {
  const menuItems = [
    { id: 'dashboard', label: '홈', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'calendar', label: '캘린더', icon: Calendar, path: '/calendar' },
    { id: 'record', label: '기록', icon: NotebookPen, path: '/record' },
    { id: 'guide', label: '가이드', icon: BookOpen, path: '/guide' },
    { id: 'settings', label: '설정', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 pb-safe">
        {menuItems.map((item) => (
            <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                    `flex flex-col items-center gap-1 transition-colors ${
                        isActive ? 'text-amber-500' : 'text-gray-300'
                    }`
                }
            >
                <item.icon className="w-6 h-6" strokeWidth={2.5} />
                <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
        ))}
    </div>
  );
};

export default BottomNavBar;
import { Home, Calendar, NotebookPen, BookOpen } from 'lucide-react';
import useStore from '../store/useStore';

const BottomNavBar = () => {
    const { activePage, setActivePage } = useStore();
    const navItems = [
        { name: 'dashboard', label: '홈', icon: Home },
        { name: 'calendar', label: '캘린더', icon: Calendar },
        { name: 'record', label: '기록', icon: NotebookPen },
        { name: 'guide', label: '가이드', icon: BookOpen },
    ];

    return (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
            <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/50 px-6 py-3 flex justify-between items-center">
                {navItems.map((item) => {
                    const isActive = activePage === item.name;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.name}
                            onClick={() => setActivePage(item.name)}
                            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                                isActive ? 'text-amber-500 transform -translate-y-1' : 'text-gray-300 hover:text-gray-500'
                            }`}
                        >
                            <div className={`${isActive ? 'bg-amber-100' : 'bg-transparent'} p-2 rounded-full transition-colors`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} strokeWidth={2.5} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
