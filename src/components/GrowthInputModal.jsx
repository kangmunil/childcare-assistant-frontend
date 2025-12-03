import React, { useState } from 'react';
import { X, Check } from 'lucide-react'; // 아이콘이 없으면 텍스트로 대체 가능

const GrowthInputModal = ({ isOpen, onClose, onSave }) => {
  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const handleSubmit = () => {
    if (!height || !weight) {
      alert('키와 몸무게를 모두 입력해주세요!');
      return;
    }
    // 부모 컴포넌트(RecordPage)로 데이터 전달
    onSave({ 
      height: parseFloat(height), 
      weight: parseFloat(weight),
      date: new Date().toISOString() 
    });
    // 입력창 초기화 및 닫기
    setHeight('');
    setWeight('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">쑥쑥 기록하기 🌱</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">키 (Height)</label>
            <div className="relative">
              <input 
                type="number" 
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all"
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">cm</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">몸무게 (Weight)</label>
            <div className="relative">
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-rose-500 focus:bg-white outline-none font-bold text-lg transition-all"
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <button 
          onClick={handleSubmit}
          className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          저장하기
        </button>
      </div>
    </div>
  );
};

export default GrowthInputModal;