import React, { useState } from 'react';
// 1. 아이콘 추가 (MessageCircle, X, Send, Bot 추가됨)
import { Milk, Moon, Baby, Utensils, Activity, Plus, Gamepad2, Shirt, MessageCircle, X, Send, Bot } from 'lucide-react';

// -------------------------------------------------------
// 1. 카드 컴포넌트 (디자인 유지)
// -------------------------------------------------------
const TrackerCard = ({ title, subtitle, time, colorBg, colorText, icon: Icon }) => {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between mb-4 hover:scale-[1.02] transition-transform cursor-pointer border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorBg}`}>
          <Icon className={`w-6 h-6 ${colorText}`} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-800 uppercase tracking-wide">{title}</span>
            <span className="text-xs font-medium text-gray-400">{subtitle}</span>
          </div>
          <div className="flex gap-3 text-sm text-gray-500 font-medium mt-0.5">
             <span>{time}</span>
             <span className="text-gray-300">|</span>
             <span>기록하기</span>
          </div>
        </div>
      </div>
      <button className={`w-10 h-10 rounded-full ${colorBg} flex items-center justify-center hover:brightness-95 transition-all shadow-sm`}>
        <Plus className={`w-6 h-6 ${colorText}`} />
      </button>
    </div>
  );
};

// -------------------------------------------------------
// 2. 메인 앱 컴포넌트
// -------------------------------------------------------
function App() {
  // 기존 탭 상태
  const [activeTab, setActiveTab] = useState('newborn');

  // 2. 챗봇용 상태(변수) 추가 (여기 추가되었습니다!)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요! 육아 궁금증을 해결해 드릴게요. 👶' },
    { id: 2, sender: 'user', text: '신생아 수면 시간이 보통 몇 시간이야?' },
    { id: 3, sender: 'bot', text: '신생아(0~3개월)는 하루 평균 14~17시간 정도 잠을 잡니다! 😴' },
  ]);

  // 데이터 목록
  const activities = [
    // --- 신생아용 데이터 ---
    { id: 1, category: 'newborn', title: 'PUMPING', subtitle: '유축', time: '4시간 전', colorBg: 'bg-pink-100', colorText: 'text-pink-500', icon: Milk },
    { id: 2, category: 'newborn', title: 'SLEEP', subtitle: '신생아 수면', time: '2시간 전', colorBg: 'bg-indigo-100', colorText: 'text-indigo-500', icon: Moon },
    { id: 3, category: 'newborn', title: 'FEED', subtitle: '모유/분유', time: '15분 전', colorBg: 'bg-amber-100', colorText: 'text-amber-500', icon: Baby },
    { id: 4, category: 'newborn', title: 'DIAPER', subtitle: '기저귀', time: '1시간 전', colorBg: 'bg-sky-100', colorText: 'text-sky-500', icon: Activity },
    
    // --- 유아기(Toddler)용 데이터 ---
    { id: 5, category: 'toddler', title: 'SOLIDS', subtitle: '이유식', time: '12:00 PM', colorBg: 'bg-orange-100', colorText: 'text-orange-500', icon: Utensils },
    { id: 6, category: 'toddler', title: 'PLAY', subtitle: '놀이시간', time: '방금 전', colorBg: 'bg-green-100', colorText: 'text-green-500', icon: Gamepad2 },
    { id: 7, category: 'toddler', title: 'POTTY', subtitle: '배변훈련', time: '3시간 전', colorBg: 'bg-purple-100', colorText: 'text-purple-500', icon: Shirt },
    { id: 8, category: 'toddler', title: 'NAP', subtitle: '낮잠', time: '1시간 전', colorBg: 'bg-blue-100', colorText: 'text-blue-500', icon: Moon }
  ];

  const filteredActivities = activities.filter(item => item.category === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-6 flex justify-center relative">
      <div className="w-full max-w-md space-y-6 pb-24">
        
        {/* 헤더 */}
        <div className="mt-6 text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-800">Baby Tracker</h1>
          <p className="text-gray-500 text-sm">우리 아이 맞춤 케어 👶</p>
        </div>

        {/* 탭 스위처 */}
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 flex relative">
          <button 
            onClick={() => setActiveTab('newborn')}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeTab === 'newborn' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🍼 신생아 (~12개월)
          </button>
          <button 
            onClick={() => setActiveTab('toddler')}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeTab === 'toddler' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🧸 유아기 (12개월+)
          </button>
        </div>

        {/* 리스트 렌더링 */}
        <div className="space-y-3 animate-fade-in-up">
          {filteredActivities.map((item) => (
            <TrackerCard key={item.id} {...item} />
          ))}
          {filteredActivities.length === 0 && (
            <div className="text-center py-10 text-gray-400">표시할 항목이 없어요 😢</div>
          )}
        </div>

      </div>
      
      {/* 채팅창 (isChatOpen이 true일 때만 보임) */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-[85%] max-w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
          {/* 채팅 헤더 */}
          <div className="bg-gray-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-green-400 p-1.5 rounded-full">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">AI 육아 도우미</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 채팅 내용 (스크롤) */}
          <div className="h-72 overflow-y-auto p-4 bg-gray-50 space-y-3 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-amber-400 text-white rounded-tr-none shadow-sm' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* 입력창 */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input 
              type="text" 
              placeholder="질문을 입력하세요..." 
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
            <button className="bg-amber-400 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-amber-500 shadow-sm transition-colors">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 (항상 떠 있음) */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 z-50 hover:scale-105 ${
          isChatOpen ? 'bg-gray-700 rotate-90' : 'bg-amber-400 hover:bg-amber-500'
        }`}
      >
        {isChatOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
      
    </div>
  );
}

export default App;