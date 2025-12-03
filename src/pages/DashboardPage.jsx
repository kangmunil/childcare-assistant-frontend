import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Moon, Activity, Plus, ChevronRight, BookOpen, Droplet } from 'lucide-react';
import TrackerCard from '../components/TrackerCard'; 
import useStore from '../store/useStore'; 

const DashboardPage = () => {
  const { children, activeChildId, events } = useStore(); 
  const navigate = useNavigate(); 
  
  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 1. "오늘" 날짜에 해당하는 일정만 필터링
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const todaySchedules = events
    .filter(event => event.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  // 요약 데이터
  const summaryData = [
    { id: 1, title: 'Feeding', subtitle: '모유/분유', value: '850', unit: 'ml', themeColor: 'amber', icon: Milk },
    { id: 2, title: 'Pumping', subtitle: '유축량', value: '120', unit: 'ml', themeColor: 'emerald', icon: Droplet },
    { id: 3, title: 'Sleep', subtitle: '총 수면', value: '12', unit: 'hr', themeColor: 'indigo', icon: Moon },
    { id: 4, title: 'Diaper', subtitle: '기저귀', value: '6', unit: '회', themeColor: 'sky', icon: Activity },
  ];

  const getDays = (dateString) => {
      const today = new Date();
      const birth = new Date(dateString);
      const diff = today - birth;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
  };

  return (
    <div className="pb-24 md:pb-0 h-full flex flex-col relative">
      
      {/* 1. Compact Hero Card */}
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
                        <span className="bg-emerald-400/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> {currentChild.name === '지우' ? '낮잠중' : '노는중'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{currentChild.name} {currentChild.gender === 'female' ? '공주님' : '왕자님'}</h2>
                </div>
            </div>
            
            <div className="hidden md:flex gap-2">
                {/* [성장 기록] 버튼 누르면 -> /record 페이지로 이동 */}
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
        {/* Left Column (Main Content) */}
        <div className="md:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                {summaryData.map((item) => (
                    <TrackerCard key={item.id} {...item} />
                ))}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="text-lg font-bold text-gray-800">오늘의 일정</h3>
                    
                    {/* [전체보기] 버튼 누르면 -> /calendar 페이지로 이동 */}
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
                                // [NEW] 일정 항목 자체를 클릭해도 캘린더로 이동하게 수정!
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
                                    
                                    {/* 화살표 버튼 */}
                                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                <p className="text-sm font-medium">오늘 예정된 일정이 없어요 🏝️</p>
                                {/* [일정 추가하러 가기] 버튼 -> 캘린더로 이동 */}
                                <button onClick={() => navigate('/calendar')} className="text-xs text-amber-500 mt-2 hover:underline">일정 추가하러 가기</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column (Side Widgets) */}
        <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-indigo-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-100 shrink-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-[50px] opacity-50 -mr-8 -mt-8"></div>
                 <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 bg-indigo-800/50 px-2 py-0.5 rounded-md border border-indigo-700/50 mb-3">
                        <BookOpen className="w-3 h-3 text-indigo-300" />
                        <span className="text-[10px] font-bold tracking-wide uppercase text-indigo-200">Premium</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight mb-1">수면 교육의 정석</h3>
                    <p className="text-indigo-200 text-xs mb-4">통잠 자는 아이를 위한 비법</p>
                    <button 
                        onClick={() => navigate('/guide')}
                        className="w-full bg-white text-indigo-900 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors"
                    >
                        읽어보기
                    </button>
                 </div>
            </div>
            
            {/* [NEW] 미니 달력을 클릭하면 -> /calendar 페이지로 이동! */}
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