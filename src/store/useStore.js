import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // ==========================================
      // 1. 앱 전역 상태
      // ==========================================
      activePage: 'dashboard',
      isChatOpen: false,
      isLoggedIn: false, 
      user: null,        

      // ==========================================
      // 2. 자녀 데이터
      // ==========================================
      children: [
        { id: 1, name: '지우', birthDate: '2025-06-20', gender: 'female', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jiu' },
        { id: 2, name: '서준', birthDate: '2022-01-15', gender: 'male', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jun' },
      ],
      activeChildId: 1,

      // ==========================================
      // 3. 성장 기록 데이터
      // ==========================================
      growthRecords: [
        { month: 0, height: 50, weight: 3.2 },
        { month: 1, height: 54, weight: 4.5 },
        { month: 2, height: 58, weight: 5.8 },
        { month: 3, height: 61, weight: 6.7 },
      ],

      // ==========================================
      // 4. 캘린더 일정 데이터
      // ==========================================
      events: [
        { id: 1, date: '2025-12-03', title: 'B형 간염 2차 접종', type: 'hospital', time: '14:00', location: '서울 소아과', description: '' },
        { id: 2, date: '2025-12-03', title: '이유식 재료 사기', type: 'todo', time: '16:00', location: '마트', description: '' },
        { id: 3, date: '2025-12-25', title: '크리스마스 파티', type: 'event', time: '18:00', location: '집', description: '' },
      ],

      // ==========================================
      // 5. 알림 데이터
      // ==========================================
      notifications: [
        { id: 1, type: 'schedule', message: '오늘 오후 2시 B형 간염 접종이 있어요 💉', time: '방금 전', isRead: false },
        { id: 2, type: 'info', message: '지우의 키가 상위 10%에 진입했어요! 🚀', time: '1시간 전', isRead: false },
        { id: 3, type: 'alert', message: '수유 텀이 4시간을 지났어요 ⏰', time: '2시간 전', isRead: true },
      ],

      // ==========================================
      // 6. 채팅 데이터
      // ==========================================
      messages: [
        { id: 1, role: 'ai', text: '안녕하세요! 육아에 대한 궁금한 점이 있으신가요?' }
      ],
      isAiThinking: false, 

      // ==========================================
      // 7. 액션 (기능 함수들)
      // ==========================================
      setActivePage: (page) => set({ activePage: page }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      setActiveChild: (id) => set({ activeChildId: id }),
      
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
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        )
      })),

      clearNotifications: () => set({ notifications: [] }),

      // 기타 기능
      logout: () => set({ isLoggedIn: false, user: null, activePage: 'dashboard' }),
      addUserMessage: (text) => set((state) => ({ messages: [...state.messages, { id: Date.now(), role: 'user', text }] })),
      generateAiResponse: async () => { 
          set({ isAiThinking: true });
          await new Promise(r => setTimeout(r, 1000));
          set({ isAiThinking: false });
          // ... (이후 로직은 컴포넌트나 여기서 처리 가능)
      }
    }),
    {
      name: 'bebehelper-storage',
    }
  )
);

export default useStore;