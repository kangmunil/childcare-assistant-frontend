import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../api/supabase'; // [필수] Supabase 클라이언트
import http from '../api/http'; // [필수] 백엔드 API 통신용 Axios
import { buildClientFallbackMeta, normalizeDomainList, sanitizeChatMeta } from '../utils/chatMeta';

const CHAT_META_UI_ENABLED = String(import.meta.env.VITE_AI_CHAT_META_UI_ENABLED ?? 'false').toLowerCase() === 'true';
const CHAT_FEEDBACK_ENABLED = String(import.meta.env.VITE_AI_CHAT_FEEDBACK_ENABLED ?? 'false').toLowerCase() === 'true';

const createInitialChatMessages = () => ([
  { id: 1, role: 'ai', text: '안녕하세요! 육아에 대한 궁금한 점이 있으신가요?' }
]);

const resolveIntentFromText = (text) => {
  const normalized = (text || '').replace(/\s/g, '');
  if (!normalized) {
    return {
      intentHint: null,
      requestedProfileDomains: [],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('성장발달')) {
    return {
      intentHint: 'GROWTH_CHECK',
      requestedProfileDomains: ['growth'],
      requiresSelectedChild: true
    };
  }

  if (normalized.includes('백분위') || normalized.includes('성장곡선')) {
    return {
      intentHint: 'GROWTH_CHECK',
      requestedProfileDomains: ['growth'],
      requiresSelectedChild: true
    };
  }

  if (normalized.includes('수면') || normalized.includes('낮잠') || normalized.includes('취침') || normalized.includes('기상')) {
    return {
      intentHint: 'SLEEP',
      requestedProfileDomains: ['sleep', 'routine'],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('이유식') || normalized.includes('수유') || normalized.includes('식습관') || normalized.includes('식단') || normalized.includes('분유') || normalized.includes('먹') || normalized.includes('기입')) {
    return {
      intentHint: 'FEEDING',
      requestedProfileDomains: ['feeding', 'routine'],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('발달') || normalized.includes('마일스톤') || normalized.includes('성향')) {
    return {
      intentHint: 'DEVELOPMENT',
      requestedProfileDomains: ['development'],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('예방접종') || normalized.includes('백신') || normalized.includes('접종')) {
    return {
      intentHint: 'VACCINATION',
      requestedProfileDomains: ['vaccination', 'medical'],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('루틴') || normalized.includes('일정') || normalized.includes('생활패턴')) {
    return {
      intentHint: 'ROUTINE',
      requestedProfileDomains: ['routine', 'sleep'],
      requiresSelectedChild: false
    };
  }

  if (normalized.includes('열') || normalized.includes('증상') || normalized.includes('병원') || normalized.includes('약') || normalized.includes('알레르기') || normalized.includes('응급')) {
    return {
      intentHint: 'MEDICAL',
      requestedProfileDomains: ['medical', 'allergy', 'safety'],
      requiresSelectedChild: true
    };
  }

  return {
    intentHint: 'AUTO',
    requestedProfileDomains: [],
    requiresSelectedChild: false
  };
};

const useStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 1. 앱 전역 상태 (로그인 및 사용자 정보)
      // ==========================================
      activePage: 'dashboard',
      isLoggedIn: false, 
      user: null,        
      token: null, 
      isDarkMode: false, 

      // ==========================================
      // 2. 챗봇 제어 상태
      // ==========================================
      isChatOpen: false,       
      chatQuery: '',       
      chatIntentHint: null,
      chatRequestedProfileDomains: [],
      isAiThinking: false,
      isAiRequestInFlight: false,
      aiChatMetaUiEnabled: CHAT_META_UI_ENABLED,
      aiChatFeedbackEnabled: CHAT_FEEDBACK_ENABLED,
      aiContextMode: 'AUTO',
      manualProfileContext: '',
      aiSessionId: null,
      
      // ==========================================
      // 3. 자녀 데이터 (API 연동을 위해 초기값 비워둠)
      // ==========================================
      children: [], // 초기값 빈 배열
      childrenLoaded: false, // 자녀 목록 API 호출 완료 여부
      activeChildId: null,

      // 동적 일지 항목
      diaryItems: [],
      diaryItemsLoaded: false,
      summaryValues: {},
      checklistUnchecked: [],
      checklistChecked: [],
      checklistLoaded: false,

      currentStatus: 'play',
      
      setCurrentStatus: (status) => set({ currentStatus: status }),
      
      // 다크 모드 토글
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },

      // 테마 초기화 (앱 시작 시 호출)
      initTheme: () => {
        const { isDarkMode } = get();
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },

      // ==========================================
      // 4~7. 데이터 영역 (UI 표시용 더미 데이터)
      // ==========================================
      growthRecords: [],
      growthRecordsLoaded: false,

      events: [],

      notifications: [
        { id: 1, type: 'schedule', message: '오늘 오후 2시 B형 간염 접종이 있어요 💉', time: '방금 전', isRead: false },
        { id: 2, type: 'info', message: '지우의 키가 상위 10%에 진입했어요! 🚀', time: '1시간 전', isRead: false },
        { id: 3, type: 'alert', message: '수유 텀이 4시간을 지났어요 ⏰', time: '2시간 전', isRead: true },
      ],

      messages: createInitialChatMessages(),

      // ==========================================
      // 8. 액션 (API 연동 함수들)
      // ==========================================
      
      // 내 정보 조회 (GET /api/members/me)
      fetchUserInfo: async () => {
        try {
          console.log("🔄 내 정보 업데이트 시도...");
          const response = await http.get('/members/me');
          
          const { status, data: userData } = response.data;

          if (status === 'success' || userData) {
            set({ 
              user: userData, 
              isLoggedIn: true 
            });
            console.log("✅ 내 정보 갱신 완료:", userData.name || userData.email);
            
            // 로그인 성공 시 자녀 목록도 같이 가져오기
            get().fetchChildren();
          }
        } catch (error) {
          console.error("❌ 내 정보 조회 실패:", error);
        }
      },

      // 내 정보 수정 (PUT /api/members/me)
      updateUserInfo: async (formData) => {
        try {
          const response = await http.put('/members/me', formData);
          const { status, data, message } = response.data;

          if (status === 'success') {
            set({ user: data }); // 화면 즉시 갱신
            return { success: true, message: '정보가 수정되었습니다.' };
          } 
          return { success: false, message: message || '수정 실패' };
        } catch (error) {
          const serverMsg = error.response?.data?.message || '수정 중 오류가 발생했습니다.';
          return { success: false, message: serverMsg };
        }
      },

      // 회원 탈퇴 (DELETE /api/members/me)
      withdrawMember: async () => {
        try {
          const response = await http.delete('/members/me');
          const { status, message } = response.data;

          if (status === 'success') {
            get().logout(); // 탈퇴 성공 시 로그아웃
            return { success: true, message: '탈퇴 처리되었습니다.' };
          }
          return { success: false, message: message };
        } catch (error) {
          // 예: 자녀가 있어서 탈퇴 불가 (MEMBER_001)
          const serverMsg = error.response?.data?.message || '탈퇴 처리에 실패했습니다.';
          return { success: false, message: serverMsg };
        }
      },

      // ==========================================
      // [3-1] 대시보드 데이터 API 연동
      // ==========================================

      // 일지 항목 마스터 조회
      fetchDiaryItems: async (childBirthDay) => {
        try {
          // 자녀 나이로 division 결정 (12개월 미만: newborn, 이상: infant)
          const birth = new Date(childBirthDay);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
          const division = monthsDiff < 12 ? 'newborn' : 'infant';

          const response = await http.get('/diary-items', {
            params: { division },
          });
          const { status, data, message } = response.data;

          if (status === 'success') {
            set({ diaryItems: data || [], diaryItemsLoaded: true });
            return { success: true };
          } else {
            console.error('일지 항목 조회 실패:', message);
            set({ diaryItemsLoaded: true });
            return { success: false };
          }
        } catch (error) {
          console.error('일지 항목 조회 실패:', error);
          set({ diaryItemsLoaded: true });
          return { success: false };
        }
      },

      // 일지 요약 조회
      fetchSummary: async (childId, date) => {
        try {
          const response = await http.get(`/children/${childId}/diaries/summary`, {
            params: { date },
          });
          const { status, data, message } = response.data;

          if (status === 'success') {
            const items = data?.items || [];
            const newValues = {};
            items.forEach((item) => {
              newValues[item.itemId] = {
                totalAmount: item.totalAmount ?? 0,
                count: item.count ?? 0,
              };
            });
            set({ summaryValues: newValues });
            return { success: true };
          } else {
            alert(message || '알 수 없는 오류가 발생했습니다.');
            return { success: false };
          }
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          console.error('일지 요약 조회 실패:', msg);
          alert(msg);
          return { success: false };
        }
      },

      // 캘린더 일정 단건 조회 (GET /api/children/{childId}/calendars/{calendarId})
      fetchCalendar: async (childId, calendarId) => {
        try {
          const response = await http.get(`/children/${childId}/calendars/${calendarId}`);
          const { status, data } = response.data;
          if (status === 'success' && data) {
            return {
              success: true,
              data: {
                id: data.id,
                date: data.caDate,
                time: data.caTime || '00:00',
                title: data.title || '',
                type: data.div || 'todo',
                location: data.place || '',
                address1: data.placeAddress1 || '',
                address2: data.placeAddress2 || '',
                postcode: data.placePostcode || '',
                description: data.memo || '',
              },
            };
          }
          return { success: false };
        } catch (error) {
          console.error('일정 단건 조회 실패:', error);
          return { success: false };
        }
      },

      // 캘린더 일정 조회 (GET /api/children/{childId}/calendars)
      fetchCalendarEvents: async (childId, params = {}) => {
        try {
          const response = await http.get(`/children/${childId}/calendars`, { params });
          const { status, data, message } = response.data;

          if (status === 'success') {
            const mapped = (data || []).map((item) => ({
              id: item.id,
              date: item.caDate,
              time: item.caTime || '00:00',
              title: item.title || '',
              type: item.div || 'todo',
              location: item.place || '',
              description: item.memo || '',
            }));
            set({ events: mapped });
            return { success: true };
          } else {
            alert(message || '알 수 없는 오류가 발생했습니다.');
            return { success: false };
          }
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          console.error('캘린더 조회 실패:', msg);
          alert(msg);
          return { success: false };
        }
      },

      // 일지 목록 조회 (GET /api/children/{childId}/diaries?date=YYYY-MM-DD)
      fetchDiaryLogs: async (childId, date) => {
        try {
          const response = await http.get(`/children/${childId}/diaries`, {
            params: { date },
          });
          const { status, data } = response.data;
          if (status === 'success') {
            return data || [];
          }
          return [];
        } catch (error) {
          console.error('일지 목록 조회 실패:', error);
          return [];
        }
      },

      // 일지 기록 저장 (POST /api/children/{childId}/diaries)
      createDiary: async (childId, logs, itemId) => {
        try {
          if (!itemId) {
            alert('항목 정보를 찾을 수 없습니다. 페이지를 새로고침 해주세요.');
            return { success: false };
          }

          for (const log of logs) {
            const payload = {
              itemId,
              diDate: log.diDate,
              diTime: log.diTime,
              amount: String(log.amount),
            };
            const response = await http.post(`/children/${childId}/diaries`, payload);
            const { status, message } = response.data;
            if (status !== 'success') {
              alert(message || '알 수 없는 오류가 발생했습니다.');
              return { success: false };
            }
          }

          // 저장 완료 후 요약 데이터 갱신
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          await get().fetchSummary(childId, dateStr);

          return { success: true };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          console.error('일지 저장 실패:', msg);
          alert(msg);
          return { success: false };
        }
      },

      // 일지 삭제 (DELETE /api/children/{childId}/diaries/{diaryId})
      deleteDiary: async (childId, diaryId) => {
        try {
          const response = await http.delete(`/children/${childId}/diaries/${diaryId}`);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '일지 삭제에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '일지 삭제 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 메모 조회 (GET /api/children/{childId}/diaries/memo?date=YYYY-MM-DD)
      fetchDiaryMemo: async (childId, date) => {
        try {
          const response = await http.get(`/children/${childId}/diaries/memo`, {
            params: { date },
          });
          const { status, data } = response.data;
          if (status === 'success') {
            return { success: true, data: data || null };
          }
          return { success: false, data: null };
        } catch (error) {
          console.error('메모 조회 실패:', error);
          return { success: false, data: null };
        }
      },

      // 메모 생성 (POST /api/children/{childId}/diaries/memo)
      createDiaryMemo: async (childId, date, content) => {
        try {
          const response = await http.post(`/children/${childId}/diaries/memo`, {
            date,
            memo: content,
          });
          const { status, data, message } = response.data;
          if (status === 'success') {
            return { success: true, data };
          }
          alert(message || '메모 저장에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '메모 저장 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 메모 수정 (PUT /api/children/{childId}/diaries/memo/{memoId})
      updateDiaryMemo: async (childId, memoId, content) => {
        try {
          const response = await http.put(`/children/${childId}/diaries/memo/${memoId}`, {
            memo: content,
          });
          const { status, data, message } = response.data;
          if (status === 'success') {
            return { success: true, data };
          }
          alert(message || '메모 수정에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '메모 수정 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 메모 삭제 (DELETE /api/children/{childId}/diaries/memo/{memoId})
      deleteDiaryMemo: async (childId, memoId) => {
        try {
          const response = await http.delete(`/children/${childId}/diaries/memo/${memoId}`);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '메모 삭제에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '메모 삭제 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // ==========================================
      // [4] 자녀 관리 API 연동 (명세서 반영)
      // ==========================================

      // 4-1. 자녀 목록 조회 (GET /api/children)
      fetchChildren: async () => {
        try {
          const response = await http.get('/children');
          const { status, data } = response.data;
          
          if (status === 'success') {
            // 데이터가 배열인지 확인 (방어 코드)
            const childList = Array.isArray(data) ? data : (data ? [data] : []);

            set((state) => {
              const activeChildExists = childList.some((child) => String(child.id) === String(state.activeChildId));
              const primaryChildId = childList.find((child) => child?.isPrimary === true)?.id ?? null;
              const nextActiveChildId = activeChildExists
                  ? state.activeChildId
                  : (primaryChildId ?? (childList.length > 0 ? childList[0]?.id : null));
              const isChildContextChanged = state.activeChildId !== nextActiveChildId;

              return {
                children: childList,
                childrenLoaded: true,
                // 활성화된 자녀가 없거나 목록에서 사라진 경우 대표 자녀(isPrimary) → 첫 번째 자녀 순으로 선택
                activeChildId: nextActiveChildId,
                aiSessionId: isChildContextChanged ? null : state.aiSessionId,
                messages: isChildContextChanged ? createInitialChatMessages() : state.messages,
                aiContextMode: isChildContextChanged ? 'AUTO' : state.aiContextMode,
                manualProfileContext: isChildContextChanged ? '' : state.manualProfileContext,
                chatQuery: isChildContextChanged ? '' : state.chatQuery,
                isAiThinking: isChildContextChanged ? false : state.isAiThinking,
                isAiRequestInFlight: isChildContextChanged ? false : state.isAiRequestInFlight,
              };
            });
            console.log("✅ 자녀 목록 갱신:", childList.length, "명");
          }
        } catch (error) {
          set({ childrenLoaded: true });
          console.error("❌ 자녀 목록 조회 실패:", error);
        }
      },

      // 4-2. 자녀 등록 (POST /api/children)
      addChild: async (childData) => {
        // childData: { name, birthDay, gender ... }
        try {
            const payload = {
                name: childData.name,
                birthDay: childData.birthDay, // YYYY-MM-DD
                birthTime: childData.birthTime || "00:00:00", // 필수값 기본 처리
                gender: childData.gender || "M", // 필수값 기본 처리
                height: childData.height || 0,
                weight: childData.weight || 0,
                memo: childData.memo || ""
            };

            const response = await http.post('/children', payload);
            const { status, message } = response.data;

            if (status === 'success') {
                const existingIds = new Set(get().children.map((c) => c.id));
                await get().fetchChildren(); // 목록 새로고침
                const newChild = get().children.find((c) => !existingIds.has(c.id));
                return { success: true, childId: newChild?.id, message: '자녀가 등록되었습니다.' };
            }
            return { success: false, message: message || '등록 실패' };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || '등록 중 오류 발생' };
        }
      },

      // 4-3. 자녀 정보 수정 (PUT /api/children/{childId})
      updateChild: async (childId, updateData) => {
        try {
            const response = await http.put(`/children/${childId}`, updateData);
            if (response.data.status === 'success') {
                await get().fetchChildren();
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message };
        }
      },

      // 4-4. 자녀 삭제 (DELETE /api/children/{childId})
      deleteChild: async (childId) => {
        try {
            const response = await http.delete(`/children/${childId}`);
            const { status, message } = response.data;

            if (status === 'success') {
                await get().fetchChildren(); // 목록 새로고침
                return { success: true, message: '삭제되었습니다.' };
            }
            return { success: false, message: message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || '삭제 실패' };
        }
      },

      // 소셜 로그인 (테스트 모드 포함)
      socialLogin: async (provider) => {
        // [옵션 A] 진짜 Supabase 코드 (키 받으면 주석 풀고 사용!)
        /*
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: { redirectTo: window.location.origin },
          });
          if (error) throw error;
        } catch (error) {
          console.error("로그인 에러:", error.message);
        }
        */

        // [옵션 B] 가짜 로그인 코드 (키 없을 때 임시 사용)
        console.log(`🚧 [TEST MODE] ${provider} 가짜 로그인 시도 중...`);
        await new Promise(r => setTimeout(r, 1000));
        
        const mockUser = {
          id: 'test-user-1',
          email: 'test@bebehelper.com',
          name: provider === 'kakao' ? '김카카오' : '박구글', 
          user_metadata: {
            full_name: provider === 'kakao' ? '김카카오' : '박구글',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
          }
        };

        set({ isLoggedIn: true, user: mockUser, token: 'fake-jwt-token-12345' });
        console.log("✅ 가짜 로그인 성공!");
        
        // 로그인 성공 후 정보 갱신 시도
        get().fetchUserInfo(); 
        get().fetchChildren();
      },

      // 로그아웃
      logout: async () => {
        try { await supabase.auth.signOut(); } catch { /* 무시 */ }
        set({ isLoggedIn: false, user: null, token: null, children: [], activePage: 'dashboard' });
        localStorage.removeItem('sb-xxxx-auth-token'); 
      },

      // 세션 체크 (앱 시작 시)
      checkSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ 
              user: session.user, 
              token: session.access_token,
              isLoggedIn: true 
            });
            console.log("세션 복구 완료:", session.user.email);
            
            // 데이터 갱신
            get().fetchUserInfo();
            get().fetchChildren();
          }
        } catch {
           console.log("세션 체크 건너뜀 (테스트 모드)");
        }
      },

      // ==========================================
      // UI 및 기타 액션들 (기존 기능 유지)
      // ==========================================
      setActivePage: (page) => set({ activePage: page }),
      setActiveChild: (id) => set((state) => {
        if (state.activeChildId === id) {
          return { activeChildId: id };
        }

        return {
          activeChildId: id,
          aiSessionId: null,
          chatQuery: '',
          isAiThinking: false,
          isAiRequestInFlight: false,
          aiContextMode: 'AUTO',
          manualProfileContext: '',
          messages: createInitialChatMessages(),
        };
      }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      openChatWithQuery: (query, options = {}) => set({
        isChatOpen: true,
        chatQuery: query || '',
        chatIntentHint: options.intentHint || null,
        chatRequestedProfileDomains: normalizeDomainList(options.requestedProfileDomains),
      }),
      setChatQuery: (query) => set({ chatQuery: query }),
      closeChat: () => set({ isChatOpen: false, chatQuery: '' }),
      setAiContextMode: (mode) => set((state) => {
        const nextMode = mode === 'MANUAL' ? 'MANUAL' : 'AUTO';
        return {
          aiContextMode: nextMode,
          manualProfileContext: nextMode === 'MANUAL' ? state.manualProfileContext : '',
        };
      }),
      setManualProfileContext: (text) => set({ manualProfileContext: text }),
      
      // (기존 dummy addChild 제거됨 -> API addChild 사용)

      // addGrowthRecord 제거됨 -> API createGrowthHistory 사용
/*
      addGrowthRecord: (newRecord) => set((state) => ({
        growthRecords: [...state.growthRecords, newRecord].sort((a, b) => a.month - b.month)
      })),
*/
      // 캘린더 일정 생성
      createCalendar: async (childId, data) => {
        try {
          const payload = {
            div: data.type || 'todo',
            title: data.title,
            caDate: data.date,
            caTime: data.time || '00:00',
            place: data.location || '',
            memo: data.description || '',
          };
          const response = await http.post(`/children/${childId}/calendars`, payload);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '일정 저장에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 캘린더 일정 수정
      updateCalendar: async (childId, calendarId, data) => {
        try {
          const payload = {
            div: data.type,
            title: data.title,
            caDate: data.date,
            caTime: data.time,
            place: data.location,
            memo: data.description,
          };
          const response = await http.put(`/children/${childId}/calendars/${calendarId}`, payload);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '일정 수정에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 캘린더 일정 삭제
      deleteCalendar: async (childId, calendarId) => {
        try {
          const response = await http.delete(`/children/${childId}/calendars/${calendarId}`);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '일정 삭제에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      addUserMessage: (text) => set((state) => ({ 
          messages: [...state.messages, { id: Date.now(), role: 'user', text }] 
      })),

      markChatMessageFeedbackStatus: (messageId, feedbackStatus) => set((state) => ({
        messages: state.messages.map((message) => (
          message.id === messageId
            ? { ...message, feedbackStatus }
            : message
        ))
      })),

      submitAiChatFeedback: async (payload) => {
        if (!CHAT_FEEDBACK_ENABLED) {
          return { success: false, message: '피드백 기능이 비활성화되어 있습니다.' };
        }

        try {
          const response = await http.post('/ai/chat/feedback', payload, { timeout: 10000 });
          const { status, message } = response.data || {};
          if (status === 'success') {
            return { success: true };
          }
          return { success: false, message: message || '피드백 전송에 실패했습니다.' };
        } catch (error) {
          const msg = error.response?.data?.message || error.message || '피드백 전송 중 오류가 발생했습니다.';
          return { success: false, message: msg };
        }
      },
      
      generateAiResponse: async () => {
        const {
          isAiRequestInFlight,
          messages,
          aiSessionId,
          activeChildId,
          aiContextMode,
          manualProfileContext,
          chatIntentHint,
          chatRequestedProfileDomains
        } = get();
        if (isAiRequestInFlight) {
          return;
        }

        const lastUserMsg = messages[messages.length - 1]?.text?.trim();
        if (!lastUserMsg) {
          return;
        }

        set({
          isAiThinking: true,
          isAiRequestInFlight: true,
        });

        const contextMode = aiContextMode === 'MANUAL' ? 'MANUAL' : 'AUTO';
        const normalizedManualContext = manualProfileContext.trim();
        let nextSessionId = aiSessionId;
        let replyText = 'AI 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.';
        let replyMeta = null;
        let responseRequestId = null;
        const inferredIntent = resolveIntentFromText(lastUserMsg);
        const requestedProfileDomains = normalizeDomainList(
          chatRequestedProfileDomains && chatRequestedProfileDomains.length > 0
            ? chatRequestedProfileDomains
            : inferredIntent.requestedProfileDomains
        );
        const selectedIntent = chatIntentHint || inferredIntent.intentHint;
        const hasIntentHintForServer = selectedIntent && selectedIntent !== 'AUTO' ? selectedIntent : undefined;

        try {
          const requestPayload = {
            message: lastUserMsg,
            session_id: aiSessionId || undefined,
            child_id: activeChildId || undefined,
            context_mode: contextMode,
          };
          if (hasIntentHintForServer) {
            requestPayload.intent_hint = hasIntentHintForServer;
          }
          if (requestedProfileDomains.length > 0) {
            requestPayload.requested_profile_domains = requestedProfileDomains;
          }

          if (contextMode === 'MANUAL') {
            requestPayload.profile_context = normalizedManualContext;
          }

          const response = await http.post(
            '/ai/chat',
            requestPayload,
            { timeout: 45000 }
          );

          const { status, data, message } = response.data;
          responseRequestId = response.headers?.['x-request-id'] || response.headers?.['X-Request-Id'] || null;
          nextSessionId = data?.session_id ?? nextSessionId;
          replyMeta = sanitizeChatMeta(data?.meta);
          replyText = status === 'success' && data?.reply
            ? data.reply
            : message || replyText;
        } catch (error) {
          const errorCode = error.response?.data?.code;
          responseRequestId = error.response?.headers?.['x-request-id'] || error.response?.headers?.['X-Request-Id'] || null;
          let fallbackCode = 'UNKNOWN_ERROR';
          if (error.code === 'ECONNABORTED' || errorCode === 'AI_001_TIMEOUT') {
            replyText = '응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.';
            fallbackCode = 'TIMEOUT';
          } else if (errorCode === 'AI_004_UNAVAILABLE') {
            replyText = 'AI 서버 연결이 불안정합니다. 잠시 후 다시 시도해주세요.';
            fallbackCode = 'UPSTREAM_UNAVAILABLE';
          } else if (errorCode === 'AI_002_UPSTREAM') {
            replyText = 'AI 서비스에서 일시적인 오류가 발생했습니다. 다시 시도해주세요.';
            fallbackCode = 'UPSTREAM_ERROR';
          } else if (errorCode === 'AI_003_BAD_REQUEST') {
            replyText = error.response?.data?.message || '요청 형식이 올바르지 않습니다.';
            fallbackCode = 'VALIDATION_ERROR';
          } else {
            replyText = error.response?.data?.message || 'AI 서버와 통신 중 오류가 발생했습니다.';
          }
          replyMeta = buildClientFallbackMeta({
            lastUserMsg,
            fallbackCode,
            intentHint: selectedIntent || inferredIntent.intentHint || 'AUTO',
            requestedProfileDomains,
          });
        } finally {
          set((state) => ({
            isAiThinking: false,
            isAiRequestInFlight: false,
            manualProfileContext: contextMode === 'MANUAL' ? '' : state.manualProfileContext,
            aiSessionId: nextSessionId ?? state.aiSessionId,
            chatIntentHint: null,
            chatRequestedProfileDomains: [],
            messages: [...state.messages, {
              id: Date.now() + Math.floor(Math.random() * 1000),
              role: 'ai',
              text: replyText,
              meta: replyMeta,
              requestId: responseRequestId || replyMeta?.request_id || null,
              sessionId: nextSessionId ?? state.aiSessionId ?? null,
              feedbackStatus: null,
            }]
          }));
        }
      },
      
      // ==========================================
      // [5] 성장 체크리스트 API 연동
      // ==========================================

      // 미체크 항목 조회
      fetchUncheckedChecklists: async (childId, div) => {
        try {
          const response = await http.get(`/children/${childId}/checklists/unchecked/${div}`);
          const { status, data } = response.data;
          if (status === 'success') {
            return { success: true, data: data || [] };
          }
          return { success: false, data: [] };
        } catch (error) {
          console.error('미체크 체크리스트 조회 실패:', error);
          return { success: false, data: [] };
        }
      },

      // 체크된 항목 조회
      fetchCheckedChecklists: async (childId, div) => {
        try {
          const response = await http.get(`/children/${childId}/checklists/checked/${div}`);
          const { status, data } = response.data;
          if (status === 'success') {
            return { success: true, data: data || [] };
          }
          return { success: false, data: [] };
        } catch (error) {
          console.error('체크 체크리스트 조회 실패:', error);
          return { success: false, data: [] };
        }
      },

      // 모든 division의 체크리스트 한번에 조회
      fetchAllChecklists: async (childId, divisions) => {
        try {
          const fetchChecked = get().fetchCheckedChecklists;
          const fetchUnchecked = get().fetchUncheckedChecklists;

          const results = await Promise.all(
            divisions.flatMap(div => [
              fetchUnchecked(childId, div).then(r => ({ type: 'unchecked', div, ...r })),
              fetchChecked(childId, div).then(r => ({ type: 'checked', div, ...r })),
            ])
          );

          const unchecked = [];
          const checked = [];
          for (const r of results) {
            if (r.success) {
              if (r.type === 'unchecked') unchecked.push(...r.data);
              else checked.push(...r.data);
            }
          }

          set({ checklistUnchecked: unchecked, checklistChecked: checked, checklistLoaded: true });
          return { success: true };
        } catch (error) {
          console.error('체크리스트 전체 조회 실패:', error);
          set({ checklistLoaded: true });
          return { success: false };
        }
      },

      // 체크 추가
      addCheck: async (childId, itemId) => {
        try {
          const response = await http.post(`/children/${childId}/checklists/${itemId}`);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '체크 추가에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || '체크 추가 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // 체크 삭제
      removeCheck: async (childId, itemId) => {
        try {
          const response = await http.delete(`/children/${childId}/checklists/${itemId}`);
          const { status, message } = response.data;
          if (status === 'success') {
            return { success: true };
          }
          alert(message || '체크 해제에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || '체크 해제 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      // ==========================================
      // [6] 성장 이력 API 연동
      // ==========================================

      // 성장 이력 목록 조회 (기간별 통계)
      fetchGrowthHistory: async (childId, periodType = 'day') => {
        try {
          const today = new Date();
          const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };

          let startDate, endDate;

          if (periodType === 'day') {
            // 일별: 금주 월요일 ~ 금주 일요일
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const thisMonday = new Date(today);
            thisMonday.setDate(today.getDate() + diffToMonday);
            const thisSunday = new Date(thisMonday);
            thisSunday.setDate(thisMonday.getDate() + 6);
            startDate = formatDate(thisMonday);
            endDate = formatDate(thisSunday);
          } else if (periodType === 'week') {
            // 주별: 이번달 1일 ~ 이번달 말일
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            startDate = formatDate(firstDay);
            endDate = formatDate(lastDay);
          } else if (periodType === 'month') {
            // 월별: 이번연도 1월 1일 ~ 12월 31일
            startDate = `${today.getFullYear()}-01-01`;
            endDate = `${today.getFullYear()}-12-31`;
          } else if (periodType === 'year') {
            // 연도별: 5년전 1월 1일 ~ 올해 12월 31일
            startDate = `${today.getFullYear() - 5}-01-01`;
            endDate = `${today.getFullYear()}-12-31`;
          }

          const response = await http.get(`/children/${childId}/history/stats`, {
            params: {
              type: periodType,
              startDate,
              endDate,
            },
          });
          const { status, data } = response.data;
          if (status === 'success') {
            const records = (data?.stats || []).map(item => ({
              period: item.period || '',
              height: parseFloat(item.height) || 0,
              weight: parseFloat(item.weight) || 0,
            }));
            set({ growthRecords: records, growthRecordsLoaded: true });
            return { success: true, data };
          }
          set({ growthRecordsLoaded: true });
          return { success: false };
        } catch (error) {
          console.error('성장 이력 조회 실패:', error);
          set({ growthRecordsLoaded: true });
          return { success: false };
        }
      },

      // 성장 이력 등록
      createGrowthHistory: async (childId, data) => {
        try {
          const payload = {
            ghDate: data.date,
            height: String(data.height),
            weight: String(data.weight),
          };
          const response = await http.post(`/children/${childId}/history`, payload);
          const { status, data: resData, message } = response.data;
          if (status === 'success') {
            await get().fetchGrowthHistory(childId);
            const child = get().children.find(c => c.id === childId);
            if (child) {
              await get().updateChild(childId, {
                name: child.name,
                birthDay: child.birthDate || child.birthDay,
                birthTime: child.birthTime || '00:00:00',
                gender: child.gender,
                height: String(data.height),
                weight: String(data.weight),
                memo: child.memo || '',
              });
            }
            return { success: true, data: resData };
          }
          alert(message || '성장 기록 저장에 실패했습니다.');
          return { success: false };
        } catch (error) {
          const msg = error.response?.data?.message || '성장 기록 저장 중 오류가 발생했습니다.';
          alert(msg);
          return { success: false };
        }
      },

      resetDiaryItems: () => set({ diaryItems: [], diaryItemsLoaded: false, summaryValues: {} }),
    }),
    {
      name: 'bebehelper-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        isDarkMode: state.isDarkMode,
        children: state.children,
        activeChildId: state.activeChildId,
        events: state.events,
      }),
    }
  )
);

export default useStore;
