import React, { useState } from 'react';
import { Ruler, Weight, Baby, CheckCircle2, Circle, Mic, Camera, ChevronRight, TrendingUp } from 'lucide-react';
import useStore from '../store/useStore';

const RecordPage = () => {
  const { children, activeChildId } = useStore();
  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 생후 개월 수 계산 (반자동 추천을 위한 핵심 로직)
  const getMonths = (dateString) => {
    const today = new Date();
    const birth = new Date(dateString);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    return months <= 0 ? 0 : months;
  };

  const currentMonths = getMonths(currentChild.birthDate);

  // 더미 데이터: 실제로는 DB에서 가져와야 함
  const growthHistory = [
    { month: 0, height: 50, weight: 3.2 },
    { month: 1, height: 54, weight: 4.5 },
    { month: 2, height: 58, weight: 5.8 },
    { month: 3, height: 61, weight: 6.7 }, // 현재
  ];

  // ★ 반자동 기능: 개월 수에 맞는 발달 과업 자동 추천
  // 실제로는 데이터베이스에 '시기별 과업 리스트'가 있어야 함
  const milestones = [
    { id: 1, text: '목을 가눌 수 있어요', category: 'physical', completed: true },
    { id: 2, text: '소리 나는 쪽을 쳐다봐요', category: 'sense', completed: true },
    { id: 3, text: '옹알이를 시작했어요', category: 'language', completed: false }, // 추천 과업
    { id: 4, text: '주먹을 쥐고 펴요', category: 'physical', completed: false }, // 추천 과업
  ];

  return (
    <div className="h-full flex flex-col gap-6 pb-20 md:pb-0">
 
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 flex-1">
        
        {/* Left Col: 신체 계측 (그래프 & 수치) */}
        <div className="md:col-span-7 flex flex-col gap-6">
            {/* 최신 신체 정보 카드 */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* 성장 그래프 (간단한 시각화) */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6">성장 추이</h3>
                <div className="flex-1 flex items-end justify-between px-2 gap-4 relative min-h-[200px]">
                    {/* 배경 라인 */}
                    <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-6">
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                        <div className="border-b border-gray-50 h-0 w-full"></div>
                    </div>
                    
                    {/* 그래프 바 */}
                    {growthHistory.map((data, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 z-10 group cursor-pointer w-full">
                             <div className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-1.5 py-0.5 rounded mb-1">
                                {data.height}cm
                             </div>
                             <div 
                                style={{ height: `${(data.height / 70) * 200}px` }} 
                                className="w-full max-w-[40px] bg-amber-200 rounded-t-xl relative group-hover:bg-amber-400 transition-colors"
                             ></div>
                             <span className="text-xs font-bold text-gray-400">{data.month}개월</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Col: 발달 과업 (Milestones) */}
        <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* ★ 반자동 추천 영역 */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <h3 className="text-lg font-bold mb-1 relative z-10">발달 체크리스트</h3>
                <p className="text-indigo-100 text-xs mb-4 relative z-10">
                    생후 {currentMonths}개월 아기들이 보통 하는 행동이에요.<br/>
                    {currentChild.name}도 할 수 있나요?
                </p>

                <div className="space-y-3 relative z-10">
                    {milestones.filter(m => !m.completed).map(item => (
                        <div key={item.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-colors">
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center shrink-0">
                                {/* 체크하면 채워지는 효과 */}
                            </div>
                            <span className="text-sm font-medium flex-1">{item.text}</span>
                        </div>
                    ))}
                </div>
                
                <button className="mt-4 w-full py-3 bg-white text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors">
                    모두 기록하기
                </button>
            </div>

            {/* 완료한 과업 목록 */}
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

            {/* 반자동 입력 퀵 버튼 (음성/사진) */}
            <div className="grid grid-cols-2 gap-3">
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

// 간단한 아이콘 컴포넌트
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5v14"/>
    </svg>
);

export default RecordPage;