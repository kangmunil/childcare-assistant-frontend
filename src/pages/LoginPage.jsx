import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';

const LoginPage = () => {
  const { signInWithPassword, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  // 입력값 관리
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // 입력 시 에러 초기화
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

  // 이메일/비밀번호 로그인 (Supabase)
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signInWithPassword(formData.email, formData.password);

      // 로그인 성공 - 자녀 목록 확인 후 리다이렉트
      await useStore.getState().fetchChildren();
      handleLoginNavigation();

    } catch (err) {
      console.error('로그인 에러:', err);
      // Supabase 에러 메시지 변환
      if (err.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 메일함을 확인해주세요.');
      } else {
        setError(err.message || '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 로그인 (Supabase OAuth)
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      await signInWithOAuth('google');
      // OAuth는 리다이렉트되므로 여기서 추가 처리 불필요
    } catch (err) {
      console.error('구글 로그인 에러:', err);
      setError('구글 로그인에 실패했습니다.');
      setIsLoading(false);
    }
  };

  // 카카오 로그인 (Supabase OAuth)
  const handleKakaoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      await signInWithOAuth('kakao');
      // OAuth는 리다이렉트되므로 여기서 추가 처리 불필요
    } catch (err) {
      console.error('카카오 로그인 에러:', err);
      setError('카카오 로그인에 실패했습니다.');
      setIsLoading(false);
    }
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

           {/* 에러 메시지 */}
           {error && (
             <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
               {error}
             </div>
           )}

           {/* 이메일/비밀번호 입력 폼 */}
           <form onSubmit={handleEmailLogin} className="space-y-3">
               <div>
                   <input
                     type="text"
                     name="email"
                     placeholder="이메일"
                     value={formData.email}
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
               {/* 카카오 */}
               <button
                   type="button"
                   onClick={handleKakaoLogin}
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

               {/* 구글 */}
               <button
                   type="button"
                   onClick={handleGoogleLogin}
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
