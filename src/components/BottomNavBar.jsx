import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Calendar,
    PenTool,
    BookOpen,
    Users,
    ClipboardList
} from 'lucide-react';

const BottomNavBar = () => {
    const navItems = [
        { icon: Home, label: '홈', path: '/dashboard' },
        { icon: Calendar, label: '일정', path: '/calendar' },
        { icon: PenTool, label: '기록', path: '/record' },
        { icon: ClipboardList, label: '일지', path: '/diary' },
        { icon: Users, label: '커뮤니티', path: '/community' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-stone-200 dark:border-gray-800 px-6 py-3 z-40 pb-safe transition-colors duration-300">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 transition-all duration-300 ${isActive
                                ? 'text-amber-500 scale-110'
                                : 'text-stone-300 dark:text-gray-600 hover:text-stone-400 dark:hover:text-gray-400'
                            }`
                        }
                    >
                        {/* 아이콘 크기 통일 */}
                        <div className="p-1.5 rounded-xl transition-all">
                            <item.icon className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default BottomNavBar;