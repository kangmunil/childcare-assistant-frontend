import React, { useState } from 'react';
import { X, Check, Baby } from 'lucide-react';

const GrowthInputModal = ({ isOpen, onClose, onSave }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!height || !weight) {
      alert('키와 몸무게를 모두 입력해주세요!');
      return;
    }
    if (saving) return;
    setSaving(true);

    await onSave({
      height: parseFloat(height),
      weight: parseFloat(weight),
      date: new Date().toISOString()
    });

    setSaving(false);
    setHeight('');
    setWeight('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100 border border-white/20">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <Baby className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">쑥쑥 기록하기</h3>
                    <p className="text-xs text-gray-400">키와 몸무게를 입력해요</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
            </button>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          {/* 키 입력 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">키 (Height)</label>
            <div className="relative">
              <input 
                type="number" 
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all text-gray-800"
                placeholder="0.0"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">cm</span>
            </div>
          </div>

          {/* 몸무게 입력 (수정됨!) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">몸무게 (Weight)</label>
            <div className="relative">
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)} 
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-rose-500 focus:bg-white outline-none font-bold text-lg transition-all text-gray-800"
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full mt-8 py-4 bg-indigo-600 disabled:bg-gray-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          {saving ? '저장 중...' : '기록 저장하기'}
        </button>
      </div>
    </div>
  );
};

export default GrowthInputModal;