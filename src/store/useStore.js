import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // 1. 앱 전역 상태
      // ==========================================
      activePage: 'dashboard',
      isLoggedIn: false, 
      user: null,        
      isDarkMode: false, // 기본은 라이트 모드

      // ==========================================
      // 2. 챗봇 제어 상태
      // ==========================================
      isChatOpen: false,       // 챗봇 열림/닫힘 여부
      chatQuery: '',           // 퀵 버튼 클릭 시 전달할 초기 질문
      isAiThinking: false,     // AI 응답 대기 상태

      // ==========================================
      // 3. 자녀 데이터 (기본 더미 데이터)
      // ==========================================
      children: [
        { id: 1, name: '지우', birthDate: '2025-06-20', gender: 'female', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jiu' },
        { id: 2, name: '서준', birthDate: '2022-01-15', gender: 'male', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jun' },
      ],
      activeChildId: 1,

      trackerData: {
        feeding: '850', // 모유/분유량 (ml)
        pumping: '120', // 유축량 (ml)
        sleep: '12',    // 수면 시간 (hr)
        diaper: '6'     // 기저귀 횟수
      },
      currentStatus: 'play', // play, sleep, feeding, etc.
      
      setCurrentStatus: (status) => set({ currentStatus: status }),
      
      // 다크 모드 토글 (HTML 클래스 제어 포함)
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        
        // 중요: Tailwind CSS 적용을 위해 HTML 태그에 직접 class를 제어함
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // 앱 초기화 시 테마 적용 (새로고침 대응용)
      initTheme: () => {
        const { isDarkMode } = get();
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
      },

      // ==========================================
      // 4. 성장 기록 데이터
      // ==========================================
      growthRecords: [
        { month: 0, height: 50, weight: 3.2 },
        { month: 1, height: 54, weight: 4.5 },
        { month: 2, height: 58, weight: 5.8 },
        { month: 3, height: 61, weight: 6.7 },
      ],

      // ==========================================
      // 5. 캘린더 일정 데이터
      // ==========================================
      events: [
        { id: 1, date: '2025-12-03', title: 'B형 간염 2차 접종', type: 'hospital', time: '14:00', location: '서울 소아과', description: '' },
        { id: 2, date: '2025-12-03', title: '이유식 재료 사기', type: 'todo', time: '16:00', location: '마트', description: '' },
        { id: 3, date: '2025-12-25', title: '크리스마스 파티', type: 'event', time: '18:00', location: '집', description: '' },
      ],

      // ==========================================
      // 6. 알림 데이터
      // ==========================================
      notifications: [
        { id: 1, type: 'schedule', message: '오늘 오후 2시 B형 간염 접종이 있어요 💉', time: '방금 전', isRead: false },
        { id: 2, type: 'info', message: '지우의 키가 상위 10%에 진입했어요! 🚀', time: '1시간 전', isRead: false },
        { id: 3, type: 'alert', message: '수유 텀이 4시간을 지났어요 ⏰', time: '2시간 전', isRead: true },
      ],

      // ==========================================
      // 7. 채팅 메시지 데이터
      // ==========================================
      messages: [
        { id: 1, role: 'ai', text: '안녕하세요! 육아에 대한 궁금한 점이 있으신가요?' }
      ],

      // ==========================================
      // 8. 액션 (기능 함수들)
      // ==========================================
      setActivePage: (page) => set({ activePage: page }),
      setActiveChild: (id) => set({ activeChildId: id }),
      
      // 챗봇 열기/닫기 토글
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      
      // 질문을 가지고 챗봇 열기 (대시보드 퀵버튼용)
      openChatWithQuery: (query) => set({ 
          isChatOpen: true, 
          chatQuery: query 
      }),

      // 질문 초기화 함수 (ChatWindow에서 사용)
      setChatQuery: (query) => set({ chatQuery: query }),

      // 챗봇 닫기 (닫을 때 쿼리 초기화)
      closeChat: () => set({ 
          isChatOpen: false, 
          chatQuery: '' 
      }),

      // 자녀 추가
      addChild: (newChild) => set((state) => {
        const id = state.children.length + 1; 
        const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newChild.name}`; 
        return {
          children: [...state.children, { ...newChild, id, photo }],
          activeChildId: id, 
        };
      }),

      // 성장 기록 추가
      addGrowthRecord: (newRecord) => set((state) => ({
        growthRecords: [...state.growthRecords, newRecord].sort((a, b) => a.month - b.month)
      })),

      // 일정 추가
      addEvent: (newEvent) => set((state) => ({
        events: [...state.events, newEvent]
      })),
      
      // 알림 관련
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),

      // 기타 기능
      logout: () => {
        set({ isLoggedIn: false, user: null, activePage: 'dashboard' });
        // 로그아웃 시 다크 모드 해제 여부는 선택사항 (여기선 유지함)
      },
      
      // 채팅 메시지 추가 (User)
      addUserMessage: (text) => set((state) => ({ 
          messages: [...state.messages, { id: Date.now(), role: 'user', text }] 
      })),
      
      // AI 응답 시뮬레이션 로직 (키워드 답변)
      generateAiResponse: async () => { 
          set({ isAiThinking: true });
          
          // 1.5초 생각하는 척 (로딩 애니메이션용)
          await new Promise(r => setTimeout(r, 1500));
          
          // 사용자의 마지막 질문 가져오기
          const messages = get().messages;
          const lastUserMsg = messages[messages.length - 1]?.text || "";
          
          let aiText = "제가 답변드릴 수 있는 육아 정보가 아직 부족해요. 더 열심히 공부할게요! 📚";

          // 간단한 키워드 매칭 로직 (데모용)
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
      
      // 트래커 데이터 업데이트
      updateTrackerData: (key, value) => set((state) => ({
        trackerData: {
          ...state.trackerData,
          [key]: value
        }
      })),
    }),
    {
      name: 'bebehelper-storage', // LocalStorage Key Name
    }
  )
);

export default useStore;