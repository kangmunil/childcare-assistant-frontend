import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // ==========================================
      // 1. 앱 전역 상태
      // ==========================================
      activePage: 'dashboard',
      isLoggedIn: false, 
      user: null,        

      // ==========================================
      // 2. 챗봇 제어 상태 (수정됨)
      // ==========================================
      isChatOpen: false,       // 챗봇 열림/닫힘 여부
      initialChatQuery: '',    // 퀵 버튼 클릭 시 전달할 초기 질문
      isAiThinking: false,     // AI 응답 대기 상태

      // ==========================================
      // 3. 자녀 데이터
      // ==========================================
      children: [
        { id: 1, name: '지우', birthDate: '2025-06-20', gender: 'female', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jiu' },
        { id: 2, name: '서준', birthDate: '2022-01-15', gender: 'male', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jun' },
      ],
      activeChildId: 1,

      trackerData: {
        feeding: '850', // 모유/분유량
        pumping: '120', // 유축량
        sleep: '12',    // 수면 시간
        diaper: '6'     // 기저귀 횟수
      },
      currentStatus: 'play',
      setCurrentStatus: (status) => set({ currentStatus: status }),

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
      
      // [수정됨] 챗봇 관련 액션
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      
      // ★ 핵심: 질문을 가지고 챗봇 열기 (퀵 버튼용)
      openChatWithQuery: (query) => set({ 
          isChatOpen: true, 
          initialChatQuery: query 
      }),

      // 챗봇 닫기 (닫을 때 쿼리 초기화)
      closeChat: () => set({ 
          isChatOpen: false, 
          initialChatQuery: '' 
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
      logout: () => set({ isLoggedIn: false, user: null, activePage: 'dashboard' }),
      
      // 채팅 메시지 추가
      addUserMessage: (text) => set((state) => ({ 
          messages: [...state.messages, { id: Date.now(), role: 'user', text }] 
      })),
      
      // AI 응답 시뮬레이션 (나중에 API 연동 시 교체)
      generateAiResponse: async () => { 
          set({ isAiThinking: true });
          await new Promise(r => setTimeout(r, 1000));
          set({ isAiThinking: false });
          // 실제 응답 추가 로직은 ChatWindow 컴포넌트에서 처리하거나 여기서 확장 가능
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
    }
  )
);

export default useStore;