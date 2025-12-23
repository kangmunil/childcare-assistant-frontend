import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    Home, 
    Calendar, 
    PenTool, 
    BookOpen,
    Users // [추가] 아이콘 임포트
} from 'lucide-react';

const BottomNavBar = () => {
    const navItems = [
        { icon: Home, label: '홈', path: '/dashboard' },
        { icon: Calendar, label: '일정', path: '/calendar' },
        { icon: PenTool, label: '기록', path: '/record' },
        { icon: Users, label: '커뮤니티', path: '/community' },
        { icon: BookOpen, label: '가이드', path: '/guide' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 z-40 pb-safe">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 transition-colors ${
                                isActive 
                                    ? 'text-amber-500' 
                                    : 'text-stone-300 hover:text-stone-400'
                            }`
                        }
                    >
                        {/* 아이콘 크기 통일 */}
                        <div className={`p-1.5 rounded-xl transition-all ${item.path === '/community' ? '' : ''}`}>
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