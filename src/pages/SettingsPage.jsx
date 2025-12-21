import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Shield, HelpCircle, LogOut, ChevronRight, Moon, Volume2, X, Plus, Trash2 } from 'lucide-react';
import useStore from '../store/useStore'; 

// [1] 재사용 가능한 공통 모달 컴포넌트
const CommonModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 배경 (클릭 시 닫힘) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달 본문 */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  
  // --- 상태 관리 ---
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // 모달 활성화 상태 ('profile' | 'children' | null)
  const [activeModal, setActiveModal] = useState(null); 
  
  // 데이터 상태 (임시)
  const [tempName, setTempName] = useState(user?.name || '김아빠');
  const [childrenList, setChildrenList] = useState([
    { id: 1, name: '첫째', age: 5 }, 
  ]);

  // 자녀 추가 모드 상태
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildInput, setNewChildInput] = useState({ name: '', age: '' });

  // --- 핸들러 함수들 ---
  const handleSaveNewChild = () => {
    if (!newChildInput.name || !newChildInput.age) {
        alert('이름과 나이를 모두 입력해주세요.');
        return;
    }
    setChildrenList([
        ...childrenList, 
        { id: Date.now(), name: newChildInput.name, age: newChildInput.age }
    ]);
    // 초기화 및 모달 닫기
    setNewChildInput({ name: '', age: '' });
    setIsAddingChild(false);
  };

  const handleDeleteChild = (id) => {
    setChildrenList(childrenList.filter(child => child.id !== id));
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
      <h3 className="text-sm font-bold text-gray-400 mb-2 px-2">{title}</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const MenuItem = ({ icon: Icon, label, value, onClick, isToggle, toggleState, onToggle }) => (
    <div 
        onClick={isToggle ? undefined : onClick}
        className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-0 ${!isToggle && 'cursor-pointer hover:bg-gray-50'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <Icon className="w-4 h-4" />
        </div>
        <span className="text-gray-700 font-medium">{label}</span>
      </div>
      
      {isToggle ? (
        <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${toggleState ? 'bg-amber-500' : 'bg-gray-200'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${toggleState ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
            {value && <span className="text-sm text-gray-400">{value}</span>}
            <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      )}
    </div>
  );

  return (
    <>
    <div className="pb-24 pt-6 px-4 h-full overflow-y-auto">
      <h1 className="text-2xl font-black text-gray-800 mb-6">설정</h1>

      <Section title="계정 관리">
        <MenuItem 
            icon={User} 
            label="내 정보 수정" 
            onClick={() => setActiveModal('profile')} 
        />
        <MenuItem 
            icon={Shield} 
            label="자녀 관리" 
            value={`${childrenList.length}명`} 
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
            label="다크 모드" 
            isToggle 
            toggleState={darkMode} 
            onToggle={() => setDarkMode(!darkMode)} 
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
      </Section>
      
      <div className="text-center text-xs text-gray-300 mt-8 mb-4">
        현재 버전 v1.0.0
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
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-400 transition-colors"
                />
            </div>
            <button 
                onClick={() => {
                    // TODO: API 호출 -> user 정보 업데이트
                    alert('저장되었습니다.');
                    setActiveModal(null);
                }}
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
        }} 
        title={isAddingChild ? "새 자녀 등록" : "자녀 관리"}
    >
        {isAddingChild ? (
            /* [B] 입력 모드 */
            <div className="space-y-4 animate-fade-in">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">이름 / 태명</label>
                    <input 
                        type="text" 
                        placeholder="예: 튼튼이"
                        value={newChildInput.name}
                        onChange={(e) => setNewChildInput({...newChildInput, name: e.target.value})}
                        className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-400"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">나이 (만 나이)</label>
                    <input 
                        type="number" 
                        placeholder="숫자만 입력"
                        value={newChildInput.age}
                        onChange={(e) => setNewChildInput({...newChildInput, age: e.target.value})}
                        className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-400"
                    />
                </div>
                
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setIsAddingChild(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSaveNewChild}
                        className="flex-1 py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 shadow-md shadow-amber-200"
                    >
                        저장
                    </button>
                </div>
            </div>
        ) : (
            /* [A] 목록 모드 */
            <div className="space-y-3">
                {childrenList.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        등록된 자녀가 없습니다.<br/>아이를 등록해보세요!
                    </div>
                )}

                {childrenList.map((child) => (
                    <div key={child.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <span className="font-bold text-gray-700 block">{child.name}</span>
                                <span className="text-xs text-gray-400">{child.age}세</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteChild(child.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                <button 
                    onClick={() => setIsAddingChild(true)} 
                    className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all mt-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">자녀 추가하기</span>
                </button>
                
                <button 
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl mt-4"
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