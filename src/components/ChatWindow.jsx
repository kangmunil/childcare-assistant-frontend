import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Minimize2, Bot, Sparkles } from 'lucide-react'; 
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

// =================================================================
// 1. 메인 채팅 창 컴포넌트
// =================================================================
const ChatWindow = () => {
  const { 
    isChatOpen, 
    closeChat, 
    messages, 
    addUserMessage, 
    generateAiResponse, 
    isAiThinking,
    // ▼▼▼ [추가] 자동 질문 처리를 위한 상태 가져오기 ▼▼▼
    chatQuery, 
    setChatQuery
  } = useStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // ▼▼▼ [핵심 로직 추가] 창이 열릴 때 자동 질문이 있으면 바로 전송 ▼▼▼
  useEffect(() => {
    if (isChatOpen && chatQuery) {
        // 1. 시각적 효과: 질문을 입력창에 잠깐 보여줌
        setInput(chatQuery);

        // 2. 0.3초 뒤에 전송 (사용자가 누른 것 같은 느낌 + 렌더링 안정성)
        const timer = setTimeout(async () => {
            addUserMessage(chatQuery);  // 메시지 목록에 추가
            setInput('');               // 입력창 비우기
            setChatQuery('');           // 스토어 질문 초기화 (중복 방지)
            await generateAiResponse(); // AI 답변 요청
        }, 300);

        return () => clearTimeout(timer);
    }
  }, [isChatOpen, chatQuery, addUserMessage, generateAiResponse, setChatQuery]);


  // 수동 전송 핸들러
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addUserMessage(input);
    setInput('');
    await generateAiResponse();
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:items-end md:justify-end md:bottom-24 md:right-8 md:inset-auto pointer-events-none">
      {/* 모바일: 전체 화면 / PC: 팝업 창 */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="pointer-events-auto w-full h-full md:w-[380px] md:h-[600px] bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-stone-100"
      >
        {/* 헤더 */}
        <div className="bg-[#2D2A26] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-amber-300" />
             </div>
             <div>
                <h3 className="text-white font-serif-kr font-bold text-lg leading-none">AI 육아매니저</h3>
                <span className="text-stone-400 text-xs flex items-center gap-1 mt-1">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> 답변 가능 상태
                </span>
             </div>
          </div>
          <button onClick={closeChat} className="text-stone-400 hover:text-white transition-colors p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#F9F8F6] space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#2D2A26] text-white rounded-tr-none' 
                    : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isAiThinking && (
             <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-stone-100 flex gap-1 items-center shadow-sm">
                   <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                   <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
                   <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}/>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 점을 물어보세요..."
              className="w-full bg-stone-100 text-stone-800 placeholder:text-stone-400 pl-4 pr-12 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/20 transition-all font-medium"
            />
            <button 
                type="submit" 
                disabled={!input.trim()}
                className="absolute right-2 p-2 bg-[#2D2A26] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// =================================================================
// 2. 둥둥 떠다니는 버튼 (기존 코드 유지)
// =================================================================
export const FloatingChatButton = () => {
  const { toggleChat, isChatOpen } = useStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (isChatOpen) return null;

  return (
    <div className={`fixed z-40 transition-all duration-300 ease-spring ${
        isMinimized 
            ? 'bottom-[100px] right-4 md:bottom-8 md:right-8' 
            : 'bottom-[90px] right-4 md:bottom-8 md:right-8' 
    }`}>
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="w-10 h-10 bg-white border border-stone-200 shadow-md rounded-full flex items-center justify-center text-stone-400 hover:text-[#2D2A26] hover:border-[#2D2A26] transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.div
            key="full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative group"
          >
            <button
               onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
               className="absolute -top-2 -right-1 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-full p-1 shadow-sm z-10 transition-colors"
               aria-label="버튼 숨기기"
            >
               <Minimize2 className="w-3 h-3" />
            </button>

            <button
              onClick={toggleChat}
              className="w-14 h-14 md:w-16 md:h-16 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-lg shadow-purple-200 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 fill-current" />
            </button>
            
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold text-stone-600 whitespace-nowrap hidden md:block">
               무엇이든 물어보세요!
               <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white transform rotate-45" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;