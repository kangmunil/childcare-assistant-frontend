import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Shield, HelpCircle, LogOut, ChevronRight, Moon, Volume2, X, Plus, Trash2, AlertTriangle, Pencil, Camera, Users, Copy, UserMinus } from 'lucide-react';
import useStore from '../store/useStore';

// [1] 재사용 가능한 공통 모달 컴포넌트
const CommonModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달 본문 */}
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300">
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
    uploadChildImage, // 자녀 이미지 업로드 API
    fetchFamilyMembers,   // 가족 구성원 조회
    addFamilyMember,      // 가족 추가
    removeFamilyMember,   // 가족 해제
    updateFamilyRelation, // 관계명 수정
    approveFamilyMember,  // 공유 승인
    rejectFamilyMember    // 공유 거절
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

  // 가족 관리 모달 상태
  const [familyMembers, setFamilyMembers] = useState({});       // { childId: [members] }
  const [familyChildId, setFamilyChildId] = useState(null);     // 가족 추가 대상 자녀 (공유코드 입력 토글)
  const [familyInviteCode, setFamilyInviteCode] = useState('');
  const [editingRelation, setEditingRelation] = useState(null);  // { childId, memberId, relation }
  const [familyLoading, setFamilyLoading] = useState(false);

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

  // 가족 관리 모달 열릴 때 내 아이마다 가족 구성원 조회
  useEffect(() => {
    if (activeModal === 'family') {
      const loadFamilyMembers = async () => {
        setFamilyLoading(true);
        const results = {};
        for (const child of children) {
          const res = await fetchFamilyMembers(child.id);
          if (res.success) {
            results[child.id] = res.data;
          }
        }
        setFamilyMembers(results);
        setFamilyLoading(false);
      };
      loadFamilyMembers();
    }
  }, [activeModal, children, fetchFamilyMembers]);

  // 공유코드 복사
  const handleCopyInviteCode = async () => {
    const code = user?.inviteCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      alert('공유코드가 복사되었습니다.');
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('공유코드가 복사되었습니다.');
    }
  };

  // 가족 추가 (공유코드)
  const handleAddFamily = async (childId) => {
    if (!familyInviteCode.trim()) {
      alert('공유코드를 입력해주세요.');
      return;
    }
    const result = await addFamilyMember(childId, familyInviteCode.trim());
    if (result.success) {
      alert(result.message);
      setFamilyInviteCode('');
      setFamilyChildId(null);
      // 가족 목록 갱신
      const res = await fetchFamilyMembers(childId);
      if (res.success) {
        setFamilyMembers(prev => ({ ...prev, [childId]: res.data }));
      }
    } else {
      alert(result.message);
    }
  };

  // 가족 삭제
  const handleRemoveFamily = async (childId, memberId, memberName) => {
    if (!window.confirm(`${memberName}님을 가족에서 해제하시겠습니까?`)) return;
    const result = await removeFamilyMember(childId, memberId);
    if (result.success) {
      alert(result.message);
      const res = await fetchFamilyMembers(childId);
      if (res.success) {
        setFamilyMembers(prev => ({ ...prev, [childId]: res.data }));
      }
    } else {
      alert(result.message);
    }
  };

  // 관계명 수정 저장
  const handleSaveRelation = async () => {
    if (!editingRelation) return;
    const { childId, memberId, relation } = editingRelation;
    if (!relation.trim()) {
      alert('관계를 입력해주세요.');
      return;
    }
    const result = await updateFamilyRelation(childId, memberId, relation.trim());
    if (result.success) {
      alert(result.message);
      setEditingRelation(null);
      const res = await fetchFamilyMembers(childId);
      if (res.success) {
        setFamilyMembers(prev => ({ ...prev, [childId]: res.data }));
      }
    } else {
      alert(result.message);
    }
  };

  // 공유 승인
  const handleApproveFamily = async (childId, memberId, memberName) => {
    if (!window.confirm(`${memberName}님의 공유를 승인하시겠습니까?`)) return;
    const result = await approveFamilyMember(childId, memberId);
    if (result.success) {
      alert(result.message);
      const res = await fetchFamilyMembers(childId);
      if (res.success) {
        setFamilyMembers(prev => ({ ...prev, [childId]: res.data }));
      }
    } else {
      alert(result.message);
    }
  };

  // 공유 거절
  const handleRejectFamily = async (childId, memberId, memberName) => {
    if (!window.confirm(`${memberName}님의 공유를 거절하시겠습니까?`)) return;
    const result = await rejectFamilyMember(childId, memberId);
    if (result.success) {
      alert(result.message);
      const res = await fetchFamilyMembers(childId);
      if (res.success) {
        setFamilyMembers(prev => ({ ...prev, [childId]: res.data }));
      }
    } else {
      alert(result.message);
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
        <MenuItem
            icon={Users}
            label="가족 관리"
            onClick={() => setActiveModal('family')}
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
            /* [A] 목록 모드 — 그룹핑 */
            <div className="space-y-3">
                {children.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        등록된 자녀가 없습니다.<br/>아이를 등록해보세요!
                    </div>
                )}

                {/* 내 아이 그룹 */}
                {(() => {
                    const myChildren = children.filter(c => c.isOwner);
                    const sharedGroups = Object.entries(
                        children.filter(c => !c.isOwner)
                            .reduce((acc, c) => {
                                const key = c.ownerName || '알 수 없음';
                                (acc[key] = acc[key] || []).push(c);
                                return acc;
                            }, {})
                    );

                    return (
                        <>
                            {myChildren.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1">내 아이</p>
                                    <div className="space-y-2">
                                        {myChildren.map((child) => (
                                            <div key={child.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                                                        {child.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-700 dark:text-white block">{child.name}</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{child.birthDate}</span>
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
                                    </div>

                                    <button
                                        onClick={() => setIsAddingChild(true)}
                                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700 transition-all mt-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="text-sm font-bold">자녀 추가하기</span>
                                    </button>
                                </div>
                            )}

                            {/* 내 아이가 없을 때도 추가 버튼 표시 */}
                            {myChildren.length === 0 && children.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1">내 아이</p>
                                    <button
                                        onClick={() => setIsAddingChild(true)}
                                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="text-sm font-bold">자녀 추가하기</span>
                                    </button>
                                </div>
                            )}

                            {/* 공유받은 아이 그룹 */}
                            {sharedGroups.map(([ownerName, sharedChildren]) => (
                                <div key={ownerName}>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1">{ownerName}님의 아이</p>
                                    <div className="space-y-2">
                                        {sharedChildren.map((child) => (
                                            <div key={child.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                                        {child.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-700 dark:text-white block">{child.name}</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{child.birthDate}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {/* 공유받은 아이: 수정만 가능, 삭제 불가 */}
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
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    );
                })()}

                <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 bg-gray-800 dark:bg-gray-600 text-white font-bold rounded-xl mt-4"
                >
                    닫기
                </button>
            </div>
        )}
    </CommonModal>

    {/* 3. 가족 관리 모달 */}
    <CommonModal
        isOpen={activeModal === 'family'}
        onClose={() => {
            setActiveModal(null);
            setFamilyChildId(null);
            setFamilyInviteCode('');
            setEditingRelation(null);
        }}
        title="가족 관리"
    >
        <div className="space-y-5">
            {/* 내 공유코드 카드 */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">내 공유코드</p>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-gray-800 dark:text-white tracking-wider">
                        {user?.inviteCode || '-'}
                    </span>
                    {user?.inviteCode && (
                        <button
                            onClick={handleCopyInviteCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-white text-xs font-bold rounded-lg hover:bg-amber-500 transition-colors"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            복사
                        </button>
                    )}
                </div>
                <p className="text-[11px] text-amber-500 dark:text-amber-400/70 mt-2">
                    이 코드를 가족에게 공유하면 내 아이를 함께 관리할 수 있어요
                </p>
            </div>

            {/* 내 아이별 가족 구성원 */}
            {familyLoading ? (
                <div className="text-center py-6 text-gray-400 text-sm">불러오는 중...</div>
            ) : (
                children.filter(c => c.isOwner !== false).map((child) => (
                    <div key={child.id} className="space-y-2">
                        <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold">
                                {child.name.charAt(0)}
                            </span>
                            {child.name}의 가족
                        </h4>

                        <div className="space-y-1.5">
                            {(familyMembers[child.id] || []).filter(m => !m.isMe).length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">아직 추가된 가족이 없습니다</p>
                            )}
                            {(familyMembers[child.id] || []).filter(m => !m.isMe).map((member) => (
                                <div key={member.memberId} className={`p-3 rounded-xl border ${!member.isApproved ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 shrink-0">
                                                {member.memberName?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-sm text-gray-700 dark:text-white truncate block">
                                                    {member.memberName}
                                                </span>
                                                {!member.isApproved && (
                                                    <span className="text-[11px] text-amber-500 font-bold">승인 대기중</span>
                                                )}
                                            </div>
                                        </div>
                                        {!member.isApproved ? (
                                            child.isOwner ? (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleApproveFamily(child.id, member.memberId, member.memberName)}
                                                        className="px-3 py-1.5 bg-amber-400 text-white text-xs font-bold rounded-lg hover:bg-amber-500 transition-colors"
                                                    >
                                                        승인
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectFamily(child.id, member.memberId, member.memberName)}
                                                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        거절
                                                    </button>
                                                </div>
                                            ) : null
                                        ) : (
                                            <button
                                                onClick={() => handleRemoveFamily(child.id, member.memberId, member.memberName)}
                                                className="p-1.5 text-gray-300 dark:text-gray-500 hover:text-red-500 transition-colors shrink-0"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    {/* 승인된 멤버만 관계명 수정 가능 */}
                                    {member.isApproved && (
                                        <>
                                            {editingRelation && editingRelation.childId === child.id && editingRelation.memberId === member.memberId ? (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input
                                                        type="text"
                                                        value={editingRelation.relation}
                                                        placeholder="아이와의 관계를 입력해주세요."
                                                        onChange={(e) => setEditingRelation({ ...editingRelation, relation: e.target.value })}
                                                        className="flex-1 bg-white dark:bg-gray-600 dark:text-white text-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRelation();
                                                            if (e.key === 'Escape') setEditingRelation(null);
                                                        }}
                                                    />
                                                    <button onClick={handleSaveRelation} className="text-sm text-amber-500 font-bold px-2 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">저장</button>
                                                    <button onClick={() => setEditingRelation(null)} className="text-sm text-gray-400 font-bold px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">취소</button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="mt-2 cursor-pointer group"
                                                    onClick={() => setEditingRelation({ childId: child.id, memberId: member.memberId, relation: member.relation || '' })}
                                                >
                                                    {member.relation ? (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-amber-500 transition-colors flex items-center gap-1">
                                                            {member.relation} <Pencil className="w-3 h-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-300 dark:text-gray-500 group-hover:text-amber-500 transition-colors flex items-center gap-1">
                                                            아이와의 관계를 입력해주세요. <Pencil className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 가족 추가 토글 */}
                        {familyChildId === child.id ? (
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    placeholder="공유코드 입력"
                                    value={familyInviteCode}
                                    onChange={(e) => setFamilyInviteCode(e.target.value)}
                                    className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddFamily(child.id);
                                        if (e.key === 'Escape') { setFamilyChildId(null); setFamilyInviteCode(''); }
                                    }}
                                />
                                <button
                                    onClick={() => handleAddFamily(child.id)}
                                    className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shrink-0"
                                >
                                    추가
                                </button>
                                <button
                                    onClick={() => { setFamilyChildId(null); setFamilyInviteCode(''); }}
                                    className="px-3 py-2.5 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors shrink-0"
                                >
                                    취소
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setFamilyChildId(child.id); setFamilyInviteCode(''); }}
                                className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-700 transition-all text-sm"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="font-bold">가족 추가</span>
                            </button>
                        )}
                    </div>
                ))
            )}

            {children.filter(c => c.isOwner !== false).length === 0 && !familyLoading && (
                <div className="text-center py-6 text-gray-400 text-sm">
                    등록된 내 아이가 없습니다.<br/>자녀를 먼저 등록해주세요.
                </div>
            )}

            {/* 공유받은 아이별 가족 구성원 (읽기 전용) */}
            {!familyLoading && children.filter(c => c.isOwner === false).length > 0 && (
                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-3">공유받은 아이</p>
                    {children.filter(c => c.isOwner === false).map((child) => (
                        <div key={child.id} className="space-y-2">
                            <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                                    {child.name.charAt(0)}
                                </span>
                                {child.name}
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{child.ownerName}님</span>
                            </h4>
                            {/*
                            <div className="space-y-1.5">
                                {(familyMembers[child.id] || []).filter(m => !m.isMe).length === 0 && (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">가족 구성원이 없습니다</p>
                                )}
                                {(familyMembers[child.id] || []).filter(m => !m.isMe).map((member) => (
                                    <div key={member.memberId} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 shrink-0">
                                                {member.memberName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-gray-700 dark:text-white block">{member.memberName}</span>
                                                <span className="text-sm text-gray-400 dark:text-gray-500">{member.relation || ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            */}
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-gray-800 dark:bg-gray-600 text-white font-bold rounded-xl mt-2"
            >
                닫기
            </button>
        </div>
    </CommonModal>
    </>
  );
};

export default SettingsPage;