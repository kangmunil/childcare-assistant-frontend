import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Heart, MessageSquare, Share2, User, Send } from 'lucide-react';

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL에서 글 ID 가져오기 (예: "1", "2")

  // 1. 커뮤니티 페이지와 똑같은 더미 데이터 (나중엔 서버에서 가져올 부분)
  const allPosts = [
    {
      id: 1,
      category: 'qna',
      author: '서준파파',
      babyAge: 'D+85',
      title: '신생아 태열이 안 가라앉아요 ㅠㅠ',
      content: '수딩젤 발라주고 온습도 조절도 했는데 계속 붉게 올라오네요. 병원 가봐야 할까요?',
      likes: 5,
      commentsCount: 12,
      time: '10분 전',
      image: null,
      comments: [
          { id: 101, user: '육아고수', content: '저희 애도 그랬는데 리도맥스 처방받고 싹 나았어요!', time: '1분 전' },
          { id: 102, user: '지우맘', content: '온도를 21도까지 확 낮춰보세요 ㅠㅠ', time: '3분 전' }
      ]
    },
    {
      id: 2,
      category: 'daily',
      author: '지우맘',
      babyAge: 'D+185',
      title: '오늘 이유식 먹방 찍었습니다 ㅋㅋ',
      content: '소고기 미음 처음 줬는데 없어서 못 먹네요. 입에 묻은 거 너무 귀여워요.',
      likes: 42,
      commentsCount: 8,
      time: '1시간 전',
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop',
      comments: [
          { id: 201, user: '서준파파', content: '와 부럽습니다.. 저희는 언제쯤..', time: '5분 전' },
          { id: 202, user: '둥이맘', content: '비법 좀 공유해주세요!', time: '10분 전' },
      ]
    },
    {
      id: 3,
      category: 'tip',
      author: '둥이맘',
      babyAge: 'D+200',
      title: '국민 장난감 튤립 사운드북 핫딜 떴어요!',
      content: '지금 쿠*에서 30% 할인 중이네요. 필요하신 분들 달리세요!',
      likes: 150,
      commentsCount: 45,
      time: '3시간 전',
      image: null,
      comments: [
        { id: 301, user: '감사해요', content: '덕분에 득템했습니다!', time: '10분 전' }
      ]
    }
  ];

  // 2. ID에 맞는 글 찾기 (URL의 id는 문자열이므로 숫자로 변환)
  const post = allPosts.find(p => p.id === parseInt(id));

  // 예외 처리: 글을 못 찾았을 때
  if (!post) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center">
              <p className="text-stone-500 mb-4">삭제되었거나 존재하지 않는 글입니다.</p>
              <button onClick={() => navigate(-1)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm">돌아가기</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0 relative max-w-2xl mx-auto">
      
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
            <button className="text-stone-400 hover:text-stone-800"><Share2 className="w-5 h-5" /></button>
            <button className="text-stone-400 hover:text-stone-800"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="p-6">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                <User className="w-5 h-5 text-stone-400" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800">{post.author}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">{post.babyAge}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>{post.time}</span>
                    <span>•</span>
                    <span className={`capitalize font-bold ${
                        post.category === 'qna' ? 'text-rose-500' : 
                        post.category === 'daily' ? 'text-emerald-500' : 'text-indigo-500'
                    }`}>
                        {post.category === 'qna' ? 'Q&A' : post.category === 'daily' ? '일상' : '꿀팁'}
                    </span>
                </div>
            </div>
        </div>

        {/* 본문 */}
        <div className="mb-8">
            <h1 className="text-xl font-bold text-stone-900 mb-4">{post.title}</h1>
            <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {/* 이미지가 있다면 표시 */}
            {post.image && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-stone-100">
                    <img src={post.image} alt="content" className="w-full object-cover" />
                </div>
            )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 border-b border-stone-100 pb-6 mb-6">
             <button className="flex items-center gap-1.5 text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl text-sm">
                <Heart className="w-4 h-4 fill-rose-500" /> {post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-stone-500 font-bold bg-stone-50 px-4 py-2 rounded-xl text-sm">
                <MessageSquare className="w-4 h-4" /> {post.comments ? post.comments.length : 0}
            </button>
        </div>

        {/* 댓글 영역 */}
        <div className="space-y-6 pb-20">
            <h3 className="font-bold text-stone-800">댓글 <span className="text-amber-500">{post.comments ? post.comments.length : 0}</span></h3>
            
            <div className="space-y-4">
                {post.comments && post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-stone-300" />
                        </div>
                        <div className="bg-stone-50 p-3 rounded-r-xl rounded-bl-xl flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-stone-700">{comment.user}</span>
                                <span className="text-[10px] text-stone-400">{comment.time}</span>
                            </div>
                            <p className="text-sm text-stone-600">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 댓글 입력바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 pb-8 md:pb-4 z-30">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input 
                type="text" 
                placeholder="따뜻한 댓글을 남겨주세요" 
                className="flex-1 bg-stone-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            <button className="bg-stone-900 text-white p-3 rounded-full hover:bg-stone-800">
                <Send className="w-4 h-4" />
            </button>
          </div>
      </div>
    </div>
  );
};

export default PostDetailPage;