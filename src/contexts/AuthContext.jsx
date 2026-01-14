import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import useStore from '../store/useStore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zustand 스토어 액션
  const { fetchUserInfo, fetchChildren } = useStore();

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // 스토어 상태 업데이트
        useStore.setState({
          isLoggedIn: true,
          user: session.user,
          token: session.access_token,
        });
        // 백엔드에서 사용자/자녀 정보 가져오기
        fetchUserInfo();
        fetchChildren();
      }
      setLoading(false);
    });

    // 2. 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);

        if (event === 'SIGNED_IN' && session) {
          useStore.setState({
            isLoggedIn: true,
            user: session.user,
            token: session.access_token,
          });
          // 로그인 시 데이터 갱신
          fetchUserInfo();
          fetchChildren();
        }

        if (event === 'SIGNED_OUT') {
          useStore.setState({
            isLoggedIn: false,
            user: null,
            token: null,
            children: [],
            activeChildId: null,
          });
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          useStore.setState({
            token: session.access_token,
          });
          console.log('토큰 자동 갱신됨');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserInfo, fetchChildren]);

  // 소셜 로그인 (카카오/구글)
  const signInWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };

  // 이메일/비밀번호 로그인
  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 이메일/비밀번호 회원가입
  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // user_metadata에 저장됨
      },
    });
    if (error) throw error;
    return data;
  };

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // 비밀번호 재설정 이메일 요청
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // 새 비밀번호 설정
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  // 현재 세션 토큰 가져오기 (API 호출용)
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signInWithOAuth,
    signInWithPassword,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
