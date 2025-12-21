import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, Minimize2 } from 'lucide-react';
import useStore from '../store/useStore';

// 1. 채팅창 컴포넌트 (메인)
const ChatWindow = () => {
  // [수정 1] initialChatQuery 추가로 가져오기
  const { isChatOpen, toggleChat, messages, addUserMessage, generateAiResponse, isAiThinking, initialChatQuery } = useStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // 메시지 올 때마다 스크롤 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking]);

  // [수정 2] ★ 핵심 로직: 퀵 버튼으로 열었을 때 자동 질문 전송
  useEffect(() => {
    if (isChatOpen && initialChatQuery) {
        addUserMessage(initialChatQuery); // 질문 등록
        generateAiResponse();             // AI 답변 트리거
        // 참고: Store의 closeChat()이 호출될 때 initialChatQuery가 초기화되므로
        // 여기서는 별도로 초기화하지 않아도, 닫았다가 다시 열지 않는 이상 중복 전송되지 않음
    }
  }, [isChatOpen, initialChatQuery]);

  // 엔터키 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // 1. 유저 메시지 등록
    addUserMessage(inputText);
    setInputText('');
    
    // 2. AI 응답 트리거
    generateAiResponse();
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[90%] max-w-[360px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-indigo-50 flex flex-col overflow-hidden animate-fade-in-up">
      
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm">AI 육아 도우미</h3>
                <p className="text-[10px] text-indigo-100 opacity-80">무엇이든 물어보세요!</p>
            </div>
        </div>
        {/* toggleChat은 store에서 이미 닫을 때 초기화를 수행하도록 되어 있음 */}
        <button onClick={toggleChat} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* 생각 중... 애니메이션 */}
        {isAiThinking && (
           <div className="flex justify-start">
             <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2 items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="궁금한 육아 정보를 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
            />
            <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`p-1.5 rounded-full transition-colors ${
                    inputText.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400'
                }`}
            >
                <Send className="w-4 h-4 ml-0.5" />
            </button>
        </div>
      </div>
    </div>
  );
};

// 2. 둥둥 떠있는 버튼 컴포넌트 (Named Export)
export const FloatingChatButton = () => {
    const { toggleChat, isChatOpen } = useStore();

    if (isChatOpen) return null;

    return (
        <button 
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
        >
            <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                AI 육아상담
            </span>
        </button>
    );
};

export default ChatWindow;