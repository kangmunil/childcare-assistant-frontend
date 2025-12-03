import React, { useState } from 'react';
import { Ruler, Weight, TrendingUp, CheckCircle2, Mic, Camera, Plus, X, Check } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateMonths } from '../utils/dateUtils';
import GrowthInputModal from '../components/GrowthInputModal';

const RecordPage = () => {
  const { children, activeChildId } = useStore();
  const currentChild = children.find(c => c.id === activeChildId) || children[0];
  
  // 모달 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonths = calculateMonths(currentChild.birthDate);

  // 더미 데이터 (나중엔 서버 데이터로 교체)
  const growthHistory = [
    { month: 0, height: 50, weight: 3.2 },
    { month: 1, height: 54, weight: 4.5 },
    { month: 2, height: 58, weight: 5.8 },
    { month: 3, height: 61, weight: 6.7 },
  ];

  const milestones = [
    { id: 1, text: '목을 가눌 수 있어요', category: 'physical', completed: true },
    { id: 2, text: '소리 나는 쪽을 쳐다봐요', category: 'sense', completed: true },
    { id: 3, text: '옹알이를 시작했어요', category: 'language', completed: false },
    { id: 4, text: '주먹을 쥐고 펴요', category: 'physical', completed: false },
  ];

  const handleSaveGrowth = (data) => {
    console.log("저장된 데이터:", data);
    // 여기에 추후 데이터 저장 로직(API 호출 등) 추가
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-20 md:pb-0 relative">
      
      {/* 1. 입력 모달 (평소엔 숨겨져 있음) */}
      <GrowthInputModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveGrowth} 
      />

      {/* 2. 페이지 상단 헤더 (타이틀 + 버튼) */}
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-800">신체 발달 기록</h2>
        
        {/* ★ 여기가 멘티님이 찾던 그 버튼입니다! */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          기록 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1">
        
        {/* Left Col: 신체 계측 */}
        <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2">
            {/* 최신 신체 정보 카드 */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ruler className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-gray-400 text-xs font-bold mb-1">키 (Height)</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-800">61.5</span>
                        <span className="text-sm font-bold text-gray-400">cm</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <TrendingUp className="w-3 h-3" /> 상위 15%
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Weight className="w-16 h-16 text-rose-500" />
                    </div>
                    <p className="text-gray-400 text-xs font-bold mb-1">몸무게 (Weight)</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-800">6.7</span>
                        <span className="text-sm font-bold text-gray-400">kg</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <TrendingUp className="w-3 h-3" /> 표준 범위
                    </div>
                </div>
            </div>

            {/* 성장 그래프 */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 mb-6">성장 추이</h3>
                <div className="flex-1 flex items-end justify-between px-2 gap-4 relative">
                    <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-6">
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                    </div>
                    {growthHistory.map((data, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 z-10 group cursor-pointer w-full">
                             <div className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-1.5 py-0.5 rounded mb-1">
                                {data.height}cm
                             </div>
                             <div 
                                style={{ height: `${(data.height / 70) * 100}%` }} 
                                className="w-full max-w-[40px] bg-amber-200 rounded-t-xl relative group-hover:bg-amber-400 transition-colors"
                             ></div>
                             <span className="text-xs font-bold text-gray-400">{data.month}개월</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Col: 발달 과업 */}
        <div className="md:col-span-5 flex flex-col gap-6 overflow-y-auto">
            {/* ... 기존 발달 체크리스트 코드 ... */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-lg font-bold mb-1 relative z-10">발달 체크리스트</h3>
                <p className="text-indigo-100 text-xs mb-4 relative z-10">
                    생후 {currentMonths}개월 아기들이 보통 하는 행동이에요.<br/>
                    {currentChild.name}도 할 수 있나요?
                </p>
                <div className="space-y-3 relative z-10">
                    {milestones.filter(m => !m.completed).map(item => (
                        <div key={item.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-colors">
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center shrink-0"></div>
                            <span className="text-sm font-medium flex-1">{item.text}</span>
                        </div>
                    ))}
                </div>
                <button className="mt-4 w-full py-3 bg-white text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors">
                    모두 기록하기
                </button>
            </div>

            {/* 완료한 과업 */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex-1">
                 <h3 className="text-base font-bold text-gray-800 mb-4">완료한 과업</h3>
                 <div className="space-y-4">
                    {milestones.filter(m => m.completed).map(item => (
                        <div key={item.id} className="flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-gray-700 decoration-gray-400">{item.text}</p>
                                <p className="text-[10px] text-gray-400">{item.category === 'physical' ? '신체 발달' : '감각 발달'} • 2025.10.01 달성</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

            {/* 퀵 버튼 */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
                <button className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all text-gray-400">
                    <Mic className="w-6 h-6" />
                    <span className="text-xs font-bold">말로 기록</span>
                </button>
                 <button className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all text-gray-400">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-bold">사진 분석</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
=======
// 간단한 아이콘 컴포넌트
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5v14"/>
    </svg>
);

import React from 'react';
import { NotebookPen } from 'lucide-react';

const RecordPage = () => {
    return (
        <div className="text-center p-8 bg-white rounded-xl shadow-md space-y-4">
            <NotebookPen className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">육아 일지 작성</h2>
            <p className="text-gray-500">신생아/유아기별 기록 항목을 입력하는 폼 설계가 필요합니다.</p>
        </div>
    );
};

>>>>>>> 4d0e0ea457842f5ecb18b8d9013c90644fb2e793
export default RecordPage;