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