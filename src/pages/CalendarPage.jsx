import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Syringe, Cake, PartyPopper } from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 임시 일정 데이터 (실제로는 DB에서 가져와야 함)
  const events = [
    { id: 1, date: '2025-10-24', title: 'B형 간염 2차 접종', type: 'hospital', time: '14:00', location: '서울 소아과' },
    { id: 2, date: '2025-10-24', title: '이유식 재료 사기', type: 'todo', time: '16:00', location: '마트' },
    { id: 3, date: '2025-10-27', title: '지우 200일 촬영', type: 'event', time: '11:00', location: '스튜디오' },
    { id: 4, date: '2025-11-05', title: '영유아 검진', type: 'hospital', time: '09:30', location: '보건소' },
  ];

  // 달력 계산 로직
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = [];

  // 빈 칸 채우기 (지난달)
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // 날짜 채우기
  for (let i = 1; i <= lastDate; i++) {
    days.push(new Date(year, month, i));
  }

  // 월 변경 핸들러
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 선택된 날짜의 일정 필터링
  const selectedEvents = events.filter(e => e.date === formatDate(selectedDate));

  // 아이콘 선택 헬퍼
  const getIcon = (type) => {
    switch(type) {
        case 'hospital': return <Syringe className="w-4 h-4 text-rose-500" />;
        case 'event': return <PartyPopper className="w-4 h-4 text-purple-500" />;
        default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* 1. 상단 헤더 (월 이동) */}
      <header className="flex justify-between items-center px-2">
        <div>
            <h2 className="text-2xl font-black text-gray-800">육아 캘린더</h2>
            <p className="text-gray-500 text-sm font-medium">중요한 일정을 놓치지 마세요!</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <span className="text-lg font-bold text-gray-800 w-24 text-center">{year}. {month + 1}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 (달력 + 상세) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* 좌측: 달력 그리드 */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-sm p-6 flex flex-col">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <div key={d} className={`text-center text-sm font-bold ${i === 0 ? 'text-rose-400' : 'text-gray-400'}`}>{d}</div>
                ))}
            </div>
            
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-2">
                {days.map((date, i) => {
                    if (!date) return <div key={i}></div>;
                    
                    const dateStr = formatDate(date);
                    const isSelected = formatDate(selectedDate) === dateStr;
                    const isToday = formatDate(new Date()) === dateStr;
                    const dayEvents = events.filter(e => e.date === dateStr);

                    return (
                        <div 
                            key={i} 
                            onClick={() => setSelectedDate(date)}
                            className={`
                                relative rounded-2xl p-2 cursor-pointer transition-all border
                                flex flex-col items-center justify-start pt-3 gap-1
                                ${isSelected 
                                    ? 'bg-amber-100 border-amber-300 shadow-md ring-2 ring-amber-100 scale-105 z-10' 
                                    : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'
                                }
                            `}
                        >
                            <span className={`
                                text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                ${isToday ? 'bg-gray-800 text-white' : isSelected ? 'text-amber-700' : 'text-gray-600'}
                            `}>
                                {date.getDate()}
                            </span>
                            
                            {/* 일정 점 표시 (최대 3개) */}
                            <div className="flex gap-1 mt-1">
                                {dayEvents.slice(0, 3).map((ev, idx) => (
                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${
                                        ev.type === 'hospital' ? 'bg-rose-400' : 
                                        ev.type === 'event' ? 'bg-purple-400' : 'bg-amber-400'
                                    }`}></div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 우측: 선택된 날짜 상세 정보 */}
        <div className="lg:w-96 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Selected Date</p>
                        <h3 className="text-3xl font-black text-gray-800 mt-1">
                            {selectedDate.getDate()}일 
                            <span className="text-lg font-bold text-gray-400 ml-2">
                                {['일','월','화','수','목','금','토'][selectedDate.getDay()]}요일
                            </span>
                        </h3>
                    </div>
                    <button className="bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow-lg">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map(event => (
                            <div key={event.id} className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all cursor-pointer bg-gray-50/50">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white ${
                                    event.type === 'hospital' ? 'text-rose-500' :
                                    event.type === 'event' ? 'text-purple-500' : 'text-amber-500'
                                }`}>
                                    {getIcon(event.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">{event.time}</span>
                                        {event.type === 'hospital' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">병원</span>}
                                    </div>
                                    <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                            <Cake className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">등록된 일정이 없어요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarPage;