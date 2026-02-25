import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bell, X, Camera, Settings } from 'lucide-react';
import useStore from '../store/useStore';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const { children, activeChildId, setActiveChild, addChild, uploadChildImage, notifications } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 자녀 목록이 필요 없는 페이지
  const hideChildSelector = location.pathname.startsWith('/community') || location.pathname === '/settings';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 읽지 않은 알림 개수 계산
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  const [newChildName, setNewChildName] = useState('');
  const [newChildDate, setNewChildDate] = useState('');
  const [newChildTime, setNewChildTime] = useState('');
  const [newChildGender, setNewChildGender] = useState('male');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('jpg, png, gif, webp 형식의 이미지만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => { setImageFile(file); setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  // 현재 선택된 아이 (없으면 첫 번째)
  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName || !newChildDate) return;

    const result = await addChild({
        name: newChildName,
        birthDay: newChildDate,
        birthTime: newChildTime || '00:00:00',
        gender: newChildGender === 'female' ? 'F' : 'M'
    });

    if (result.success) {
      if (imageFile && result.childId) {
        await uploadChildImage(result.childId, imageFile);
      }
      setNewChildName('');
      setNewChildDate('');
      setNewChildTime('');
      setImageFile(null);
      setImagePreview(null);
      setIsModalOpen(false);
    } else {
      alert(result.message);
    }
  };

  // 이미지 에러 시 기본 이미지로 대체하는 핸들러
  const handleImageError = (e) => {
    e.target.src = 'https://cdn-icons-png.flaticon.com/512/3233/3233483.png'; // 임시 기본 이미지
  };

  return (
    <>
      {/* z-index를 40으로 유지하되, 필요 시 모달보다 낮아야 함 */}
      <header className="flex justify-between items-center mb-4 px-1 shrink-0 relative z-40">
        
        {/* 자녀 선택 버튼 (특정 페이지에서는 숨김) */}
        <div className="flex gap-2 flex-wrap items-center">
          {!hideChildSelector && (
            <>
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
                            onError={handleImageError}
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
            </>
          )}
        </div>

        {/* 우측 버튼 영역 */}
        <div className="flex items-center gap-2">
            {/* 설정 버튼 (모바일만) */}
            <button
                onClick={() => navigate('/settings')}
                className="md:hidden p-2.5 rounded-full shadow-sm border bg-white border-gray-100 text-gray-400 hover:bg-gray-50 transition-all"
            >
                <Settings className="w-5 h-5" />
            </button>

            {/* 알림 버튼 */}
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
                    <div className="absolute right-0 top-full mt-2 z-50">
                         <NotificationDropdown onClose={() => setIsNotiOpen(false)} />
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* 자녀 추가 모달 */}
      {isModalOpen && (
        // [수정됨] z-index를 100으로 높여서 최상단 보장
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-sm p-6 relative border border-white/50 dark:border-gray-700 transition-colors duration-300">
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white">새 아이 등록</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">소중한 아이의 정보를 입력해주세요</p>
                </div>

                <form onSubmit={handleAddChild} className="space-y-4">
                    <div className="text-center mb-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-amber-400 transition-colors mx-auto"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Camera className="w-6 h-6" />
                                    <span className="text-[10px] mt-1">사진</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">이름 / 태명</label>
                        <input
                            type="text"
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            placeholder="예: 튼튼이"
                            className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">생년월일</label>
                        <input
                            type="date"
                            value={newChildDate}
                            onChange={(e) => setNewChildDate(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all text-gray-700"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">출생 시간</label>
                        <input
                            type="time"
                            value={newChildTime}
                            onChange={(e) => setNewChildTime(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">성별</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setNewChildGender('male')}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'male' ? 'bg-sky-50 border-sky-200 text-sky-500 dark:bg-sky-900/30 dark:border-sky-500 dark:text-sky-300' : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                            >
                                왕자님 👑
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewChildGender('female')}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'female' ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-300' : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                            >
                                공주님 🎀
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-amber-500 text-white py-3.5 rounded-xl text-sm font-black shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-600 transition-all mt-2"
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