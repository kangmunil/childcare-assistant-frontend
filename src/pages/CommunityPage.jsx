import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // AnimatePresence 추가 (부드러운 전환)
import { useNavigate } from 'react-router-dom';
import { Search, PenLine, MessageSquare, Heart, User } from 'lucide-react';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  // 더미 데이터
  const posts = [
    {
      id: 1,
      category: 'qna',
      author: '서준파파',
      babyAge: 'D+85',
      title: '신생아 태열이 안 가라앉아요 ㅠㅠ',
      content: '수딩젤 발라주고 온습도 조절도 했는데 계속 붉게 올라오네요. 병원 가봐야 할까요?',
      likes: 5,
      comments: 12,
      time: '10분 전',
      image: null
    },
    {
      id: 2,
      category: 'daily',
      author: '지우맘',
      babyAge: 'D+185',
      title: '오늘 이유식 먹방 찍었습니다 ㅋㅋ',
      content: '소고기 미음 처음 줬는데 없어서 못 먹네요. 입에 묻은 거 너무 귀여워요.',
      likes: 42,
      comments: 8,
      time: '1시간 전',
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop'
    },
    // 테스트용 데이터 하나 더 추가 (꿀팁)
    {
      id: 3,
      category: 'tip',
      author: '둥이맘',
      babyAge: 'D+200',
      title: '국민 장난감 튤립 사운드북 핫딜 떴어요!',
      content: '지금 쿠*에서 30% 할인 중이네요. 필요하신 분들 달리세요!',
      likes: 150,
      comments: 45,
      time: '3시간 전',
      image: null
    }
  ];
  
  // 탭이 'all'이면 전체를, 아니면 카테고리가 일치하는 것만 남김
  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(post => post.category === activeTab);

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative">
      
      {/* 1. 헤더 & 검색 */}
      <div className="sticky top-0 bg-[#F9F8F6]/95 backdrop-blur-sm z-20 px-6 py-4 border-b border-stone-200">
        <div className="flex justify-between items-end mb-4">
            <h1 className="text-3xl font-serif-kr font-bold text-stone-900">Community</h1>
            <p className="text-xs text-stone-400 font-medium mb-1">육아 동지들과 함께해요</p>
        </div>

        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
                type="text" 
                placeholder="궁금한 내용을 검색해보세요 (예: 태열, 이유식)" 
                className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
            {['all', 'qna', 'daily', 'tip'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        activeTab === tab 
                        ? 'bg-stone-800 text-white' 
                        : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100'
                    }`}
                >
                    {tab === 'all' ? '전체' : tab === 'qna' ? '질문&답변' : tab === 'daily' ? '육아일상' : '꿀팁공유'}
                </button>
            ))}
        </div>
      </div>

      {/* 2. 게시글 리스트 */}
      <div className="p-4 space-y-4">
        {/* posts 대신 filteredPosts를 맵핑*/}
        {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
                <motion.div 
                    key={post.id}
                    layout // 리스트 변경 시 부드럽게 움직임
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/community/${post.id}`)}                    
                    className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] active:bg-stone-50"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                                <User className="w-4 h-4 text-stone-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-stone-800">{post.author}</span>
                                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">{post.babyAge}</span>
                                </div>
                                <span className="text-xs text-stone-400">{post.time}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            post.category === 'qna' ? 'bg-rose-50 text-rose-500' : 
                            post.category === 'daily' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                        }`}>
                            {post.category === 'qna' ? 'Q&A' : post.category === 'daily' ? '일상' : '꿀팁'}
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-stone-800 mb-1 line-clamp-1">{post.title}</h3>
                            <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{post.content}</p>
                        </div>
                        {post.image && (
                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                                <img src={post.image} alt="thumbnail" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 border-t border-stone-50 pt-3">
                        <div className="flex items-center gap-1 text-stone-400 text-xs font-medium">
                            <Heart className="w-4 h-4" /> {post.likes}
                        </div>
                        <div className="flex items-center gap-1 text-stone-400 text-xs font-medium">
                            <MessageSquare className="w-4 h-4" /> {post.comments}
                        </div>
                    </div>
                </motion.div>
            ))
        ) : (
            // 게시글이 없을 때 보여줄 화면
            <div className="py-20 text-center text-stone-400">
                <p>아직 등록된 게시글이 없어요 🥲</p>
                <p className="text-xs mt-1">가장 먼저 글을 작성해보세요!</p>
            </div>
        )}
      </div>

      {/* 3. 글쓰기 버튼 (Floating) */}
      <button 
        onClick={() => navigate('/community/write')}       
        className="fixed bottom-24 left-6 md:left-auto md:bottom-28 md:right-10 bg-stone-900 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <PenLine className="w-6 h-6" />
      </button>

    </div>
  );
};
export default CommunityPage;