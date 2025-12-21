import React, { useState } from 'react';
import { Plus, Bell, X, Baby } from 'lucide-react';
import useStore from '../store/useStore';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const { children, activeChildId, setActiveChild, addChild, notifications } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 읽지 않은 알림 개수 계산
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  const [newChildName, setNewChildName] = useState('');
  const [newChildDate, setNewChildDate] = useState('');
  const [newChildGender, setNewChildGender] = useState('female');

  // 현재 선택된 아이 (없으면 첫 번째)
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

  // 이미지 에러 시 기본 이미지로 대체하는 핸들러
  const handleImageError = (e) => {
    e.target.src = 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'; // 임시 기본 이미지
  };

  return (
    <>
      {/* z-index를 40으로 유지하되, 필요 시 모달보다 낮아야 함 */}
      <header className="flex justify-between items-center mb-4 px-1 shrink-0 relative z-40">
        
        {/* [수정됨] 인사말(H1) 삭제하고 아이 선택 버튼만 남김 */}
        <div className="flex gap-2 flex-wrap items-center">
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
                        <img 
                            src={child.photo || 'default_path'} 
                            alt={child.name} 
                            className="w-full h-full object-cover"
                            onError={handleImageError} // [추가됨] 이미지 엑박 방지
                        />
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

        {/* 우측 알림 버튼 영역 */}
        <div className="relative">
            <button 
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className={`p-2.5 rounded-full shadow-sm border transition-all ${
                    isNotiOpen ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                )}
            </button>

            {/* 알림 드롭다운 */}
            {isNotiOpen && (
                // 위치 잡기 위해 div로 한 번 감싸는 것 추천 (스타일은 NotificationDropdown 내부에 맡김)
                <div className="absolute right-0 top-full mt-2 z-50">
                     <NotificationDropdown onClose={() => setIsNotiOpen(false)} />
                </div>
            )}
        </div>
      </header>

      {/* 자녀 추가 모달 */}
      {isModalOpen && (
        // [수정됨] z-index를 100으로 높여서 최상단 보장
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
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
                        {/* [확인] type="date"로 잘 되어 있음 */}
                        <input 
                            type="date" 
                            value={newChildDate}
                            onChange={(e) => setNewChildDate(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all text-gray-700"
                            required
                        />
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