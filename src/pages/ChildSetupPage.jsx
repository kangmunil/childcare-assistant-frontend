import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Baby, Calendar, User } from 'lucide-react';
import useStore from '../store/useStore';

const ChildSetupPage = () => {
  const navigate = useNavigate();
  const { addChild } = useStore(); // 스토어의 자녀 추가 함수
  const [isLoading, setIsLoading] = useState(false);

  const [childData, setChildData] = useState({
    name: '',
    birthDate: '',
    gender: 'male' // 기본값
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!childData.name || !childData.birthDate) {
      alert("아이의 이름과 생일을 입력해주세요!");
      return;
    }

    setIsLoading(true);

    // [시뮬레이션] 1. 백엔드 API (POST /api/children) 호출해야 하는 곳
    // 지금은 스토어에 바로 추가하는 걸로 대체 (데모용)
    await new Promise(resolve => setTimeout(resolve, 800)); // 0.8초 딜레이
    
    // 2. 스토어 상태 업데이트
    addChild({
      name: childData.name,
      birthDate: childData.birthDate,
      gender: childData.gender
    });

    // 3. 설정 끝! 대시보드로 이동
    alert(`${childData.name}의 등록이 완료되었습니다! 환영해요 🎉`);
    navigate('/dashboard');
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm space-y-8">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Baby className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">우리 아이를 소개해주세요</h2>
          <p className="text-gray-500 text-sm">맞춤형 육아 정보를 위해 꼭 필요해요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          
          {/* 이름 입력 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">아이 이름 (태명)</label>
            <div className="relative">
              <input 
                type="text" 
                value={childData.name}
                onChange={(e) => setChildData({...childData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="지우"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* 생일 입력 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">생년월일</label>
            <div className="relative">
              <input 
                type="date" 
                value={childData.birthDate}
                onChange={(e) => setChildData({...childData, birthDate: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* 성별 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">성별</label>
            <div className="flex gap-2">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setChildData({...childData, gender: g})}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                    childData.gender === g 
                      ? 'bg-amber-100 border-amber-400 text-amber-700' 
                      : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {g === 'male' ? '왕자님 👑' : '공주님 🎀'}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChildSetupPage;