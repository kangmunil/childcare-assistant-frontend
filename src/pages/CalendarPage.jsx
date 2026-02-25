import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, Syringe, Cake, PartyPopper, Trash2 } from 'lucide-react';
import CalendarInputModal from '../components/CalendarInputModal';
import CalendarDetailModal from '../components/CalendarDetailModal';
import useStore from '../store/useStore';

const CalendarPage = () => {
  const {
    children, childrenLoaded, activeChildId, events,
    fetchCalendarEvents, fetchCalendar, createCalendar, updateCalendar, deleteCalendar
  } = useStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  //const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // ★ 상세 모달 상태
  const [selectedEvent, setSelectedEvent] = useState(null);

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 월 변경 또는 자녀 변경 시 캘린더 데이터 조회
  useEffect(() => {
    if (childrenLoaded && currentChild?.id) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
  }, [childrenLoaded, currentChild?.id, currentDate.getFullYear(), currentDate.getMonth()]);

  const reloadEvents = () => {
    if (currentChild?.id) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
  };

  const handleSaveEvent = async (newEventData) => {
    if (!currentChild?.id) return;
    const formattedDate = formatDate(newEventData.date);
    const result = await createCalendar(currentChild.id, {
      title: newEventData.title,
      time: newEventData.time,
      type: newEventData.type,
      location: newEventData.location,
      description: newEventData.description,
      date: formattedDate,
    });
    if (result.success) {
      reloadEvents();
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!currentChild?.id) return;
    const result = await deleteCalendar(currentChild.id, eventId);
    if (result.success) {
      setSelectedEvent(null);
      reloadEvents();
    }
  };

  const handleUpdateEvent = async (calendarId, formData) => {
    if (!currentChild?.id) return { success: false };
    const result = await updateCalendar(currentChild.id, calendarId, {
      title: formData.title,
      time: formData.time,
      type: formData.type,
      date: formData.date,
      location: formData.location,
      description: formData.description,
    });
    if (result.success) {
      // 수정된 데이터로 selectedEvent 갱신
      const refreshed = await fetchCalendar(currentChild.id, calendarId);
      if (refreshed.success) {
        setSelectedEvent(refreshed.data);
      }
      reloadEvents();
    }
    return result;
  };

  const handleEventClick = async (event) => {
    if (!currentChild?.id) return;
    const result = await fetchCalendar(currentChild.id, event.id);
    if (result.success) {
      setSelectedEvent(result.data);
    } else {
      // API 실패 시 로컬 데이터로 표시
      setSelectedEvent(event);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedEvents = events.filter(e => e.date === formatDate(selectedDate))
                               .sort((a, b) => a.time.localeCompare(b.time));

  const getIcon = (type) => {
    switch(type) {
        case 'hospital': return <Syringe className="w-4 h-4 text-rose-500" />;
        case 'event': return <PartyPopper className="w-4 h-4 text-purple-500" />;
        default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* 1. 일정 입력 모달 */}
      <CalendarInputModal 
        isOpen={isInputModalOpen} 
        onClose={() => setIsInputModalOpen(false)} 
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />

      {/* 2. ★ [New] 일정 상세 보기 모달 */}
      <CalendarDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onDelete={handleDeleteEvent}
        onUpdate={handleUpdateEvent}
      />

      <header className="flex justify-between items-center px-2">
        <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">육아 캘린더</h2>
            <p className="text-gray-500 text-sm font-medium">중요한 일정을 놓치지 마세요!</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <span className="text-lg font-bold text-gray-800 w-24 text-center">{year}. {month + 1}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* 달력 그리드 */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-sm p-6 flex flex-col">
            <div className="grid grid-cols-7 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <div key={d} className={`text-center text-sm font-bold ${i === 0 ? 'text-rose-400' : 'text-gray-400'}`}>{d}</div>
                ))}
            </div>
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
                            className={`relative rounded-2xl p-2 cursor-pointer transition-all border flex flex-col items-center justify-start pt-3 gap-1 ${isSelected ? 'bg-amber-100 border-amber-300 shadow-md ring-2 ring-amber-100 scale-105 z-10' : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'}`}
                        >
                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-gray-800 text-white' : isSelected ? 'text-amber-700' : 'text-gray-600'}`}>
                                {date.getDate()}
                            </span>
                            <div className="flex gap-1 mt-1">
                                {dayEvents.slice(0, 3).map((ev, idx) => (
                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${ev.type === 'hospital' ? 'bg-rose-400' : ev.type === 'event' ? 'bg-purple-400' : 'bg-amber-400'}`}></div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 우측 패널 */}
        <div className="lg:w-96 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                            Selected Date
                        </p>
                        <h3 className="text-3xl font-black text-gray-800 mt-1">
                            {selectedDate.getDate()}일 <span className="text-lg font-bold text-gray-400 ml-2">{['일','월','화','수','목','금','토'][selectedDate.getDay()]}요일</span>
                        </h3>
                    </div>
                    <button onClick={() => setIsInputModalOpen(true)} className="bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow-lg hover:scale-110 active:scale-95">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                
                {/* 리스트 (기존 유지) */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all cursor-pointer bg-gray-50/50"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white ${event.type === 'hospital' ? 'text-rose-500' : event.type === 'event' ? 'text-purple-500' : 'text-amber-500'}`}>
                                    {getIcon(event.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">{event.time}</span>
                                        {event.type === 'hospital' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">병원</span>}
                                    </div>
                                    <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><MapPin className="w-3 h-3" />{event.location || '장소 미정'}</div>
                                </div>
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                                        handleDeleteEvent(event.id);
                                      }
                                    }}
                                    className="p-2 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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