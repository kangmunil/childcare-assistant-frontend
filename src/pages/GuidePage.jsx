import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Star, BookOpen } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateMonths } from '../utils/dateUtils';
// ⚠️ 중요: 자네 데이터 파일이 'export const'를 쓰므로 중괄호 { }로 가져와야 함
import { GUIDE_DATA, CATEGORIES } from '../data/guideData';

// 🎨 카테고리별 색상 매핑 (ID를 데이터 파일과 정확히 일치시킴)
const CATEGORY_STYLES = {
  sleep: 'bg-indigo-100 text-indigo-500',
  feeding: 'bg-orange-100 text-orange-500',
  health: 'bg-red-100 text-red-500',
  development: 'bg-green-100 text-green-500', // 'play' -> 'development'로 수정완료
  default: 'bg-gray-100 text-gray-500'
};

const GuidePage = () => {
  // 1. 스토어 및 날짜 계산 로직
  const { children, activeChildId } = useStore();
  const currentChild = children?.find(c => c.id === activeChildId) || children?.[0];
  
  // 아이 데이터가 없으면 0으로 처리 (앱 뻗음 방지)
  const currentMonths = currentChild?.birthDate ? calculateMonths(currentChild.birthDate) : 0;

  // 2. 상태 관리
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // 3. 필터링 로직 (검색 + 카테고리)
  const filteredData = useMemo(() => {
    // 데이터가 안 불러와졌을 경우를 대비해 빈 배열 처리
    const data = GUIDE_DATA || []; 
    
    const filtered = data.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;

      // 검색어 대소문자 무시 (UX 향상)
      const normalizedSearch = searchTerm.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.content.toLowerCase().includes(normalizedSearch);

      return matchCategory && matchSearch;
    });

    // 맞춤 정보(월령 추천) 항목을 최상단으로 정렬
    return filtered.sort((a, b) => {
      const aRec = currentMonths >= a.minMonth && currentMonths <= a.maxMonth ? 1 : 0;
      const bRec = currentMonths >= b.minMonth && currentMonths <= b.maxMonth ? 1 : 0;
      return bRec - aRec;
    });
  }, [activeCategory, searchTerm, currentMonths]);

  // 아코디언 토글
  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="pb-24 pt-6 px-4 h-full overflow-y-auto flex flex-col gap-6">

      {/* --- 헤더 섹션 --- */}
      <div className="shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">육아 가이드</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentChild ? (
              <>현재 <span className="text-amber-500 font-bold">{currentMonths}개월</span>인 {currentChild.name}를 위한 꿀팁</>
            ) : (
              "초보 엄빠를 위한 육아 꿀팁 모음집"
            )}
          </p>
        </div>

        {/* 검색창 */}
        <div className="relative">
          <input
            type="text"
            placeholder="궁금한 키워드 검색 (예: 수면, 이유식)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all dark:text-white text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* --- 카테고리 탭 (가로 스크롤) --- */}
      <div className="shrink-0 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES && CATEGORIES.map((cat) => {
          const IconComponent = cat.icon; // 컴포넌트로 변환
          const isActive = activeCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap transition-all border ${
                isActive 
                  ? 'bg-amber-400 border-amber-400 text-white shadow-md font-bold' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {/* 아이콘이 있을 때만 렌더링 */}
              {IconComponent && <IconComponent className="w-4 h-4" />}
              <span className="text-sm">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- 리스트 영역 --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 pr-1 custom-scrollbar space-y-3 min-w-0">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            // 월령 추천 여부
            const isRecommended = currentMonths >= item.minMonth && currentMonths <= item.maxMonth;
            const isExpanded = expandedId === item.id;
            
            // 스타일 및 아이콘 매칭
            const catObj = CATEGORIES.find(c => c.id === item.category);
            const CategoryIcon = catObj ? catObj.icon : BookOpen;
            const iconStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.default;

            return (
              <div 
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-amber-400 ring-1 ring-amber-400 shadow-md' 
                    : 'border-gray-100 hover:border-amber-200'
                }`}
              >
                {/* 카드 헤더 */}
                <div 
                  onClick={() => toggleAccordion(item.id)}
                  className="p-4 flex items-start gap-3 cursor-pointer select-none"
                >
                  <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                      <CategoryIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isRecommended && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-700" />
                          맞춤 정보
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">
                        {catObj?.label || '기타'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base transition-colors ${
                        isExpanded ? 'text-amber-600' : 'text-gray-800 dark:text-gray-100'
                    }`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="text-gray-400 mt-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* 카드 내용 (아코디언) */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fadeIn">
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                          #{item.minMonth}~{item.maxMonth}개월
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* 데이터 없음 / 검색 결과 없음 */
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 opacity-70">
             <Search className="w-10 h-10 mb-2" />
             <p className="text-sm">데이터를 찾을 수 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidePage;