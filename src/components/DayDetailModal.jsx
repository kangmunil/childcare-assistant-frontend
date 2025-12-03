import React from 'react';
import { X, MapPin, Clock, Calendar as CalIcon, Syringe, PartyPopper } from 'lucide-react';

const DayDetailModal = ({ isOpen, onClose, date, events }) => {
  if (!isOpen) return null;

  // 날짜 포맷팅 (예: 2025년 12월 3일 수요일)
  const dateTitle = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 아이콘 헬퍼 (CalendarPage와 동일)
  const getIcon = (type) => {
    switch (type) {
      case 'hospital': return <Syringe className="w-5 h-5 text-white" />;
      case 'event': return <PartyPopper className="w-5 h-5 text-white" />;
      default: return <Clock className="w-5 h-5 text-white" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'hospital': return 'bg-rose-400';
      case 'event': return 'bg-purple-400';
      default: return 'bg-amber-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* 헤더 (배경 그라데이션) */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shrink-0 relative">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-md"
            >
                <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 mb-2 opacity-80">
                <CalIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Daily Overview</span>
            </div>
            <h2 className="text-3xl font-black leading-tight">
                {date.getDate()}일 <br/>
                <span className="text-xl font-medium opacity-90">{['일','월','화','수','목','금','토'][date.getDay()]}요일</span>
            </h2>
            <p className="mt-2 text-sm text-indigo-100 font-medium">
                총 <span className="font-bold text-white">{events.length}개</span>의 일정이 있습니다.
            </p>
        </div>

        {/* 바디 (타임라인 리스트) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {events.length > 0 ? (
                <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {events.map((event) => (
                        <div key={event.id} className="relative pl-8 group">
                            {/* 타임라인 점 */}
                            <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm z-10 ${getBgColor(event.type)}`}>
                                {getIcon(event.type)}
                            </div>
                            
                            {/* 카드 내용 */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-bold text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {event.time}
                                    </span>
                                    {event.type === 'hospital' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">병원 방문</span>}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{event.title}</h3>
                                <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {event.location || '장소 미정'}
                                </div>
                                {event.description && (
                                    <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 leading-relaxed">
                                        {event.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <CalIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold">등록된 일정이 없어요</p>
                    <p className="text-xs">오른쪽 하단 + 버튼으로 추가해보세요!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;