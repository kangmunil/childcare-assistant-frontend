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