import React from 'react';

const TrackerCard = ({ title, subtitle, value, unit, icon: Icon, themeColor }) => {
  const themeStyles = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  };
  
  const style = themeStyles[themeColor] || themeStyles.amber;

  return (
    <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer h-full">
      <div className="flex justify-between items-start mb-2">
        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center ${style.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
           <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className={`absolute -top-6 -right-6 w-20 h-20 ${style.bg} rounded-full opacity-50 blur-xl pointer-events-none`}></div>
      </div>
      
      <div className="relative z-10">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-800 tracking-tight">{value}</span>
          <span className="text-xs font-semibold text-gray-500">{unit}</span>
        </div>
        <p className="text-[11px] font-medium text-gray-400 mt-1 flex items-center gap-1 truncate">
           {subtitle}
        </p>
      </div>
    </div>
  );
};

export default TrackerCard;
