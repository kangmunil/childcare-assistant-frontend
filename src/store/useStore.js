import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../api/supabase'; // [필수] Supabase 클라이언트
import http from '../api/http'; // [필수] 백엔드 API 통신용 Axios

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
      isAiThinking: false,
      aiSessionId: null,
      
      // ==========================================
      // 3. 자녀 데이터 (API 연동을 위해 초기값 비워둠)
      // ==========================================
      children: [], // 초기값 빈 배열
      activeChildId: null,

      trackerData: {
        feeding: '850', 
        pumping: '120', 
        sleep: '12',    
        diaper: '6'     
      },
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
      growthRecords: [
        { month: 0, height: 50, weight: 3.2 },
        { month: 1, height: 54, weight: 4.5 },
        { month: 2, height: 58, weight: 5.8 },
        { month: 3, height: 61, weight: 6.7 },
      ],

      events: [
        { id: 1, date: '2025-12-03', title: 'B형 간염 2차 접종', type: 'hospital', time: '14:00', location: '서울 소아과', description: '' },
        { id: 2, date: '2025-12-03', title: '이유식 재료 사기', type: 'todo', time: '16:00', location: '마트', description: '' },
        { id: 3, date: '2025-12-25', title: '크리스마스 파티', type: 'event', time: '18:00', location: '집', description: '' },
      ],

      notifications: [
        { id: 1, type: 'schedule', message: '오늘 오후 2시 B형 간염 접종이 있어요 💉', time: '방금 전', isRead: false },
        { id: 2, type: 'info', message: '지우의 키가 상위 10%에 진입했어요! 🚀', time: '1시간 전', isRead: false },
        { id: 3, type: 'alert', message: '수유 텀이 4시간을 지났어요 ⏰', time: '2시간 전', isRead: true },
      ],

      messages: [
        { id: 1, role: 'ai', text: '안녕하세요! 육아에 대한 궁금한 점이 있으신가요?' }
      ],

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
            
            set({ 
              children: childList,
              // 활성화된 자녀가 없거나 삭제된 경우 첫 번째 자녀 선택
              activeChildId: childList.length > 0 ? childList[0].id : null
            });
            console.log("✅ 자녀 목록 갱신:", childList.length, "명");
          }
        } catch (error) {
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
                await get().fetchChildren(); // 목록 새로고침
                return { success: true, message: '자녀가 등록되었습니다.' };
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
        try { await supabase.auth.signOut(); } catch (e) { /* 무시 */ }
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
        } catch (error) {
           console.log("세션 체크 건너뜀 (테스트 모드)");
        }
      },

      // ==========================================
      // UI 및 기타 액션들 (기존 기능 유지)
      // ==========================================
      setActivePage: (page) => set({ activePage: page }),
      setActiveChild: (id) => set({ activeChildId: id }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      openChatWithQuery: (query) => set({ isChatOpen: true, chatQuery: query }),
      setChatQuery: (query) => set({ chatQuery: query }),
      closeChat: () => set({ isChatOpen: false, chatQuery: '' }),
      
      // (기존 dummy addChild 제거됨 -> API addChild 사용)

      addGrowthRecord: (newRecord) => set((state) => ({
        growthRecords: [...state.growthRecords, newRecord].sort((a, b) => a.month - b.month)
      })),

      addEvent: (newEvent) => set((state) => ({
        events: [...state.events, newEvent]
      })),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      addUserMessage: (text) => set((state) => ({ 
          messages: [...state.messages, { id: Date.now(), role: 'user', text }] 
      })),
      
      generateAiResponse: async () => { 
          set({ isAiThinking: true });

          const messages = get().messages;
          const lastUserMsg = messages[messages.length - 1]?.text?.trim();

          if (!lastUserMsg) {
            set({ isAiThinking: false });
            return;
          }

          try {
            const { aiSessionId } = get();
            const response = await http.post('/ai/chat', {
              message: lastUserMsg,
              session_id: aiSessionId || undefined,
            });

            const { status, data, message } = response.data;
            const replyText = status === 'success' && data?.reply
              ? data.reply
              : message || 'AI 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.';

            set((state) => ({
              isAiThinking: false,
              aiSessionId: data?.session_id ?? state.aiSessionId,
              messages: [...state.messages, { id: Date.now() + 1, role: 'ai', text: replyText }]
            }));
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'AI 서버와 통신 중 오류가 발생했습니다.';
            set((state) => ({
              isAiThinking: false,
              messages: [...state.messages, { id: Date.now() + 1, role: 'ai', text: errorMessage }]
            }));
          }
      },
      
      updateTrackerData: (key, value) => set((state) => ({
        trackerData: {
          ...state.trackerData,
          [key]: value
        }
      })),
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
        growthRecords: state.growthRecords,
        events: state.events,
      }),
    }
  )
);

export default useStore;