import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Shield, HelpCircle, LogOut, ChevronRight, Moon, Volume2, X, Plus, Trash2, AlertTriangle, Pencil, Camera } from 'lucide-react';
import useStore from '../store/useStore';

// [1] 재사용 가능한 공통 모달 컴포넌트
const CommonModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달 본문 */}
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar px-1 -mx-1">
            {children}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  
  // [Store 연결] 전역 상태 및 API 함수 가져오기
  const { 
    user, 
    logout, 
    updateUserInfo, // 내 정보 수정 API
    withdrawMember, // 회원 탈퇴 API
    isDarkMode, 
    toggleDarkMode,
    children,
    addChild,       // 자녀 등록 API
    deleteChild,    // 자녀 삭제 API
    updateChild,    // 자녀 수정 API
    uploadChildImage // 자녀 이미지 업로드 API
  } = useStore();
  
  // --- 로컬 UI 상태 ---
  const [notifications, setNotifications] = useState(true); 
  const [activeModal, setActiveModal] = useState(null); 
  
  // 프로필 수정용 상태
  const [tempName, setTempName] = useState('');

  // 모달 열릴 때 user 정보로 초기화
  useEffect(() => {
    if (activeModal === 'profile' && user) {
        setTempName(user.name || '');
    }
  }, [activeModal, user]);

  // 자녀 추가 모드 상태
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildInput, setNewChildInput] = useState({ name: '', birthDay: '', birthTime: '', gender: 'M' });

  // 자녀 수정 모드 상태
  const [editingChild, setEditingChild] = useState(null);

  // 이미지 관련 상태
  const [newChildImageFile, setNewChildImageFile] = useState(null);
  const [newChildImagePreview, setNewChildImagePreview] = useState(null);
  const [editChildImageFile, setEditChildImageFile] = useState(null);
  const [editChildImagePreview, setEditChildImagePreview] = useState(null);
  const newChildFileRef = useRef(null);
  const editChildFileRef = useRef(null);

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleImageSelect = (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('jpg, png, gif, webp 형식의 이미지만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (mode === 'add') {
        setNewChildImageFile(file);
        setNewChildImagePreview(ev.target.result);
      } else {
        setEditChildImageFile(file);
        setEditChildImagePreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- 핸들러 함수들 ---

  // 1. 프로필 저장 (API 호출)
  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    // 백엔드 API 호출
    const result = await updateUserInfo({ 
        name: tempName,
        email: user?.email 
    });

    if (result.success) {
        alert("정보가 수정되었습니다.");
        setActiveModal(null);
    } else {
        alert(`수정 실패: ${result.message}`);
    }
  };

  // 2. 회원 탈퇴 (API 호출)
  const handleWithdraw = async () => {
    if (window.confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) {
        const result = await withdrawMember();
        
        if (result.success) {
            alert('탈퇴 처리되었습니다. 이용해 주셔서 감사합니다.');
            navigate('/login');
        } else {
            // 실패 시 (예: 자녀가 남아있음)
            alert(`탈퇴 실패: ${result.message}`);
        }
    }
  };

  // 3. 자녀 추가 (API 호출)
  const handleSaveNewChild = async () => {
    if (!newChildInput.name || !newChildInput.birthDay) {
        alert('이름과 생년월일을 모두 입력해주세요.');
        return;
    }

    // 나이를 기반으로 생년월일 계산 (YYYY-MM-DD 형식)
    // const birthYear = new Date().getFullYear() - parseInt(newChildInput.age);
    // const calculatedBirthDay = `${birthYear}-01-01`;

    // API 호출
    const result = await addChild({
        name: newChildInput.name,
        birthDay: newChildInput.birthDay,
        birthTime: newChildInput.birthTime || "00:00:00",
        gender: newChildInput.gender || "M",
    });

    if (result.success) {
        if (newChildImageFile && result.childId) {
          await uploadChildImage(result.childId, newChildImageFile);
        }
        alert("자녀가 등록되었습니다.");
        setNewChildInput({ name: '', birthDay: '', birthTime: '', gender: 'M' });
        setNewChildImageFile(null);
        setNewChildImagePreview(null);
        setIsAddingChild(false);
    } else {
        alert(`등록 실패: ${result.message}`);
    }
  };

  // 5. 자녀 수정 (API 호출)
  const handleUpdateChild = async () => {
    if (!editingChild.name || !editingChild.birthDay) {
        alert('이름과 생년월일을 모두 입력해주세요.');
        return;
    }

    const result = await updateChild(editingChild.id, {
        name: editingChild.name,
        birthDay: editingChild.birthDay,
        birthTime: editingChild.birthTime || "00:00:00",
        gender: editingChild.gender || "M",
        height: editingChild.height,
        weight: editingChild.weight,
    });

    if (result.success) {
        if (editChildImageFile) {
          await uploadChildImage(editingChild.id, editChildImageFile);
        }
        alert("자녀 정보가 수정되었습니다.");
        setEditingChild(null);
        setEditChildImageFile(null);
        setEditChildImagePreview(null);
    } else {
        alert(`수정 실패: ${result.message}`);
    }
  };

  // 4. 자녀 삭제 (API 호출)
  const handleDeleteChild = async (childId) => {
    if (window.confirm("정말 이 자녀 정보를 삭제하시겠습니까?")) {
        const result = await deleteChild(childId);
        if (result.success) {
            alert("삭제되었습니다.");
        } else {
            alert(`삭제 실패: ${result.message}`);
        }
    }
  };

  const handleLogout = () => {
    if(window.confirm('정말 로그아웃 하시겠습니까?')) {
        logout();
        navigate('/login');
    }
  };

  // --- 서브 컴포넌트 (UI) ---
  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-2 px-2">{title}</h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        {children}
      </div>
    </div>
  );

  const MenuItem = ({ icon: Icon, label, value, onClick, isToggle, toggleState, onToggle, isDanger }) => (
    <div 
        onClick={isToggle ? undefined : onClick}
        className={`flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 ${!isToggle && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
            <Icon className="w-4 h-4" />
        </div>
        <span className={`font-medium ${isDanger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>
      </div>
      
      {isToggle ? (
        <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${toggleState ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${toggleState ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
            {value && <span className="text-sm text-gray-400 dark:text-gray-500">{value}</span>}
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </div>
      )}
    </div>
  );

  return (
    <>
    <div className="h-full flex flex-col gap-6 pb-24 md:pb-0">
      <header className="flex justify-between items-center px-2 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">가족 설정</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">계정과 앱 설정을 관리해요</p>
        </div>
      </header>

      <Section title="계정 관리">
        <MenuItem 
            icon={User} 
            label="내 정보 수정" 
            onClick={() => setActiveModal('profile')} 
        />
        <MenuItem 
            icon={Shield} 
            label="자녀 관리" 
            value={`${children.length}명`} 
            onClick={() => setActiveModal('children')} 
        />
      </Section>

      <Section title="앱 설정">
        <MenuItem 
            icon={Bell} 
            label="푸시 알림" 
            isToggle 
            toggleState={notifications} 
            onToggle={() => setNotifications(!notifications)} 
        />
        <MenuItem 
            icon={Moon} 
            label="다크 모드 (수유 모드)" 
            isToggle 
            toggleState={isDarkMode}    
            onToggle={toggleDarkMode}   
        />
         <MenuItem 
            icon={Volume2} 
            label="효과음" 
            value="켜짐"
            onClick={() => {}} 
        />
      </Section>

      <Section title="기타">
        <MenuItem icon={HelpCircle} label="도움말 / 문의하기" onClick={() => {}} />
        <MenuItem icon={LogOut} label="로그아웃" onClick={handleLogout} />
        {/* 회원 탈퇴 메뉴 (빨간색) */}
        <MenuItem icon={AlertTriangle} label="회원 탈퇴" onClick={handleWithdraw} isDanger={true} />
      </Section>
      
      <div className="text-center text-xs text-gray-300 dark:text-gray-600 mt-8 mb-4">
        BebeHelper v1.0.0
      </div>
    </div>

    {/* --- 모달 렌더링 영역 --- */}
    
    {/* 1. 프로필 수정 모달 */}
    <CommonModal 
        isOpen={activeModal === 'profile'} 
        onClose={() => setActiveModal(null)} 
        title="내 정보 수정"
    >
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">닉네임</label>
                <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white p-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
            </div>
            {/* 이메일은 수정 불가 (읽기 전용) */}
            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">이메일</label>
                <input 
                    type="text" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-not-allowed"
                />
            </div>

            <button 
                onClick={handleSaveProfile}
                className="w-full py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors mt-4"
            >
                저장하기
            </button>
        </div>
    </CommonModal>

    {/* 2. 자녀 관리 모달 */}
    <CommonModal 
        isOpen={activeModal === 'children'} 
        onClose={() => {
            setActiveModal(null);
            setIsAddingChild(false);
            setEditingChild(null);
            setNewChildImageFile(null);
            setNewChildImagePreview(null);
            setEditChildImageFile(null);
            setEditChildImagePreview(null);
        }} 
        title={editingChild ? "자녀 정보 수정" : isAddingChild ? "새 자녀 등록" : "자녀 관리"}
    >
        {editingChild ? (
            /* [C] 수정 모드 */
            <div className="space-y-4 animate-fade-in">
                <div className="flex justify-center">
                    <div
                        onClick={() => editChildFileRef.current?.click()}
                        className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-amber-400 transition-colors"
                    >
                        {editChildImagePreview || editingChild.photoUrl ? (
                            <img src={editChildImagePreview || editingChild.photoUrl} alt="미리보기" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-6 h-6" />
                                <span className="text-[10px] mt-1">사진</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={editChildFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(e, 'edit')}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이름</label>
                    <input
                        type="text"
                        value={editingChild.name}
                        onChange={(e) => setEditingChild({...editingChild, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">생년월일</label>
                    <input
                        type="date"
                        value={editingChild.birthDay || ''}
                        onChange={(e) => setEditingChild({...editingChild, birthDay: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">출생 시간</label>
                    <input
                        type="time"
                        value={editingChild.birthTime || ''}
                        onChange={(e) => setEditingChild({...editingChild, birthTime: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">성별</label>
                    <div className="flex gap-2">
                        {['M', 'F'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setEditingChild({...editingChild, gender: g})}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                                    editingChild.gender === g
                                        ? (g === 'M' ? 'bg-sky-50 border-sky-200 text-sky-500 dark:bg-sky-900/30 dark:border-sky-500 dark:text-sky-300' : 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-300')
                                        : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                }`}
                            >
                                {g === 'M' ? '왕자님 👑' : '공주님 🎀'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mt-4 pb-2">
                    <button
                        onClick={() => setEditingChild(null)}
                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleUpdateChild}
                        className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-none"
                    >
                        저장
                    </button>
                </div>
            </div>
        ) : isAddingChild ? (
            /* [B] 입력 모드 */
            <div className="space-y-4 animate-fade-in">
                <div className="flex justify-center">
                    <div
                        onClick={() => newChildFileRef.current?.click()}
                        className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-amber-400 transition-colors"
                    >
                        {newChildImagePreview ? (
                            <img src={newChildImagePreview} alt="미리보기" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-6 h-6" />
                                <span className="text-[10px] mt-1">사진</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={newChildFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(e, 'add')}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이름 / 태명</label>
                    <input
                        type="text"
                        placeholder="예: 튼튼이"
                        value={newChildInput.name}
                        onChange={(e) => setNewChildInput({...newChildInput, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">생년월일</label>
                    <input
                        type="date"
                        value={newChildInput.birthDay}
                        onChange={(e) => setNewChildInput({...newChildInput, birthDay: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">출생 시간</label>
                    <input
                        type="time"
                        value={newChildInput.birthTime}
                        onChange={(e) => setNewChildInput({...newChildInput, birthTime: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">성별</label>
                    <div className="flex gap-2">
                        {['M', 'F'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setNewChildInput({...newChildInput, gender: g})}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                                    newChildInput.gender === g
                                        ? (g === 'M' ? 'bg-sky-50 border-sky-200 text-sky-500 dark:bg-sky-900/30 dark:border-sky-500 dark:text-sky-300' : 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-300')
                                        : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                }`}
                            >
                                {g === 'M' ? '왕자님 👑' : '공주님 🎀'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mt-4 pb-2">
                    <button
                        onClick={() => setIsAddingChild(false)}
                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSaveNewChild}
                        className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-none"
                    >
                        저장
                    </button>
                </div>
            </div>
        ) : (
            /* [A] 목록 모드 */
            <div className="space-y-3">
                {children.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        등록된 자녀가 없습니다.<br/>아이를 등록해보세요!
                    </div>
                )}

                {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                                {child.name.charAt(0)}
                             </div>
                             <div>
                                <span className="font-bold text-gray-700 dark:text-white block">{child.name}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {child.birthDate}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setEditChildImageFile(null);
                                    setEditChildImagePreview(null);
                                    setEditingChild({
                                        id: child.id,
                                        name: child.name,
                                        birthDay: child.birthDay || child.birthDate || '',
                                        birthTime: child.birthTime || '',
                                        gender: child.gender === 'female' || child.gender === 'F' ? 'F' : 'M',
                                        height: child.height,
                                        weight: child.weight,
                                        photoUrl: child.photoUrl || ''
                                    });
                                }}
                                className="p-2 text-gray-300 dark:text-gray-500 hover:text-amber-500 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteChild(child.id)}
                                className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => setIsAddingChild(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700 transition-all mt-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">자녀 추가하기</span>
                </button>

                <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 bg-gray-800 dark:bg-gray-600 text-white font-bold rounded-xl mt-4"
                >
                    닫기
                </button>
            </div>
        )}
    </CommonModal>
    </>
  );
};

export default SettingsPage;