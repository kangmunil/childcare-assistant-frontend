import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/authApi';

const SignupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 입력값 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // 1. 유효성 검사
    if (!formData.name || !formData.id || !formData.password) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. API 호출 (Body로 전송)
      // 백엔드 명세서: POST /api/auth/register
      const response = await authApi.register({
        id: formData.id,
        password: formData.password,
        name: formData.name
      });

      // 3. 성공 처리
      if (response.status === 'success') {
        alert("회원가입이 완료되었습니다! 로그인해주세요.");
        navigate('/login'); // 로그인 페이지로 이동
      } else {
        throw new Error(response.message || "가입 실패");
      }

    } catch (error) {
      console.error("가입 에러:", error);
      const errorMsg = error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 배경 데코레이션 */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-amber-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>

      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 transition-colors z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-xs z-10 space-y-6">
        
        {/* 헤더 */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800">회원가입</h2>
          <p className="text-gray-500 text-sm mt-1">아이와 함께하는 첫걸음</p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <input 
              type="text" 
              name="name"
              placeholder="이름 (실명)" 
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm shadow-sm"
            />
          </div>
          <div>
            <input 
              type="text" 
              name="id"
              placeholder="아이디" 
              value={formData.id}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm shadow-sm"
            />
          </div>
          <div>
            <input 
              type="password" 
              name="password"
              placeholder="비밀번호" 
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm shadow-sm"
            />
          </div>
          <div>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="비밀번호 확인" 
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full bg-white border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 transition-all text-sm shadow-sm ${
                formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-300 focus:ring-red-300' 
                  : 'border-gray-200 focus:ring-amber-400'
              }`}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SignupPage;