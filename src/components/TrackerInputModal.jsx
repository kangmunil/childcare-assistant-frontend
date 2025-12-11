import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const TrackerInputModal = ({ isOpen, onClose, data, onSave }) => {
  const [value, setValue] = useState('');

  // 모달이 열릴 때 기존 값을 input에 세팅
  useEffect(() => {
    if (isOpen && data) {
      setValue(data.value);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data.id, value); // 부모에게 변경된 값 전달
    onClose();
  };

  // 테마 색상 설정
  const themeColors = {
    amber: 'bg-amber-500 hover:bg-amber-600 ring-amber-200',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 ring-emerald-200',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 ring-indigo-200',
    sky: 'bg-sky-500 hover:bg-sky-600 ring-sky-200',
  };
  
  const btnColor = themeColors[data.themeColor] || themeColors.amber;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6 relative transform transition-all scale-100">
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 mt-2">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-${data.themeColor}-100 text-${data.themeColor}-500`}>
                <data.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{data.title} 수정</h3>
            <p className="text-sm text-gray-500">{data.subtitle} 데이터를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="relative flex items-center justify-center mb-8">
                <input 
                    type="number" 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full text-center text-4xl font-black text-gray-800 border-b-2 border-gray-200 focus:border-gray-800 outline-none py-2 bg-transparent placeholder-gray-200"
                    placeholder="0"
                    autoFocus
                />
                <span className="absolute right-8 bottom-4 text-gray-400 font-bold text-lg">{data.unit}</span>
            </div>

            <button 
                type="submit" 
                className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${btnColor}`}
            >
                <Check className="w-5 h-5" strokeWidth={3} />
                저장하기
            </button>
        </form>
      </div>
    </div>
  );
};

export default TrackerInputModal;