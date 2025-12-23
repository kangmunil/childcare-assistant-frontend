import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';

const PostWritePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('qna');
  const [images, setImages] = useState([]); // 이미지 미리보기용

  const handleImageUpload = (e) => {
    // 실제 업로드 로직 대신 미리보기 URL만 생성 (더미)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages([...images, e.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0 relative max-w-2xl mx-auto">
      
      {/* 1. 헤더 */}
      <div className="sticky top-0 bg-white z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-stone-800">글쓰기</h1>
        <button 
            onClick={() => { alert('등록되었습니다!'); navigate('/community'); }}
            className="text-amber-500 font-bold text-sm hover:text-amber-600"
        >
            완료
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* 2. 카테고리 선택 */}
        <div className="flex gap-2">
            {['qna', 'daily', 'tip'].map((cat) => (
                <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        category === cat 
                        ? 'bg-stone-800 text-white shadow-md' 
                        : 'bg-stone-50 text-stone-400 border border-stone-100'
                    }`}
                >
                    {cat === 'qna' ? '질문해요' : cat === 'daily' ? '일상공유' : '육아꿀팁'}
                </button>
            ))}
        </div>

        {/* 3. 입력 폼 */}
        <div className="space-y-4">
            <input 
                type="text" 
                placeholder="제목을 입력하세요" 
                className="w-full text-lg font-bold text-stone-800 placeholder:text-stone-300 focus:outline-none"
            />
            <textarea 
                placeholder="내용을 입력하세요. (육아 고민, 자랑, 팁 등 자유롭게 나눠요)" 
                className="w-full h-64 text-base text-stone-600 placeholder:text-stone-300 focus:outline-none resize-none leading-relaxed"
            />
        </div>

        {/* 4. 이미지 첨부 영역 */}
        <div>
            <div className="flex gap-3 overflow-x-auto py-2">
                {/* 사진 추가 버튼 */}
                <label className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-100 shrink-0">
                    <ImageIcon className="w-6 h-6 text-stone-400" />
                    <span className="text-[10px] text-stone-400 font-bold">{images.length}/5</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                {/* 미리보기 이미지들 */}
                {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100 shrink-0">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button 
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostWritePage;