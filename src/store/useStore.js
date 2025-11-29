import { create } from 'zustand';

const useStore = create((set) => ({
  // 1. 앱 전역 상태
  activePage: 'dashboard',
  isChatOpen: false,

  // 2. 자녀 데이터 (다중 자녀 지원)
  children: [
    { 
      id: 1, 
      name: '지우', 
      birthDate: '2025-06-20', 
      gender: 'female', 
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jiu' 
    },
    { 
      id: 2, 
      name: '서준', 
      birthDate: '2022-01-15', 
      gender: 'male', 
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jun' 
    },
  ],
  activeChildId: 1, // 현재 보고 있는 아이의 ID

  // 3. 액션 (Actions)
  setActivePage: (page) => set({ activePage: page }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setActiveChild: (id) => set({ activeChildId: id }),

  // 자녀 추가 기능
  addChild: (newChild) => set((state) => {
    const id = state.children.length + 1; 
    // 랜덤 아바타 생성
    const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newChild.name}`; 
    return {
      children: [...state.children, { ...newChild, id, photo }],
      activeChildId: id, 
    };
  }),
}));

export default useStore;