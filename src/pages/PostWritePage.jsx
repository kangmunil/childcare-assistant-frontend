import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const PostWritePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [boards, setBoards] = useState([]);
  const [category, setCategory] = useState(searchParams.get('board') || '');
  const [images, setImages] = useState([]); // 이미지 미리보기용
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await api.get('/boards');
        if (res.status === 'success' && Array.isArray(res.data)) {
          setBoards(res.data);
        }
      } catch (error) {
        console.error('게시판 목록 조회 실패:', error);
      }
    };
    fetchBoards();
  }, []);

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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!category) {
      setErrorMessage('카테고리를 선택해주세요.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMessage('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedBoard = boards.find(b => b.code === category);
      const slug = selectedBoard?.slug || category;
      await api.post(`/boards/${slug}/items`, {
        title: title.trim(),
        content: content.trim(),
        category
      });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      navigate('/community');
    } catch (error) {
      setErrorMessage(error?.message || '글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* 1. 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-stone-800 dark:text-gray-100">글쓰기</h1>
          <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`text-sm font-bold ${
                isSubmitting
                  ? 'text-stone-300 dark:text-gray-600'
                  : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
              }`}
          >
              {isSubmitting ? '등록 중...' : '완료'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 2. 카테고리 선택 */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {boards.map((board) => (
                  <button
                      key={board.code}
                      onClick={() => setCategory(board.code)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          category === board.code
                          ? 'bg-stone-800 text-white shadow-md dark:bg-amber-500 dark:text-gray-900'
                          : 'bg-stone-50 text-stone-400 border border-stone-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                  >
                      {board.title}
                  </button>
              ))}
          </div>
          {errorMessage === '카테고리를 선택해주세요.' && (
              <p className="text-sm text-rose-500">{errorMessage}</p>
          )}

          {/* 3. 입력 폼 */}
          <div className="space-y-4">
              <input 
                  type="text" 
                  placeholder="제목을 입력하세요" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-bold text-stone-800 dark:text-gray-100 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none"
              />
              <textarea 
                  placeholder="내용을 입력하세요. (육아 고민, 자랑, 팁 등 자유롭게 나눠요)" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-64 text-base text-stone-600 dark:text-gray-200 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none resize-none leading-relaxed"
              />
              {errorMessage && errorMessage !== '카테고리를 선택해주세요.' && (
                  <p className="text-sm text-rose-500">{errorMessage}</p>
              )}
          </div>

          {/* 4. 이미지 첨부 영역 */}
          <div>
              <div className="flex gap-3 overflow-x-auto py-2">
                  {/* 사진 추가 버튼 */}
                  <label className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 shrink-0">
                      <ImageIcon className="w-6 h-6 text-stone-400 dark:text-gray-400" />
                      <span className="text-[10px] text-stone-400 dark:text-gray-400 font-bold">{images.length}/5</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>

                  {/* 미리보기 이미지들 */}
                  {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 shrink-0">
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
    </div>
  );
};

export default PostWritePage;
