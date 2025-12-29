import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // createJSONStorage 추가

const useStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 1. 앱 전역 상태 (로그인 포함)
      // ==========================================
      activePage: 'dashboard',
      isLoggedIn: false, 
      user: null,        
      token: null, // 토큰 상태 추가
      isDarkMode: false, 

      // ==========================================
      // 2. 챗봇 제어 상태
      // ==========================================
      isChatOpen: false,       
      chatQuery: '',           
      isAiThinking: false,     

      // ==========================================
      // 3. 자녀 데이터 (기본 더미 데이터)
      // ==========================================
      children: [
        { id: 1, name: '지우', birthDate: '2025-06-20', gender: 'female', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jiu' },
        { id: 2, name: '서준', birthDate: '2022-01-15', gender: 'male', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jun' },
      ],
      activeChildId: 1,

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

      // 테마 초기화
      initTheme: () => {
        const { isDarkMode } = get();
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },

      // ==========================================
      // 4~7. 데이터 영역 (기존 코드 유지)
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
      // 8. 액션 (기능 함수들)
      // ==========================================
      
      // 👇 [중요] 여기에 소셜 로그인 기능이 추가됨! 👇
      socialLogin: async (provider) => {
        // 1. 가짜 딜레이 (1초)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 2. 가짜 유저 정보 생성
        const mockUser = {
          id: 1,
          name: provider === 'kakao' ? '김카카오' : '구글맘',
          email: 'test@bebehelper.com',
          profileImage: 'https://via.placeholder.com/150' 
        };

        // 3. 상태 업데이트 (로그인 성공!)
        set({ 
          user: mockUser, 
          token: 'dummy-access-token-12345', 
          isLoggedIn: true 
        });

        console.log(`${provider} 로그인 성공 시뮬레이션 완료`);
        return true; // 성공 반환
      },

      // 로그아웃
      logout: () => {
        set({ isLoggedIn: false, user: null, token: null, activePage: 'dashboard' });
      },

      // (기존 기능들 유지)
      setActivePage: (page) => set({ activePage: page }),
      setActiveChild: (id) => set({ activeChildId: id }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      openChatWithQuery: (query) => set({ isChatOpen: true, chatQuery: query }),
      setChatQuery: (query) => set({ chatQuery: query }),
      closeChat: () => set({ isChatOpen: false, chatQuery: '' }),
      
      addChild: (newChild) => set((state) => {
        const id = state.children.length + 1; 
        const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newChild.name}`; 
        return {
          children: [...state.children, { ...newChild, id, photo }],
          activeChildId: id, 
        };
      }),

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
          await new Promise(r => setTimeout(r, 1500));
          
          const messages = get().messages;
          const lastUserMsg = messages[messages.length - 1]?.text || "";
          
          let aiText = "제가 답변드릴 수 있는 육아 정보가 아직 부족해요. 더 열심히 공부할게요! 📚";

          if (lastUserMsg.includes('예방접종')) {
              aiText = "다음 예방접종은 'B형 간염 3차'와 'DTaP 3차'입니다. 6개월 검진과 함께 소아과 예약을 추천드려요!";
          } else if (lastUserMsg.includes('이유식')) {
              aiText = "지금 시기(185일)에는 소고기 미음을 시작하는 게 좋습니다. 철분 보충을 위해 매일 소고기 10g을 섭취하도록 해주세요.";
          } else if (lastUserMsg.includes('발달')) {
              aiText = "이 시기 아이들은 뒤집기를 능숙하게 하고, 배밀이를 시도할 수 있어요. 낯가림이 시작될 수도 있답니다.";
          } else if (lastUserMsg.includes('수면')) {
              aiText = "수면 교육은 '퍼버법'이나 '안눕법'을 시도해 볼 수 있습니다. 일관된 수면 의식을 만들어주는 게 가장 중요해요!";
          }

          set((state) => ({
            isAiThinking: false,
            messages: [...state.messages, { id: Date.now() + 1, role: 'ai', text: aiText }]
          }));
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
      // 저장하고 싶은 상태만 골라서 저장 (보안 및 에러 방지)
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        isDarkMode: state.isDarkMode,
        children: state.children,
        growthRecords: state.growthRecords,
        events: state.events,
        // messages나 UI 상태(isChatOpen 등)는 저장 안 함
      }),
    }
  )
);

export default useStore;