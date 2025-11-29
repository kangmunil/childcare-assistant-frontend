import React from 'react';
import { Milk, Moon, Activity, Plus, ChevronRight, BookOpen, Droplet } from 'lucide-react';
import TrackerCard from '../components/TrackerCard'; 
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { children, activeChildId } = useStore();
  const navigate = useNavigate();
  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 1. 요약 데이터
import React, { useState } from 'react';
import { Milk, Moon, Activity, Plus, Bell, ChevronRight, BookOpen, Droplet, X, Baby, Calendar as CalendarIcon } from 'lucide-react';
import TrackerCard from '../components/TrackerCard'; 
import useStore from '../store/useStore';

const DashboardPage = () => {
  const { children, activeChildId, setActiveChild, addChild } = useStore();
  
  // 모달 열림/닫힘 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 새 자녀 입력 폼 상태
  const [newChildName, setNewChildName] = useState('');
  const [newChildDate, setNewChildDate] = useState('');
  const [newChildGender, setNewChildGender] = useState('female');

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 자녀 추가 핸들러
  const handleAddChild = (e) => {
    e.preventDefault();
    if (!newChildName || !newChildDate) return; // 유효성 검사

    addChild({
        name: newChildName,
        birthDate: newChildDate,
        gender: newChildGender
    });

    // 입력창 초기화 및 모달 닫기
    setNewChildName('');
    setNewChildDate('');
    setIsModalOpen(false);
  };

  // ... (기존 데이터 로직 유지)
  const summaryData = [
    { id: 1, title: 'Feeding', subtitle: '모유/분유', value: '850', unit: 'ml', themeColor: 'amber', icon: Milk },
    { id: 2, title: 'Pumping', subtitle: '유축량', value: '120', unit: 'ml', themeColor: 'emerald', icon: Droplet },
    { id: 3, title: 'Sleep', subtitle: '총 수면', value: '12', unit: 'hr', themeColor: 'indigo', icon: Moon },
    { id: 4, title: 'Diaper', subtitle: '기저귀', value: '6', unit: '회', themeColor: 'sky', icon: Activity },
  ];

  // 2. 일정 데이터
  const scheduleData = [
    { time: '14:00', title: '2차 영유아 검진', location: '소아과', type: 'hospital' },
    { time: '16:00', title: '이유식 재료 주문', location: '쿠팡', type: 'shopping' },
    { time: '18:00', title: '친정 부모님 방문', location: '집', type: 'family' },
  ];

  // 3. D-Day 계산 헬퍼
  // D-Day 계산 헬퍼
  const getDays = (dateString) => {
      const today = new Date();
      const birth = new Date(dateString);
      const diff = today - birth;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1; 
      return days > 0 ? days : 1; // 태어난 날은 1일
  };

  return (
    <div className="pb-24 md:pb-0 h-full flex flex-col relative">
      
      {/* Compact Hero Card */}
      {/* 1. Header & Child Tabs */}
      <header className="flex justify-between items-center mb-6 px-1 shrink-0">
        <div>
            <div className="flex gap-2 mb-2 flex-wrap">
                {children.map(child => (
                    <button 
                        key={child.id}
                        onClick={() => setActiveChild(child.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            activeChildId === child.id 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-200' 
                            : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <div className="w-4 h-4 rounded-full bg-white/30 overflow-hidden">
                            <img src={child.photo} alt={child.name} className="w-full h-full object-cover" />
                        </div>
                        {child.name}
                    </button>
                ))}
               
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-300 hover:text-amber-500 hover:border-amber-400 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
                {currentChild.name}맘님, 환영해요!
            </h1>
        </div>
        <div className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 relative group">
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
        </div>
      </header>

      {/* 2. Compact Hero Card */}
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
                <button 
                    onClick={() => navigate('/record')}
                    
                    className="bg-white text-orange-500 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    <span>성장 기록</span>
                <button className="bg-white text-orange-500 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-orange-50 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" strokeWidth={3} /> 기록
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
                    <button className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                        전체보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                </div>
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        {scheduleData.map((item, index) => (
                            <div key={index} className="flex items-center p-2.5 rounded-2xl hover:bg-amber-50/50 transition-colors group cursor-pointer border border-transparent hover:border-amber-100">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-500 font-bold border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <span className="text-[10px] text-gray-400 font-medium">PM</span>
                                    <span className="text-base leading-none">{item.time.split(':')[0]}</span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-bold text-gray-800">{item.title}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{item.location} • {item.type}</p>
                                </div>
                                <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                         <div className="p-4 text-center text-xs text-gray-300 font-medium border-t border-dashed border-gray-100 mt-2">
                            일정이 더 없어요
                            일정이 더 없어요 🎉
                        </div>
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
                    <button className="w-full bg-white text-indigo-900 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">
                        읽어보기
                    </button>
                 </div>
            </div>
            
             <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex-1">
                <h3 className="text-base font-bold text-gray-800 mb-3">10월</h3>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-gray-300 text-[10px] font-bold py-1">{d}</div>)}
                    {Array.from({length: 31}).map((_, i) => (
                        <div key={i} className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xs cursor-pointer ${i+1 === 24 ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                            {i+1}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 relative border border-white/50">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-500">
                        <Baby className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">새 아이 등록</h3>
                    <p className="text-sm text-gray-500 mt-1">소중한 아이의 정보를 입력해주세요</p>
                </div>

                <form onSubmit={handleAddChild} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이름 / 태명</label>
                        <input 
                            type="text" 
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            placeholder="예: 튼튼이" 
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">생년월일</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={newChildDate}
                                onChange={(e) => setNewChildDate(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all text-gray-700"
                                required
                            />
                            <CalendarIcon className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">성별</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button"
                                onClick={() => setNewChildGender('female')}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'female' ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-gray-100 text-gray-400'}`}
                            >
                                공주님 🎀
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewChildGender('male')}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'male' ? 'bg-sky-50 border-sky-200 text-sky-500' : 'bg-white border-gray-100 text-gray-400'}`}
                            >
                                왕자님 👑
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-amber-500 text-white py-3.5 rounded-xl text-sm font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all mt-2"
                    >
                        등록하기
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;