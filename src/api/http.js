import axios from 'axios';
import { supabase } from './supabase';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  timeout: 5000,
});

// 요청 인터셉터: Supabase 세션 토큰을 헤더에 추가
http.interceptors.request.use(async (config) => {
  const isAiChatRequest = typeof config.url === 'string' && config.url.includes('/ai/chat');
  if (isAiChatRequest && (!config.timeout || config.timeout < 45000)) {
    config.timeout = 45000;
  }
  if (isAiChatRequest) {
    config.headers = config.headers || {};
    if (!config.headers['X-Request-Id']) {
      const fallbackId = `req-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      config.headers['X-Request-Id'] =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : fallbackId;
    }
  }

  try {
    // Supabase에서 현재 세션 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('토큰 가져오기 실패:', error);
  }

  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃 처리
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패 시 로그아웃
      console.warn('인증 만료: 로그아웃 처리');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
