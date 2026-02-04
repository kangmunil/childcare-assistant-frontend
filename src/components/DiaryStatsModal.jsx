import React from 'react';
import { X, BarChart3, FileText } from 'lucide-react';

// 30분 간격 시간 슬롯 생성 (00:00 ~ 23:30)
const timeSlots = [];
for (let h = 0; h < 24; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`);
  timeSlots.push(`${String(h).padStart(2, '0')}:30`);
}

// 항목별 색상
const itemColors = {
  'BABY FOOD': 'bg-amber-400',
  PLAY: 'bg-emerald-400',
  POTTY: 'bg-sky-400',
  NAP: 'bg-indigo-400',
  BREAST: 'bg-yellow-400',
  FORMULA: 'bg-yellow-400',
  PUMPING: 'bg-emerald-400',
  SLEEP: 'bg-indigo-400',
  DIAPER: 'bg-sky-400',
};

const DiaryStatsModal = ({ isOpen, onClose, logs, diaryItems, selectedDate, memo }) => {
  if (!isOpen) return null;

  // 날짜 포맷팅
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  // 시간을 30분 슬롯으로 매핑
  const getTimeSlot = (time) => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    const slot = m < 30 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${slot}`;
  };

  // 로그 데이터를 시간대별로 매핑
  const logsByTimeAndItem = {};
  logs.forEach(log => {
    const slot = getTimeSlot(log.time);
    if (!slot) return;
    if (!logsByTimeAndItem[slot]) {
      logsByTimeAndItem[slot] = {};
    }
    logsByTimeAndItem[slot][log.itemId] = true;
  });

  // 활성 항목만 필터링 (기록이 있는 항목)
  const activeItemIds = [...new Set(logs.map(log => log.itemId))];
  const activeItems = diaryItems.filter(item => activeItemIds.includes(item.id));

  // 모든 항목 표시 (기록 없어도)
  const displayItems = diaryItems.length > 0 ? diaryItems : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">일지 통계</h3>
              <p className="text-xs text-gray-400">{formatDisplayDate(selectedDate)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          {displayItems.map(item => {
            const code = (item.code || '').toUpperCase();
            const color = itemColors[code] || 'bg-gray-400';
            return (
              <div key={item.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${color} rounded`}></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.name}</span>
              </div>
            );
          })}
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr>
                <th className="text-xs font-bold text-gray-400 dark:text-gray-500 p-2 text-left w-16 border-b border-gray-200 dark:border-gray-700">
                  시간
                </th>
                {displayItems.map(item => (
                  <th
                    key={item.id}
                    className="text-xs font-bold text-gray-400 dark:text-gray-500 p-2 text-center border-b border-gray-200 dark:border-gray-700"
                  >
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, idx) => (
                <tr
                  key={slot}
                  className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : 'bg-white dark:bg-gray-800'}
                >
                  <td className="text-xs font-mono text-gray-500 dark:text-gray-400 p-2 border-r border-gray-100 dark:border-gray-700">
                    {slot}
                  </td>
                  {displayItems.map(item => {
                    const hasLog = logsByTimeAndItem[slot]?.[item.id];
                    const code = (item.code || '').toUpperCase();
                    const color = itemColors[code] || 'bg-gray-400';
                    return (
                      <td key={item.id} className="p-1 text-center">
                        {hasLog ? (
                          <div className={`h-6 ${color} rounded mx-1 opacity-80`}></div>
                        ) : (
                          <div className="h-6"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {displayItems.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>표시할 항목이 없습니다.</p>
            </div>
          )}

          {/* 메모 영역 */}
          {memo?.memo && (
            <div className="mt-4 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">메모</span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{memo.memo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryStatsModal;
