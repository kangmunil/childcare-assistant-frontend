import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성 (인증, 파일 업로드 등)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,        // 토큰 자동 갱신
    persistSession: true,          // 세션 로컬스토리지 저장
    detectSessionInUrl: true,      // OAuth 콜백 URL에서 세션 자동 감지
  }
});