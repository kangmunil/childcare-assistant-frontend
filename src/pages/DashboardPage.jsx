import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Moon, Activity, Plus, ChevronRight, Droplet, ExternalLink, MessageCircle } from 'lucide-react';
import Slider from "react-slick"; 
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import TrackerCard from '../components/TrackerCard'; 
import TrackerInputModal from '../components/TrackerInputModal';
// [FIX 1] 신규 모달 Import 추가
import FeedingModal from '../components/FeedingModal'; 
import useStore from '../store/useStore'; 

const statusConfig = {
  sleep: { text: '💤 낮잠중', color: 'bg-indigo-500', ring: 'ring-indigo-300' },
  play:  { text: '🧸 노는중', color: 'bg-emerald-500', ring: 'ring-emerald-300' },
  eat:   { text: '🍼 맘마중', color: 'bg-amber-500',   ring: 'ring-amber-300' },
  bath:  { text: '🛁 목욕중', color: 'bg-sky-500',     ring: 'ring-sky-300' },
  sick:  { text: '🤒 아파요', color: 'bg-rose-500',    ring: 'ring-rose-300' },
};

const DashboardPage = () => {
  const { 
      children, 
      activeChildId, 
      events, 
      trackerData, 
      updateTrackerData, 
      currentStatus, 
      setCurrentStatus,
      openChatWithQuery 
  } = useStore();
  
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  // [FIX 2] 수유 모달 전용 State 추가
  const [isFeedingModalOpen, setIsFeedingModalOpen] = useState(false); 
  const [selectedTracker, setSelectedTracker] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

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

  const summaryData = [
    { 
      id: 1, 
      key: 'feeding', 
      title: 'Feeding', 
      subtitle: '모유/분유',       
      // [GOOD] 이 로직은 아주 좋습니다. 로그 데이터 기반 합산.
      value: trackerData.feedingLogs?.reduce((acc, cur) => acc + cur.amount, 0) || 0,
      unit: 'ml', 
      themeColor: 'amber', 
      icon: Milk 
    },
    { id: 2, key: 'pumping', title: 'Pumping', subtitle: '유축량', value: trackerData.pumping, unit: 'ml', themeColor: 'emerald', icon: Droplet },
    { id: 3, key: 'sleep', title: 'Sleep', subtitle: '총 수면', value: trackerData.sleep, unit: 'hr', themeColor: 'indigo', icon: Moon },
    { id: 4, key: 'diaper', title: 'Diaper', subtitle: '기저귀', value: trackerData.diaper, unit: '회', themeColor: 'sky', icon: Activity },
  ];

  const quickActions = [
    { label: "💉 예방접종 확인", query: `${currentChild.name}의 다음 예방접종 시기 언제야?` },
    { label: "👶 발달 특성", query: `${currentChild.name} 개월 수에 맞는 발달 특성 알려줘` },
    { label: "💤 수면 교육 꿀팁", query: "지금 시기 수면 교육 어떻게 해야 해?" },
    { label: "🍼 이유식 가이드", query: "지금 월령에 맞는 이유식 식단 추천해줘" }
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: false,
    className: "mb-6"
  };

  const getDays = (dateString) => {
      const today = new Date();
      const birth = new Date(dateString);
      const diff = today - birth;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
  };

  // [FIX 3] 클릭 핸들러 로직 분기 (핵심)
  const handleCardClick = (item) => {
    setSelectedTracker(item);
    if (item.key === 'feeding') {
        setIsFeedingModalOpen(true); // 수유 모달 열기
    } else {
        setIsModalOpen(true); // 일반 모달 열기
    }
  };

  // 일반 모달 저장 핸들러
  const handleSaveData = (id, newValue) => {
    const item = summaryData.find(d => d.id === id);
    if (item) {
        updateTrackerData(item.key, newValue);
    }
  };

  // [FIX 4] 수유 모달 저장 핸들러 추가
  const handleSaveFeeding = ({ total, logs }) => {
    // 1. 화면 표시용 총량 업데이트
    updateTrackerData('feeding', total);
    // 2. (추후 구현) 로그 데이터 자체를 Store에 저장하려면 아래와 같은 액션 필요
    // updateTrackerData('feedingLogs', logs); 
  };

  const currentStatusInfo = statusConfig[currentStatus] || statusConfig.play;

  const handleStatusClick = () => {
    const statusKeys = Object.keys(statusConfig);
    const currentIndex = statusKeys.indexOf(currentStatus || 'play');
    const nextIndex = (currentIndex + 1) % statusKeys.length;
    setCurrentStatus(statusKeys[nextIndex]);
  };

  return (
    <div className="pb-24 md:pb-0 h-full flex flex-col relative overflow-hidden">

      <TrackerInputModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedTracker}
        onSave={handleSaveData}
      />

      {/* [FIX 5] 수유 모달 렌더링 추가 */}
      <FeedingModal 
        isOpen={isFeedingModalOpen}
        onClose={() => setIsFeedingModalOpen(false)}
        initialData={selectedTracker}
        onSave={handleSaveFeeding}
      />

      {/* Hero Section (Slider) */}
      <div className="-mx-2 px-2"> 
        <Slider {...sliderSettings}>
            {/* ... 기존 슬라이더 내용 생략 (변동 없음) ... */}
            <div className="px-1 outline-none">
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-[1.5rem] p-6 text-white shadow-lg shadow-orange-100 relative overflow-hidden h-36 flex items-center">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute left-10 bottom-0 w-20 h-20 bg-yellow-300 opacity-20 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10 w-full flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-md">
                                    <img src={currentChild.photo} alt="baby" className="w-full h-full object-cover" />
                                </div>
                                <span className={`absolute -bottom-1 -right-2 px-2 py-0.5 ${currentStatusInfo.color} border-2 border-white rounded-full flex items-center justify-center shadow-sm`}>
                                     <span className="text-[10px] font-bold flex items-center gap-1">
                                        {currentStatusInfo.text}
                                     </span>
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-white/30 px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/20">
                                        생후 {getDays(currentChild.birthDate)}일
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-white shadow-sm leading-none">
                                    {currentChild.name} {currentChild.gender === 'female' ? '공주님' : '왕자님'}
                                </h2>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/record')}
                            className="bg-white text-orange-500 px-5 py-3 rounded-xl text-sm font-black shadow-lg hover:bg-orange-50 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                        >
                            <Plus className="w-5 h-5" strokeWidth={3} />
                            기록
                        </button>
                    </div>
                </div>
            </div>
            <div className="px-1 outline-none">
                <div className="bg-[#861848] rounded-[1.5rem] p-6 text-white shadow-lg shadow-pink-100 relative overflow-hidden h-36 flex items-center">
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
            </div>
        </Slider>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 px-1 py-1 -mx-1 snap-x">
        {quickActions.map((action, idx) => (
            <button 
                key={idx}
                className="whitespace-nowrap bg-white border border-gray-100 text-gray-600 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all snap-start flex items-center gap-1.5 active:scale-95"
                onClick={() => openChatWithQuery(action.query)} 
            >
                <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                {action.label}
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1 pb-4">
        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                {summaryData.map((item) => {
                    const { key, ...cardProps } = item; 
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

            {/* 일정 리스트: 선택된 날짜에 따라 변경됨 */}
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
                            selectedDaySchedules.map((item, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => navigate('/calendar')}
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
                            ))
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

        {/* Right Column (캘린더 위젯) */}
        <div className="md:col-span-4 flex flex-col gap-6">
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
                                {/* [추가] 일정이 있으면 하단에 점 표시 */}
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