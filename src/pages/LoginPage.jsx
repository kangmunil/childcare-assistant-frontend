import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import { authApi } from '../api/authApi';

const LoginPage = () => {
  const { loginSuccess, socialLogin } = useStore();
  const navigate = useNavigate();
  
  // 입력값 관리
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginNavigation = () => {
    // Zustand 스토어에서 현재 자녀 목록을 바로 꺼내옴
    const currentChildren = useStore.getState().children;

    if (currentChildren && currentChildren.length > 0) {
      navigate('/dashboard'); // 아이 있음 -> 대시보드
    } else {
      navigate('/child-setup'); // 아이 없음 -> 자녀 등록
    }
  };

  // 1. 진짜 로그인 핸들러 (ID/PW - API 호출)
  const handleRealLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.id || !formData.password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 백엔드 API 호출
      const response = await authApi.login({
        id: formData.id,
        password: formData.password
      });

      // 응답 확인
      if (response.status === 'success' && response.data) {
        const { user, accessToken } = response.data;
        
        // 스토어 업데이트
        loginSuccess(user, accessToken);

        handleLoginNavigation();
        
      } else {
        throw new Error(response.message || "로그인 실패");
      }

    } catch (error) {
      console.error("로그인 에러:", error);
      const errorMsg = error.response?.data?.message || "아이디 또는 비밀번호를 확인해주세요.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 구글 로그인 핸들러 (데모용)
  const handleGoogleDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    await socialLogin('google'); // 가짜 로그인 실행

    handleLoginNavigation();
    
    setIsLoading(false);
  };

  // 3. 카카오 로그인 핸들러 (데모용)
  const handleKakaoDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    await socialLogin('kakao'); // 가짜 로그인 실행

    handleLoginNavigation();
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

       {/* 배경 데코레이션 */}
       <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-amber-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>

       {/* 로고 영역 */}
       <div className="z-10 flex flex-col items-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.5rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-orange-200 mb-4 rotate-3">
               B
           </div>
           <h1 className="text-2xl font-black text-gray-800 tracking-tight">BebeHelper</h1>
       </div>

       {/* 로그인 폼 영역 */}
       <div className="w-full max-w-xs z-10 space-y-4">
           
           {/* ID/PW 입력 폼 */}
           <form onSubmit={handleRealLogin} className="space-y-3">
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

               {/* 로그인 버튼 */}
               <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인하기"}
               </button>
           </form>

           {/* 구분선 */}
           <div className="relative py-2">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
               <div className="relative flex justify-center text-xs"><span className="bg-[#FDFCF8] px-2 text-gray-400">또는</span></div>
           </div>

           {/* 소셜 로그인 */}
           <div className="space-y-2">
               {/* 카카오 (데모 활성화!) */}
               <button 
                   type="button"
                   onClick={handleKakaoDemoLogin} 
                   disabled={isLoading} 
                   className="w-full bg-[#FEE500] text-[#3B1E1E] py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-[#FDD835] active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                   {isLoading ? (
                       <Loader2 className="w-4 h-4 animate-spin text-[#3B1E1E]" />
                   ) : (
                       <>
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7.58 3 4 5.79 4 9.24c0 1.96 1.15 3.7 2.97 4.85l-.62 2.28c-.06.22.18.39.37.26l2.67-1.78c.84.1 1.7.16 2.61.16 4.42 0 8-2.79 8-6.24C20 5.79 16.42 3 12 3z"/></svg>
                           카카오 로그인
                       </>
                   )}
               </button>

               {/* 구글 (데모 활성화!) */}
               <button 
                   type="button"
                   onClick={handleGoogleDemoLogin} 
                   disabled={isLoading}
                   className="w-full bg-white text-gray-700 border border-gray-100 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                   {isLoading ? (
                     <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                   ) : (
                     <>
                       <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                       구글 로그인
                     </>
                   )}
               </button>
           </div>

       </div>
       
       <div className="mt-8 text-center">
           <p className="text-[10px] text-gray-400">
               아직 계정이 없으신가요? <span className="underline decoration-gray-300 cursor-pointer hover:text-amber-500 font-bold" onClick={() => navigate('/signup')}>회원가입</span>
           </p>
       </div>
    </div>
  );
};

export default LoginPage;