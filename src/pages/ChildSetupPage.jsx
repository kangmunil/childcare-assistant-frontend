import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Baby, Calendar, User, Camera } from 'lucide-react';
import useStore from '../store/useStore';

const ChildSetupPage = () => {
  const navigate = useNavigate();
  const { addChild, uploadChildImage } = useStore();
  const [isLoading, setIsLoading] = useState(false);
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
    reader.onload = (ev) => {
      setImageFile(file);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

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

    // 백엔드 API 호출 (POST /api/children)
    const result = await addChild({
      name: childData.name,
      birthDay: childData.birthDate, // API 필드명: birthDay
      gender: childData.gender === 'male' ? 'M' : 'F'
    });

    setIsLoading(false);

    // 결과 확인 후 처리
    if (result.success) {
      if (imageFile && result.childId) {
        await uploadChildImage(result.childId, imageFile);
      }
      alert(`${childData.name}의 등록이 완료되었습니다! 환영해요 🎉`);
      navigate('/dashboard');
    } else {
      alert(`${result.message}`);
    }
  };

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm space-y-8">
        
        <div className="text-center space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-500 cursor-pointer overflow-hidden mx-auto mb-4 transition-colors"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-amber-400">
                <Camera className="w-7 h-7" />
                <span className="text-[10px] mt-0.5 font-medium">사진</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
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