import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, NotebookPen, BookOpen } from 'lucide-react';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 보고 있는 페이지인지 확인하는 함수
  const isActive = (path) => location.pathname === path;

  // 버튼 스타일 공통 클래스
  const getButtonClass = (path) => 
    `flex flex-col items-center gap-1 transition-colors ${
      isActive(path) ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 pb-safe">
      
      {/* 1. 대시보드 (홈) */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className={getButtonClass('/dashboard')}
      >
        <Home className={`w-6 h-6 ${isActive('/dashboard') ? 'fill-current' : ''}`} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">홈</span>
      </button>

      {/* 2. 캘린더 */}
      <button 
        onClick={() => navigate('/calendar')} 
        className={getButtonClass('/calendar')}
      >
        <Calendar className={`w-6 h-6 ${isActive('/calendar') ? 'fill-current' : ''}`} strokeWidth={isActive('/calendar') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">일정</span>
      </button>

      {/* 3. 성장 기록 */}
      <button 
        onClick={() => navigate('/record')} 
        className={getButtonClass('/record')}
      >
        <NotebookPen className={`w-6 h-6 ${isActive('/record') ? 'fill-current' : ''}`} strokeWidth={isActive('/record') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">기록</span>
      </button>

      {/* 4. 가이드 (아직 페이지 없지만 버튼은 둠) */}
      <button 
        onClick={() => navigate('/guide')} 
        className={getButtonClass('/guide')}
      >
        <BookOpen className={`w-6 h-6 ${isActive('/guide') ? 'fill-current' : ''}`} strokeWidth={isActive('/guide') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">가이드</span>
      </button>

    </div>
  );
};

export default BottomNavBar;