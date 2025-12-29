import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. Supabase 클라이언트 생성 (로그인, 파일 업로드 셔틀)
export const supabase = createClient(supabaseUrl, supabaseKey);