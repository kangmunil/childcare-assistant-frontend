import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 입력값 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // 입력 시 에러 초기화
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // 1. 유효성 검사
    if (!formData.name || !formData.email || !formData.password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 길이 검사 (Supabase 기본 요구사항)
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Supabase 회원가입
      const metadata = { full_name: formData.name };
      if (formData.inviteCode.trim()) {
        metadata.invite_code = formData.inviteCode.trim();
      }
      const { user } = await signUp(formData.email, formData.password, metadata);

      // 이메일 인증이 필요한 경우 안내 메시지 표시
      if (user && !user.confirmed_at) {
        setSuccess(true);
      } else {
        // 이메일 인증이 비활성화된 경우 바로 로그인 페이지로
        navigate('/login');
      }

    } catch (err) {
      console.error('가입 에러:', err);
      // Supabase 에러 메시지 변환
      if (err.message.includes('User already registered')) {
        setError('이미 가입된 이메일입니다.');
      } else if (err.message.includes('Password should be')) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        setError(err.message || '회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-amber-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-rose-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>

        <div className="w-full max-w-xs z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-800">회원가입 완료!</h2>
            <p className="text-gray-500 text-sm mt-2">
              {formData.email}로 인증 메일을 발송했습니다.<br />
              메일함을 확인해주세요.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-amber-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-500 active:scale-95 transition-all"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

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

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

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
              type="email"
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
              placeholder="비밀번호 (6자 이상)"
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
          {/* //작업 보류
          <div>
            <input
              type="text"
              name="inviteCode"
              placeholder="공유코드 (선택)"
              value={formData.inviteCode}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm shadow-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-2">가족에게 받은 공유코드가 있다면 입력해주세요</p>
          </div>
          */}

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
