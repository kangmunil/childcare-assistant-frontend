import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // 1. 앱 전역 상태
      activePage: 'dashboard',
      isChatOpen: false,

      // 2. 자녀 데이터
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
      activeChildId: 1,

      isLoggedIn: false, 
      user: null,        
      
      // 채팅 관련 상태 변수 (이미 잘 넣었네!)
      messages: [
        { id: 1, role: 'ai', text: '안녕하세요! 육아에 대한 궁금한 점이 있으신가요? 무엇이든 물어보세요! 😊' }
      ],
      isAiThinking: false, 

      // 3. 액션 (Actions)
      setActivePage: (page) => set({ activePage: page }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
      setActiveChild: (id) => set({ activeChildId: id }),

      // 자녀 추가 기능
      addChild: (newChild) => set((state) => {
        const id = state.children.length + 1; 
        const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newChild.name}`; 
        return {
          children: [...state.children, { ...newChild, id, photo }],
          activeChildId: id, 
        };
      }),
      
      // 소셜 로그인 시뮬레이션
      socialLogin: async (provider) => {
          try {
              console.log(`[API 요청] POST /api/auth/${provider}`); 
              await new Promise(resolve => setTimeout(resolve, 1000));
              const fakeResponse = {
                  token: "abc12345",
                  user: {
                      name: "지우맘",
                      email: `test@${provider}.com`
                  }
              };
              set({ isLoggedIn: true, user: fakeResponse.user });
              return true; 
          } catch (error) {
              console.error("로그인 실패:", error);
              return false; 
          }
      },

      logout: () => {
          console.log("[API 요청] 로그아웃");
          set({ 
            isLoggedIn: false, 
            user: null, 
            activePage: 'dashboard' 
          });
      },

      // 1. 사용자 메시지 추가하기
      addUserMessage: (text) => set((state) => ({
        messages: [...state.messages, { id: Date.now(), role: 'user', text }]
      })),

      // 2. AI 답변 생성 (스트리밍 효과 시뮬레이션)
      generateAiResponse: async () => {
        // 1) 생각하는 척 (로딩 시작)
        set({ isAiThinking: true });
        await new Promise(r => setTimeout(r, 1000)); // 1초 대기
        set({ isAiThinking: false }); // 로딩 끝

        // 2) 답변 준비 (나중엔 서버에서 받아올 내용)
        const fullAnswer = "아기가 열이 날 때는 당황하지 마시고 체온을 먼저 확인해주세요. 38도 이상이라면 미온수 마사지를 해주시고, 해열제 교차 복용을 고려해보세요. 증상이 지속되면 꼭 병원을 방문하셔야 합니다.";
        
        // 3) 빈 말풍선 먼저 추가
        const aiMsgId = Date.now();
        set((state) => ({
             messages: [...state.messages, { id: aiMsgId, role: 'ai', text: '' }]
        }));

        // 4) 한 글자씩 타닥타닥 채워넣기 (스트리밍 효과)
        let currentText = '';
        for (let i = 0; i < fullAnswer.length; i++) {
            currentText += fullAnswer[i];
            
            set((state) => ({
                messages: state.messages.map(msg => 
                    msg.id === aiMsgId ? { ...msg, text: currentText } : msg
                )
            }));

            await new Promise(r => setTimeout(r, 30)); // 0.03초 대기 (타자 속도)
        }
      },
    }),
    {
      name: 'bebehelper-storage', // 로컬 스토리지 저장 이름 (새로고침 유지용)
    }
  )
);

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