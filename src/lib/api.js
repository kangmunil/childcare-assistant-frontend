import { supabase } from '../api/supabase';
import useStore from '../store/useStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEV_BYPASS_TOKEN = typeof import.meta.env.VITE_DEV_BYPASS_TOKEN === 'string'
  ? import.meta.env.VITE_DEV_BYPASS_TOKEN.trim()
  : '';

/**
 * Supabase 토큰을 자동으로 첨부하는 API 클라이언트
 */
const api = {
  /**
   * API 요청 공통 함수
   */
  async request(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const storeToken = useStore.getState().token;

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    // FormData는 브라우저가 자동으로 boundary를 포함한 Content-Type을 설정해야 함
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    // 기본은 Supabase 세션 토큰, 없으면 Zustand 토큰으로 fallback
    const accessToken = session?.access_token
      || (typeof storeToken === 'string' && storeToken.trim() ? storeToken.trim() : null)
      || (DEV_BYPASS_TOKEN || null);
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const error = new Error(errorPayload.message || errorPayload.error || `API Error: ${response.status}`);
      error.code = errorPayload.code;
      error.status = response.status;
      error.payload = errorPayload;
      throw error;
    }

    return response.json();
  },

  /**
   * GET 요청
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  /**
   * POST 요청
   */
  post(endpoint, data) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  /**
   * PUT 요청
   */
  put(endpoint, data) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
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
