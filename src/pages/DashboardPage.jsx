import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Moon, Activity, Plus, ChevronRight, BookOpen, Droplet } from 'lucide-react';
import TrackerCard from '../components/TrackerCard'; 
import TrackerInputModal from '../components/TrackerInputModal';
import useStore from '../store/useStore'; 
import PromoWidget from '../components/PromoWidget';

const statusConfig = {
  sleep: { text: '💤 낮잠중', color: 'bg-indigo-500', ring: 'ring-indigo-300' },
  play:  { text: '🧸 노는중', color: 'bg-emerald-500', ring: 'ring-emerald-300' },
  eat:   { text: '🍼 맘마중', color: 'bg-amber-500',   ring: 'ring-amber-300' },
  bath:  { text: '🛁 목욕중', color: 'bg-sky-500',     ring: 'ring-sky-300' },
  sick:  { text: '🤒 아파요', color: 'bg-rose-500',    ring: 'ring-rose-300' },
};

const DashboardPage = () => {
  const { children, activeChildId, events, trackerData, updateTrackerData, currentStatus, setCurrentStatus } = useStore();
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const todaySchedules = events
    .filter(event => event.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const summaryData = [
    { id: 1, key: 'feeding', title: 'Feeding', subtitle: '모유/분유', value: trackerData.feeding, unit: 'ml', themeColor: 'amber', icon: Milk },
    { id: 2, key: 'pumping', title: 'Pumping', subtitle: '유축량', value: trackerData.pumping, unit: 'ml', themeColor: 'emerald', icon: Droplet },
    { id: 3, key: 'sleep', title: 'Sleep', subtitle: '총 수면', value: trackerData.sleep, unit: 'hr', themeColor: 'indigo', icon: Moon },
    { id: 4, key: 'diaper', title: 'Diaper', subtitle: '기저귀', value: trackerData.diaper, unit: '회', themeColor: 'sky', icon: Activity },
  ];

  const getDays = (dateString) => {
      const today = new Date();
      const birth = new Date(dateString);
      const diff = today - birth;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
  };

  const handleCardClick = (item) => {
    setSelectedTracker(item);
    setIsModalOpen(true);
  };

  const handleSaveData = (id, newValue) => {
    const item = summaryData.find(d => d.id === id);
    if (item) {
        updateTrackerData(item.key, newValue);
    }
  };

  // 현재 상태 가져오기 (기본값 play)
  const currentStatusInfo = statusConfig[currentStatus] || statusConfig.play;

  // 상태 배지 클릭 시 변경하는 핸들러
  const handleStatusClick = () => {
    const statusKeys = Object.keys(statusConfig);
    const currentIndex = statusKeys.indexOf(currentStatus || 'play');
    const nextIndex = (currentIndex + 1) % statusKeys.length;
    setCurrentStatus(statusKeys[nextIndex]);
  };

  const promoList = [
    { 
      id: 1, type: 'guide', 
      title: '수면 교육의 정석', 
      description: '통잠 자는 아이를 위한 3가지 비법', 
      link: 'https://example.com/sleep-guide',
      buttonText: '읽어보기'
    },
    { 
      id: 2, type: 'ad', 
      title: '유기농 기저귀 특가', 
      description: '우리 아이 엉덩이 발진 걱정 끝!', 
      link: 'https://example.com/diaper-ad',
      buttonText: '구경하러 가기'
    },
    { 
      id: 3, type: 'info', 
      title: '이유식 알러지 체크', 
      description: '계란, 땅콩 테스트 시기 확인하기', 
      link: 'https://example.com/food-guide'
    }
  ];

  const currentPromo = promoList[Math.floor(Math.random() * promoList.length)];

  return (
    <div className="pb-24 md:pb-0 h-full flex flex-col relative">

      <TrackerInputModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedTracker}
        onSave={handleSaveData}
      />

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 rounded-[2rem] p-6 text-white shadow-lg shadow-orange-100 mb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 opacity-20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center shadow-inner overflow-hidden">
                    <img src={currentChild.photo} alt="baby" className="w-full h-full object-cover" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20">
                            생후 {getDays(currentChild.birthDate)}일
                        </span>
                        
                        {/* 상태 배지 부분 */}
                        <button 
                            onClick={handleStatusClick}
                            className={`${currentStatusInfo.color} text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95`}
                        >
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            {currentStatusInfo.text}
                        </button>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{currentChild.name} {currentChild.gender === 'female' ? '공주님' : '왕자님'}</h2>
                </div>
            </div>
            
            <div className="hidden md:flex gap-2">
                <button 
                    onClick={() => navigate('/record')}
                    className="bg-white text-orange-500 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    <span>성장 기록</span>
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1">
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

            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="text-lg font-bold text-gray-800">오늘의 일정</h3>
                    <button 
                        onClick={() => navigate('/calendar')}
                        className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                    >
                        전체보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                </div>
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        {todaySchedules.length > 0 ? (
                            todaySchedules.map((item, index) => (
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
                                <p className="text-sm font-medium">오늘 예정된 일정이 없어요 🏝️</p>
                                <button onClick={() => navigate('/calendar')} className="text-xs text-amber-500 mt-2 hover:underline">일정 추가하러 가기</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
            {/* PromoWidget이 이 div 안에 있어야 합니다! */}
            <PromoWidget data={currentPromo} />
            
            <div 
                onClick={() => navigate('/calendar')}
                className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1 cursor-pointer hover:border-amber-200 hover:shadow-md transition-all group"
            >
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-bold text-gray-800 group-hover:text-amber-600 transition-colors">
                        {today.getMonth() + 1}월
                    </h3>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500" />
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-gray-300 text-[10px] font-bold py-1">{d}</div>)}
                    {Array.from({length: 31}).map((_, i) => (
                        <div key={i} className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xs ${i+1 === today.getDate() ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-gray-400 group-hover:bg-gray-50'}`}>
                            {i+1}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;