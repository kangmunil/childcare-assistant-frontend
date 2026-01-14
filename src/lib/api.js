import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Supabase 토큰을 자동으로 첨부하는 API 클라이언트
 */
const api = {
  /**
   * API 요청 공통 함수
   */
  async request(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 세션이 있으면 Authorization 헤더 추가
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * GET 요청
   */
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  /**
   * POST 요청
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT 요청
   */
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE 요청
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  /**
   * 로그인 후 백엔드에 회원 동기화 (member 자동 생성)
   * JwtAuthenticationFilter가 토큰을 검증하고 member가 없으면 생성함
   */
  async syncMember() {
    try {
      const result = await this.get('/members/me');
      console.log('Member synced with backend:', result);
      return result;
    } catch (error) {
      console.error('Failed to sync member:', error);
      throw error;
    }
  },
};

export default api;