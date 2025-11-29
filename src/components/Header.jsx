// src/components/Header.jsx
import React, { useState } from 'react';
import { Plus, Bell, X, Baby, Calendar as CalendarIcon } from 'lucide-react';
import useStore from '../store/useStore';

const Header = () => {
  const { children, activeChildId, setActiveChild, addChild } = useStore();
  
  // 모달 상태와 로직을 여기로 가져옴
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDate, setNewChildDate] = useState('');
  const [newChildGender, setNewChildGender] = useState('female');

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  const handleAddChild = (e) => {
    e.preventDefault();
    if (!newChildName || !newChildDate) return;

    addChild({
        name: newChildName,
        birthDate: newChildDate,
        gender: newChildGender
    });

    setNewChildName('');
    setNewChildDate('');
    setIsModalOpen(false);
  };

  return (
    <>
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
                {currentChild ? `${currentChild.name}맘님, 환영해요!` : '아이를 등록해주세요!'}
            </h1>
        </div>
        <div className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 relative group">
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
        </div>
      </header>

      {/* 모달 (Header 레벨에서 관리되어야 어디서든 뜸) */}
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
    </>
  );
};

export default Header;