import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // 로딩 아이콘
import useStore from '../store/useStore';

const LoginPage = () => {
  const { socialLogin } = useStore();
  const navigate = useNavigate();
  
  // 로딩 상태 (버튼 중복 클릭 방지용)
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider) => {
    if (isLoading) return; // 이미 로딩 중이면 클릭 무시

    setIsLoading(true); // 1. 로딩 시작 (버튼 비활성화)

    // 2. 스토어의 비동기 로그인 함수 실행 (1초 걸림)
    const success = await socialLogin(provider); 

    if (success) {
        navigate('/dashboard'); // 3. 성공 시 대시보드 이동
    } else {
        alert("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setIsLoading(false); // 실패 시 로딩 끄기
    }
  };

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

       <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-amber-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>

       {/* 로고 영역 */}
       <div className="z-10 flex flex-col items-center mb-16">
           <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center text-white font-black text-6xl shadow-2xl shadow-orange-200 mb-6 rotate-3 hover:rotate-6 transition-transform duration-500 cursor-pointer">
                B
           </div>
           <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">BebeHelper</h1>
           <p className="text-gray-500 font-medium text-sm">우리 아이 성장 기록의 모든 것</p>
       </div>

       {/* 로그인 버튼 영역 */}
       <div className="w-full max-w-xs space-y-3 z-10">
            
            {/* 1. 카카오 로그인 */}
            <button 
                onClick={() => handleLogin('kakao')}
                disabled={isLoading}
                className="w-full bg-[#FEE500] text-[#3B1E1E] py-4 rounded-2xl font-bold shadow-sm hover:bg-[#FDD835] active:scale-95 transition-all flex items-center justify-center gap-2 relative disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#3B1E1E]" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C7.58 3 4 5.79 4 9.24c0 1.96 1.15 3.7 2.97 4.85l-.62 2.28c-.06.22.18.39.37.26l2.67-1.78c.84.1 1.7.16 2.61.16 4.42 0 8-2.79 8-6.24C20 5.79 16.42 3 12 3z"/></svg>
                        <span>카카오로 3초 만에 시작</span>
                    </>
                )}
            </button>

            {/* 2. 구글 로그인 */}
            <button 
                onClick={() => handleLogin('google')}
                disabled={isLoading}
                className="w-full bg-white text-gray-700 border border-gray-100 py-4 rounded-2xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 relative disabled:opacity-70 disabled:cursor-not-allowed"
            >
                 {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span>구글로 계속하기</span>
                    </>
                )}
            </button>
       </div>
       
       <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed">
                로그인 시 <span className="underline decoration-gray-300 cursor-pointer hover:text-gray-600">이용약관</span> 및 <span className="underline decoration-gray-300 cursor-pointer hover:text-gray-600">개인정보 처리방침</span>에<br/> 동의하는 것으로 간주합니다.
            </p>
       </div>
    </div>
  );
};

export default LoginPage;