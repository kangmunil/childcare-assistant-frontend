// src/components/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';

// 1. 채팅창 컴포넌트
const ChatWindow = () => {
  const { toggleChat, messages, addUserMessage, generateAiResponse, isAiThinking } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null); // 자동 스크롤용

  // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. 사용자 메시지 보내기
    addUserMessage(input);
    setInput('');

    // 2. AI 답변 생성 요청 (스트리밍)
    await generateAiResponse();
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-8 w-[90%] md:w-[400px] h-[600px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden animate-fade-in-up">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
           <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
           </div>
           <div>
               <h3 className="font-bold text-base">AI 육아 비서</h3>
               <p className="text-[10px] text-white/80 font-medium flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> 온라인
               </p>
           </div>
        </div>
        <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
        {/* 안내 메시지 */}
        <div className="text-center text-xs text-gray-400 my-4 flex items-center justify-c]nter gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>AI가 답변을 생성 중일 수 있어요</span>
        </div>     

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             
             {/* AI 아이콘 (AI 메시지일 때만) */}
             {msg.role === 'ai' && (
                 <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center mr-2 shrink-0 shadow-sm">
                     <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Bebe" alt="AI" className="w-5 h-5" />
                 </div>
             )}

             {/* 말풍선 */}
             <div 
                className={`max-w-[80%] p-3.5 text-sm leading-relaxed shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-sm'
                }`}
             >
                {msg.text}
             </div>
          </div>
        ))}

        {/* 로딩 인디케이터 (생각 중일 때) */}
        {isAiThinking && (
           <div className="flex justify-start">
               <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center mr-2 shrink-0 shadow-sm">
                   <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Bebe" alt="AI" className="w-5 h-5" />
               </div>
               <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
               </div>
           </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 shrink-0">
        <div className="relative flex items-center">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 점을 물어보세요..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all"
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isAiThinking}
                className="absolute right-1.5 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
            <Send className="w-4 h-4" />
            </button>
        </div>
      </form>
    </div>
  );
};

// 2. 둥둥 떠있는 버튼 컴포넌트 (App.jsx에서 씀)
export const FloatingChatButton = () => {
  const { toggleChat, isChatOpen, isLoggedIn } = useStore();

  // 로그인 안 했으면 버튼 숨기기 (선택사항)
  if (!isLoggedIn) return null;

  return (
    <button
      onClick={toggleChat}
      className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 group ${
        isChatOpen 
        ? 'bg-gray-800 text-white rotate-90 scale-0 opacity-0' 
        : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white hover:scale-110 hover:-translate-y-1'
      }`}
    >
      <Bot className="w-7 h-7" />
      {/* 툴팁 */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        AI 육아상담
      </span>
import React, { useState } from 'react';
import { Bot, X, Send, MessageCircle } from 'lucide-react';
// 1. 스토어 import (필수)
import useStore from '../store/useStore';

const ChatWindow = () => {
    // 2. 스토어에서 상태와 함수 가져오기
    const { setIsChatOpen } = useStore();
    
    const [messages] = useState([
        { id: 1, sender: 'bot', text: '안녕하세요! 육아 궁금증을 해결해 드릴게요. 👶' },
        { id: 2, sender: 'user', text: '신생아 수면 시간이 보통 몇 시간이야?' },
        { id: 3, sender: 'bot', text: '신생아(0~3개월)는 하루 평균 14~17시간 정도 잠을 잡니다! 😴' },
    ]);

    return (
        <div className="fixed bottom-24 right-6 w-[85%] max-w-[360px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden z-50 animate-slide-up md:right-12 md:bottom-12">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Bot className="w-5 h-5 text-white" /></div>
                    <div>
                        <span className="text-white font-black text-base block">AI 육아 닥터</span>
                        <span className="text-white/80 text-xs font-medium">24시간 대기중</span>
                    </div>
                </div>
                {/* 닫기 버튼 연결 */}
                <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="h-80 overflow-y-auto p-5 bg-slate-50/50 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.sender === 'user' 
                            ? 'bg-amber-500 text-white rounded-tr-none font-medium' 
                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input type="text" placeholder="궁금한 점을 물어보세요" className="flex-1 bg-gray-50 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all text-gray-700 placeholder-gray-400" />
                <button className="bg-amber-500 w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all hover:scale-105"><Send className="w-5 h-5 ml-0.5" /></button>
            </div>
        </div>
    );
};

export const FloatingChatButton = () => {
  // 3. 파라미터({ isChatOpen... })를 지우고, 스토어에서 직접 가져옵니다.
  const { isChatOpen, toggleChat } = useStore();

  return (
    <button 
      onClick={toggleChat} // 4. 스토어의 toggle 함수 실행
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl shadow-amber-300/50 flex items-center justify-center transition-all duration-300 z-40 hover:scale-110 md:bottom-10 md:right-10 ${isChatOpen ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-tr from-amber-400 to-orange-500'}`}
    >
      {isChatOpen ? (<X className="w-7 h-7 text-white" />) : (<MessageCircle className="w-8 h-8 text-white fill-white/20" />)}
    </button>
  );
};

export default ChatWindow;