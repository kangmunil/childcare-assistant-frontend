import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import useStore from '../store/useStore';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { fetchChildren } = useStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase가 URL에서 자동으로 세션을 처리함
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          console.log('OAuth 로그인 성공:', session.user.email);

          // 자녀 목록 확인
          await fetchChildren();
          const children = useStore.getState().children;

          if (children && children.length > 0) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/child-setup', { replace: true });
          }
        } else {
          // 세션이 없으면 로그인 페이지로
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('OAuth 콜백 처리 오류:', err);
        setError(err.message);
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate, fetchChildren]);

  if (error) {
    return (
      <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6">
        <div className="text-red-500 text-center">
          <p className="text-lg font-bold mb-2">로그인 처리 중 오류가 발생했습니다</p>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400 mt-4">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
      <p className="text-gray-600 font-medium">로그인 처리 중...</p>
    </div>
  );
};

export default AuthCallbackPage;
