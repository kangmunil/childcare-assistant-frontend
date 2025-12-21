import React, { useEffect } from 'react';
import { BookOpen, ShoppingBag, Info, ExternalLink } from 'lucide-react';

const PromoWidget = ({ data }) => {
  // 실제로는 여기서 API로 '노출 수(Impression)'를 서버에 전송합니다.
  useEffect(() => {
    console.log(`광고 노출됨: ${data.title} (ID: ${data.id})`);
    // 예: postAdImpression(data.id);
  }, [data]);

  // 타입별 아이콘/색상 설정
  const typeConfig = {
    guide: { icon: BookOpen, label: 'Premium Guide', bg: 'bg-indigo-900', accent: 'text-indigo-300' },
    ad:    { icon: ShoppingBag, label: 'Sponsored',      bg: 'bg-rose-900',   accent: 'text-rose-300' },
    info:  { icon: Info,     label: 'Tip',             bg: 'bg-emerald-900', accent: 'text-emerald-300' },
  };

  const config = typeConfig[data.type] || typeConfig.guide;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg shrink-0 group cursor-pointer transition-transform hover:scale-[1.02]`}>
      {/* 배경 장식 효과 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[50px] -mr-8 -mt-8 pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* 상단 라벨 */}
        <div className="inline-flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md border border-white/10 mb-3 backdrop-blur-sm">
          <Icon className={`w-3 h-3 ${config.accent}`} />
          <span className={`text-[10px] font-bold tracking-wide uppercase ${config.accent}`}>
            {config.label}
          </span>
        </div>

        {/* 타이틀 & 설명 */}
        <h3 className="text-lg font-bold leading-tight mb-1">{data.title}</h3>
        <p className="text-white/70 text-xs mb-4">{data.description}</p>

        {/* 버튼 */}
        <button 
          onClick={() => window.open(data.link, '_blank')}
          className="w-full bg-white text-gray-900 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          {data.buttonText || '자세히 보기'}
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default PromoWidget;