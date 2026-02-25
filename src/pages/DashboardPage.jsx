import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Moon, Activity, Plus, ChevronRight, Droplet, MessageCircle, ExternalLink, Sparkles, Baby, Utensils, Thermometer, Stethoscope, Heart } from 'lucide-react';

import TrackerCard from '../components/TrackerCard';
import TrackerInputModal from '../components/TrackerInputModal';
import CalendarDetailModal from '../components/CalendarDetailModal';
import useStore from '../store/useStore'; 

const statusConfig = {
  sleep: { text: '낮잠중', color: 'bg-indigo-500', ring: 'ring-indigo-300' },
  play:  { text: '노는중', color: 'bg-emerald-500', ring: 'ring-emerald-300' },
  eat:   { text: '맘마중', color: 'bg-amber-500',   ring: 'ring-amber-300' },
  bath:  { text: '목욕중', color: 'bg-sky-500',     ring: 'ring-sky-300' },
  sick:  { text: '아파요', color: 'bg-rose-500',    ring: 'ring-rose-300' },
};

// 아이템 코드(cc_di_code) → 아이콘/색상 매핑
const codeStyleMap = {
  // newborn
  BREAST:     { icon: Milk,        themeColor: 'amber' },
  FORMULA:    { icon: Milk,        themeColor: 'amber' },
  PUMPING:    { icon: Droplet,     themeColor: 'emerald' },
  SLEEP:      { icon: Moon,        themeColor: 'indigo' },
  DIAPER:     { icon: Activity,    themeColor: 'sky' },
  // infant
  BABY_FOOD:  { icon: Utensils,    themeColor: 'amber' },
  PLAY:       { icon: Baby,        themeColor: 'emerald' },
  POTTY:      { icon: Activity,    themeColor: 'sky' },
  NAP:        { icon: Moon,        themeColor: 'indigo' },
};
const defaultStyle = { icon: Heart, themeColor: 'amber' };
const themeColors = ['amber', 'emerald', 'indigo', 'sky'];

const DashboardPage = () => {
  const {
      children,
      childrenLoaded,
      activeChildId,
      events,
      diaryItems,
      diaryItemsLoaded,
      summaryValues,
      currentStatus,
      openChatWithQuery,
      fetchDiaryItems,
      fetchSummary,
      fetchCalendarEvents,
      fetchDiaryLogs,
      createDiary,
      fetchCalendar,
      updateCalendar,
      deleteCalendar
  } = useStore();
  
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [initialLogs, setInitialLogs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 자녀 목록 로딩 완료 후 자녀가 없으면 자녀 등록 페이지로 이동
  useEffect(() => {
    if (childrenLoaded && children.length === 0) {
      navigate('/child-setup', { replace: true });
    }
  }, [childrenLoaded, children.length]);

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 자녀 로딩 완료 + 자녀 변경 시 일지 항목/요약/캘린더 데이터 조회
  useEffect(() => {
    if (childrenLoaded && currentChild?.id) {
      // 자녀 생년월일로 division 결정하여 일지 항목 마스터 조회
      const birthDay = currentChild.birthDay || currentChild.birthDate;
      if (birthDay) {
        fetchDiaryItems(birthDay);
      }

      const today = formatDate(new Date());
      fetchSummary(currentChild.id, today);

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
  }, [childrenLoaded, currentChild?.id]);

  // 캘린더 월 변경 시 일정만 재조회
  useEffect(() => {
    if (childrenLoaded && currentChild?.id) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  const selectedDateStr = formatDate(selectedDate);
  const todayStr = formatDate(new Date());
  
  const selectedDaySchedules = events
    .filter(event => event.date === selectedDateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const hasEventOnDate = (day) => {
      const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const checkDateStr = formatDate(checkDate);
      return events.some(e => e.date === checkDateStr);
  };

  //ITEM 목록도 DB에서 조회
  const summaryData = diaryItems.map((item, idx) => {
    const code = (item.code || '').toUpperCase();
    const style = codeStyleMap[code] || defaultStyle;
    const sv = summaryValues[item.id];
    return {
      id: item.id,
      itemId: item.id,
      title: item.code || item.name,
      subtitle: item.name,
      value: String(sv?.totalAmount ?? 0),
      unit: item.unit || '',
      themeColor: style.themeColor || themeColors[idx % themeColors.length],
      icon: style.icon,
    };
  });

  const childDisplayName = currentChild?.name || '아이';
  const quickActions = [
    {
      label: "예방접종 확인",
      icon: "💉",
      query: `${childDisplayName}의 다음 예방접종 시기 언제야?`,
      intentHint: "VACCINATION",
      requestedProfileDomains: ["vaccination", "medical"]
    },
    {
      label: "발달 특성",
      icon: "👶",
      query: `${childDisplayName} 개월 수에 맞는 발달 특성 알려줘`,
      intentHint: "DEVELOPMENT",
      requestedProfileDomains: ["development"]
    },
    {
      label: "성장발달 확인",
      icon: "📈",
      query: "아이 성장발달 확인해줘",
      intentHint: "GROWTH_CHECK",
      requestedProfileDomains: ["growth"]
    },
    {
      label: "수면 교육",
      icon: "💤",
      query: "지금 시기 수면 패턴 어떻게 잡아야 해?",
      intentHint: "SLEEP",
      requestedProfileDomains: ["sleep", "routine"]
    },
    {
      label: "이유식 가이드",
      icon: "🍼",
      query: "지금 아이 나이(개월)에 맞는 이유식 식단 추천해줘",
      intentHint: "FEEDING",
      requestedProfileDomains: ["feeding", "routine"]
    }
  ];

  const getDays = (dateString) => {
      const today = new Date();
      const birth = new Date(dateString);
      const diff = today - birth;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
  };

  const handleCardClick = async (item) => {
    setSelectedTracker(item);

    // 오늘 해당 항목의 기존 일지를 조회
    if (currentChild?.id && item.itemId) {
      const today = formatDate(new Date());
      const allLogs = await fetchDiaryLogs(currentChild.id, today);
      const filtered = allLogs
        .filter((log) => log.itemId === item.itemId)
        .map((log) => ({
          id: log.id,
          time: log.diTime || '00:00',
          amount: Number(log.amount) || 0,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      setInitialLogs(filtered);
    } else {
      setInitialLogs([]);
    }

    setIsModalOpen(true);
  };

  const handleAddLog = async (log) => {
    if (!selectedTracker || !currentChild?.id) return false;

    const today = new Date();
    const diDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const result = await createDiary(
      currentChild.id,
      [{ diDate, diTime: log.time, amount: log.amount }],
      selectedTracker.itemId
    );
    return result.success;
  };

  const handleScheduleClick = async (item) => {
    if (!currentChild?.id) return;
    const result = await fetchCalendar(currentChild.id, item.id);
    if (result.success) {
      setSelectedEvent(result.data);
    } else {
      setSelectedEvent(item);
    }
  };

  const handleScheduleUpdate = async (calendarId, formData) => {
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
      const refreshed = await fetchCalendar(currentChild.id, calendarId);
      if (refreshed.success) setSelectedEvent(refreshed.data);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
    return result;
  };

  const handleScheduleDelete = async (calendarId) => {
    if (!currentChild?.id) return;
    const result = await deleteCalendar(currentChild.id, calendarId);
    if (result.success) {
      setSelectedEvent(null);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      fetchCalendarEvents(currentChild.id, { month: `${year}-${month}` });
    }
  };

  const currentStatusInfo = statusConfig[currentStatus] || statusConfig.play;

  return (
    <div className="pb-24 md:pb-0 h-full flex flex-col relative overflow-hidden">

      <TrackerInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedTracker}
        initialLogs={initialLogs}
        onAddLog={handleAddLog}
      />

      <CalendarDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onDelete={handleScheduleDelete}
        onUpdate={handleScheduleUpdate}
      />

      {/* 1. [수정됨] 상단 슬림 배너 (높이 축소 및 레이아웃 정리) */}
      <div className="mb-4 mt-2">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl px-6 py-4 text-white shadow-md shadow-orange-100 relative overflow-hidden flex items-center justify-between">
              {/* 배경 장식 (더 은은하게 변경) */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                  {/* 아기 아바타 (사이즈 약간 축소) */}
                  <div className="relative">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center overflow-hidden">
                          {currentChild.photoUrl ? (
                              <img
                                src={currentChild.photoUrl}
                                alt="baby"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = ''; }}
                              />
                          ) : null}
                          <span className="text-white text-lg" style={currentChild.photoUrl ? {display:'none'} : {}}>👶</span>
                      </div>
                      {/* 상태 뱃지 (심플하게) */}
                      <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 ${currentStatusInfo.color} border border-white rounded-full flex items-center shadow-sm`}>
                           <span className="text-[9px] font-bold text-white leading-none">
                              {currentStatusInfo.text}
                           </span>
                      </div>
                  </div>

                  {/* 텍스트 정보 (가로 배치로 공간 절약) */}
                  <div>
                      <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black tracking-tight leading-none text-white shadow-sm">
                              {currentChild.name}
                          </h2>
                          <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
                              D+{getDays(currentChild.birthDate)}
                          </span>
                      </div>
                      <p className="text-xs text-white/80 font-medium mt-0.5">
                          오늘도 사랑해, 우리 아가 🧡
                      </p>
                  </div>
              </div>

              {/* 기록 버튼 (컴팩트하게) */}
              <button 
                  onClick={() => navigate('/record')}
                  className="bg-white text-orange-500 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-orange-50 transition-all active:scale-95 flex items-center gap-1.5 relative z-10"
              >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  기록
              </button>
          </div>
      </div>

      {/* 2. [수정됨] 퀵 액션 (키워드) 버튼 - 더 심플하고 작게 변경 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 px-1 -mx-1">
        {quickActions.map((action, idx) => (
                <button 
                key={idx}
                className="whitespace-nowrap bg-white border border-stone-100 text-stone-600 px-3 py-2 rounded-xl text-[11px] font-bold shadow-sm hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-1.5 active:scale-95"
                onClick={() => openChatWithQuery(action.query, {
                  intentHint: action.intentHint,
                  requestedProfileDomains: action.requestedProfileDomains
                })} 
            >
                <span className="text-sm">{action.icon}</span>
                {action.label}
            </button>
        ))}
        {/* AI 질문 유도 버튼 추가 */}
        <button 
            className="whitespace-nowrap bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-2 rounded-xl text-[11px] font-bold shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-1.5 active:scale-95"
            onClick={() => openChatWithQuery('')}
        >
            <Sparkles className="w-3 h-3 fill-indigo-600" />
            AI에게 물어보기
        </button>
      </div>

      {/* 3. 메인 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1 pb-4">
        
        {/* === Left Column (트래커 + 오늘의 일정) === */}
        <div className="md:col-span-8 flex flex-col gap-6">
            {/* 트래커 카드 4개 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                {summaryData.map((item) => {
                    const { itemId, ...cardProps } = item;
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleCardClick(item)}
                            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                            <TrackerCard {...cardProps} />
                        </div>
                    );
                })}
            </div>

            {/* 일정 리스트 */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="text-lg font-bold text-gray-800">
                        {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
                    </h3>
                    <button 
                        onClick={() => navigate('/calendar')}
                        className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                    >
                        전체보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                </div>
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
                    <div className="space-y-3">
                        {selectedDaySchedules.length > 0 ? (
                            <>
                                {selectedDaySchedules.slice(0, 3).map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleScheduleClick(item)}
                                        className="flex items-center p-2.5 rounded-2xl hover:bg-amber-50/50 transition-colors group cursor-pointer border border-transparent hover:border-amber-100"
                                    >
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-500 font-bold border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {parseInt(item.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                            </span>
                                            <span className="text-base leading-none">{item.time.split(':')[0]}</span>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-bold text-gray-800">{item.title}</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                {item.location} • {item.type === 'hospital' ? '병원' : item.type === 'event' ? '행사' : '할일'}
                                            </p>
                                        </div>
                                        <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {selectedDaySchedules.length > 3 && (
                                    <button
                                        onClick={() => navigate('/calendar')}
                                        className="w-full py-2.5 text-xs font-bold text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                    >
                                        +{selectedDaySchedules.length - 3}개 더보기
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                <p className="text-sm font-medium">
                                    {selectedDateStr === todayStr ? '오늘 ' : ''}예정된 일정이 없어요 🏝️
                                </p>
                                <button onClick={() => navigate('/calendar')} className="text-xs text-amber-500 mt-2 hover:underline">일정 추가하러 가기</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* === Right Column (광고 + 캘린더) === */}
        <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* 1. 광고 배너 (여기로 이동) */}
            <div className="bg-[#861848] rounded-[2rem] p-6 text-white shadow-lg shadow-pink-100 relative overflow-hidden min-h-[160px] flex items-center">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative z-10 w-full flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <span className="bg-black/20 text-[10px] font-bold px-2 py-0.5 rounded text-white/90 mb-2 inline-block">SPONSORED</span>
                        <h2 className="text-xl font-bold mb-1 leading-tight">유기농 기저귀 특가</h2>
                        <p className="text-white/70 text-xs">우리 아이 엉덩이 발진 걱정 끝!</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-1">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <button className="bg-white text-[#861848] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                            구경하러 가기 <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. 미니 캘린더 위젯 (광고 아래로) */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1 transition-all group">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-bold text-gray-800">
                        {selectedDate.getMonth() + 1}월
                    </h3>
                    <button onClick={() => navigate('/calendar')} className="p-1 rounded-full hover:bg-gray-100">
                        <ChevronRight className="w-4 h-4 text-gray-300 hover:text-amber-500" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-gray-300 text-[10px] font-bold py-1">{d}</div>)}
                    {Array.from({length: 31}).map((_, i) => {
                        const day = i + 1;
                        const isSelected = day === selectedDate.getDate();
                        const isToday = day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth();
                        const hasEvent = hasEventOnDate(day);

                        return (
                            <div 
                                key={i} 
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                                className={`aspect-square flex flex-col items-center justify-center rounded-lg font-bold text-xs cursor-pointer transition-all relative
                                    ${isSelected 
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200 scale-105' 
                                        : 'text-gray-400 hover:bg-gray-50'
                                    }
                                    ${isToday && !isSelected ? 'border border-amber-200 text-amber-500' : ''}
                                `}
                            >
                                {day}
                                {hasEvent && (
                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
