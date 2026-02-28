import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bell, X, Baby, Settings, ChevronDown, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
    const { children, activeChildId, setActiveChild, addChild, uploadChildImage, notifications } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const showChildSelectorPaths = ['/dashboard', '/diary', '/calendar', '/record'];
    const showChildSelector = showChildSelectorPaths.some(path => location.pathname.startsWith(path));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsChildDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 읽지 않은 알림 개수 계산
    const safeNotifications = notifications || [];
    const unreadCount = safeNotifications.filter(n => !n.isRead).length;

    const [newChildName, setNewChildName] = useState('');
    const [newChildDate, setNewChildDate] = useState('');
    const [newChildTime, setNewChildTime] = useState('');
    const [newChildGender, setNewChildGender] = useState('female');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // 현재 선택된 아이 (없으면 첫 번째)
    const currentChild = children.find(c => c.id === activeChildId) || children[0];

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert('jpg, png, gif, webp 형식의 이미지만 업로드 가능합니다.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageFile(file);
            setImagePreview(event.target?.result || null);
        };
        reader.readAsDataURL(file);
    };

    const handleAddChild = async (e) => {
        e.preventDefault();
        if (!newChildName || !newChildDate) return;
        const birthTime = newChildTime
            ? (newChildTime.length === 5 ? `${newChildTime}:00` : newChildTime)
            : '00:00:00';

        const result = await addChild({
            name: newChildName,
            birthDay: newChildDate,
            birthTime,
            gender: newChildGender === 'female' ? 'F' : 'M'
        });

        if (result.success) {
            if (imageFile && result.childId) {
                const uploadResult = await uploadChildImage(result.childId, imageFile);
                if (!uploadResult?.success) {
                    alert(uploadResult?.message || '이미지 업로드에 실패했습니다.');
                }
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

                {/* [수정됨] 인사말(H1) 삭제하고 아이 선택 버튼만 남김 */}
                <div className="flex gap-2 flex-wrap items-center">
                    {/* 브랜드 로고 */}
                    <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src="/베베헬퍼로고.png" alt="BebeHelper Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-serif-kr font-bold text-stone-800 dark:text-white transition-all duration-300 whitespace-nowrap md:hidden lg:block">
                            BebeHelper
                        </span>
                    </div>

                </div>

                {/* 우측 버튼 영역 */}
                <div className="flex items-center gap-2">
                    {/* 자녀 선택 드롭다운 (showChildSelector가 true일 때만) */}
                    {showChildSelector && children.length > 0 && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsChildDropdownOpen(!isChildDropdownOpen)}
                                className={`flex items-center gap-2 px-1.5 py-1.5 pr-2 rounded-full text-xs font-bold transition-all border shadow-sm ${isChildDropdownOpen
                                    ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400'
                                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="relative flex items-center justify-center">
                                    {/* 맥박 효과 (Pulse) - Framer Motion으로 더 부드럽게 구현 */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full border-2 border-amber-400"
                                    ></motion.div>
                                    <div className="relative w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden border border-amber-200 dark:border-amber-800 z-10 shrink-0">
                                        <img
                                            src={currentChild?.photo || 'default_path'}
                                            alt={currentChild?.name}
                                            className="w-full h-full object-cover"
                                            onError={handleImageError}
                                        />
                                    </div>
                                </div>
                                <span className="hidden sm:block truncate max-w-[80px]">{currentChild?.name}</span>
                                <motion.div
                                    animate={{ rotate: isChildDropdownOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ${isChildDropdownOpen ? 'text-amber-500' : ''}`} />
                                </motion.div>
                            </button>

                            {/* 드롭다운 메뉴 (자녀 목록) - AnimatePresence 적용 */}
                            <AnimatePresence>
                                {isChildDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden origin-top-right"
                                    >
                                        <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                                <span>우리아이 목록</span>
                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full text-[9px]">{children.length}명</span>
                                            </div>
                                            {children.map(child => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => {
                                                        setActiveChild(child.id);
                                                        setIsChildDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${activeChildId === child.id
                                                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100/50 dark:border-amber-700/50'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0 shadow-sm">
                                                            <img
                                                                src={child.photo || 'default_path'}
                                                                alt={child.name}
                                                                className="w-full h-full object-cover"
                                                                onError={handleImageError}
                                                            />
                                                        </div>
                                                        <span className="truncate">{child.name}</span>
                                                    </div>
                                                    {activeChildId === child.id && (
                                                        <motion.div
                                                            layoutId="activeChildDot"
                                                            className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                                        ></motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
                                            <button
                                                onClick={() => {
                                                    setIsModalOpen(true);
                                                    setIsChildDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-amber-100 dark:hover:border-amber-700 hover:shadow-sm transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                새 아이 등록
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    {/* 설정 버튼 (모바일만) */}
                    <button
                        onClick={() => navigate('/settings')}
                        className="md:hidden p-2.5 rounded-full shadow-sm border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* 알림 버튼 */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotiOpen(!isNotiOpen)}
                            className={`p-2.5 rounded-full shadow-sm border transition-all ${isNotiOpen
                                ? 'bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-900/40 dark:border-amber-700'
                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                            )}
                        </button>

                        {/* 알림 드롭다운 */}
                        <AnimatePresence>
                            {isNotiOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 z-50"
                                >
                                    <NotificationDropdown onClose={() => setIsNotiOpen(false)} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* 자녀 추가 모달 - AnimatePresence 적용 */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                        ></motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-sm p-6 relative border border-white/50 dark:border-gray-700 z-10"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-500">
                                    <Baby className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">새 아이 등록</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">소중한 아이의 정보를 입력해주세요</p>
                            </div>

                            <form onSubmit={handleAddChild} className="space-y-4">
                                <div className="text-center mb-1">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-amber-400 transition-colors mx-auto"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
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
                                        className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all dark:text-white dark:placeholder:text-gray-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">생년월일</label>
                                    <input
                                        type="date"
                                        value={newChildDate}
                                        onChange={(e) => setNewChildDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all text-gray-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">출생시간 (선택)</label>
                                    <input
                                        type="time"
                                        value={newChildTime}
                                        onChange={(e) => setNewChildTime(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all text-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">성별</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewChildGender('female')}
                                            className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'female' ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}
                                        >
                                            공주님 🎀
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewChildGender('male')}
                                            className={`py-3 rounded-xl text-sm font-bold border transition-all ${newChildGender === 'male' ? 'bg-sky-50 border-sky-200 text-sky-500 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400' : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </>
    );
};

export default Header;
