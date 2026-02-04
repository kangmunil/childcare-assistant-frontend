import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Trash2, Milk, Moon, Activity, Droplet, Baby, Utensils, Heart, BarChart3, FileText, Save } from 'lucide-react';
import useStore from '../store/useStore';
import TrackerCard from '../components/TrackerCard';
import DiaryStatsModal from '../components/DiaryStatsModal';

// 아이템 코드 → 아이콘/색상 매핑
const codeStyleMap = {
  BREAST:     { icon: Milk,     themeColor: 'amber' },
  FORMULA:    { icon: Milk,     themeColor: 'amber' },
  PUMPING:    { icon: Droplet,  themeColor: 'emerald' },
  SLEEP:      { icon: Moon,     themeColor: 'indigo' },
  DIAPER:     { icon: Activity, themeColor: 'sky' },
  BABY_FOOD:  { icon: Utensils, themeColor: 'amber' },
  PLAY:       { icon: Baby,     themeColor: 'emerald' },
  POTTY:      { icon: Activity, themeColor: 'sky' },
  NAP:        { icon: Moon,     themeColor: 'indigo' },
};
const defaultStyle = { icon: Heart, themeColor: 'amber' };

const accentColors = {
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', ring: 'ring-amber-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', btn: 'bg-emerald-500 hover:bg-emerald-600', ring: 'ring-emerald-400' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-700', btn: 'bg-indigo-500 hover:bg-indigo-600', ring: 'ring-indigo-400' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-700', btn: 'bg-sky-500 hover:bg-sky-600', ring: 'ring-sky-400' },
};

const DiaryPage = () => {
  const navigate = useNavigate();
  const {
    children,
    childrenLoaded,
    activeChildId,
    diaryItems,
    diaryItemsLoaded,
    summaryValues,
    fetchDiaryItems,
    fetchSummary,
    fetchDiaryLogs,
    createDiary,
    deleteDiary,
    fetchDiaryMemo,
    createDiaryMemo,
    updateDiaryMemo,
    deleteDiaryMemo,
  } = useStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [inputTime, setInputTime] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [memo, setMemo] = useState(null);
  const [memoContent, setMemoContent] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  const currentChild = children.find(c => c.id === activeChildId) || children[0];

  // 자녀가 없으면 자녀 등록 페이지로 이동
  useEffect(() => {
    if (childrenLoaded && children.length === 0) {
      navigate('/child-setup', { replace: true });
    }
  }, [childrenLoaded, children.length, navigate]);

  // 자녀 변경 시 선택 항목 리셋
  useEffect(() => {
    setSelectedItemId(null);
  }, [activeChildId]);

  // 자녀/날짜 변경 시 데이터 조회
  useEffect(() => {
    if (childrenLoaded && currentChild?.id) {
      const birthDay = currentChild.birthDay || currentChild.birthDate;
      if (birthDay) {
        fetchDiaryItems(birthDay);
      }
      fetchSummary(currentChild.id, selectedDate);
      loadLogs();
      loadMemo();
    }
  }, [childrenLoaded, currentChild?.id, selectedDate]);

  // 일지 항목 로드 후 첫 번째 항목 선택
  useEffect(() => {
    if (diaryItemsLoaded && diaryItems.length > 0) {
      setSelectedItemId(diaryItems[0].id);
    }
  }, [diaryItemsLoaded, diaryItems]);

  // 현재 시간으로 초기화
  useEffect(() => {
    const now = new Date();
    setInputTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  }, []);

  const loadLogs = async () => {
    if (!currentChild?.id) return;
    const allLogs = await fetchDiaryLogs(currentChild.id, selectedDate);
    const sorted = allLogs
      .map(log => ({
        id: log.id,
        itemId: log.itemId,
        time: log.diTime || '00:00',
        amount: Number(log.amount) || 0,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    setLogs(sorted);
  };

  const loadMemo = async () => {
    if (!currentChild?.id) return;
    const result = await fetchDiaryMemo(currentChild.id, selectedDate);
    if (result.success && result.data) {
      setMemo(result.data);
      setMemoContent(result.data.memo || '');
    } else {
      setMemo(null);
      setMemoContent('');
    }
  };

  const handleSaveMemo = async () => {
    if (!currentChild?.id || savingMemo) return;
    setSavingMemo(true);

    let result;
    if (memo?.id) {
      result = await updateDiaryMemo(currentChild.id, memo.id, memoContent);
    } else {
      result = await createDiaryMemo(currentChild.id, selectedDate, memoContent);
    }

    if (result.success) {
      await loadMemo();
    }
    setSavingMemo(false);
  };

  const handleDeleteMemo = async () => {
    if (!currentChild?.id || !memo?.id) return;
    if (!window.confirm('메모를 삭제하시겠습니까?')) return;

    const result = await deleteDiaryMemo(currentChild.id, memo.id);
    if (result.success) {
      setMemo(null);
      setMemoContent('');
    }
  };

  const selectedItem = diaryItems.find(item => item.id === selectedItemId);
  const selectedStyle = selectedItem
    ? codeStyleMap[(selectedItem.code || '').toUpperCase()] || defaultStyle
    : defaultStyle;
  const accent = accentColors[selectedStyle.themeColor] || accentColors.amber;

  // 트래커 카드 데이터
  const trackerData = diaryItems.map(item => {
    const code = (item.code || '').toUpperCase();
    const style = codeStyleMap[code] || defaultStyle;
    const sv = summaryValues[item.id];
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      value: sv?.totalAmount ?? 0,
      count: sv?.count ?? 0,
      unit: item.unit || '',
      themeColor: style.themeColor,
      icon: style.icon,
    };
  });

  const handleAddLog = async () => {
    if (!inputTime || !inputAmount || !selectedItemId || saving) return;

    setSaving(true);
    const result = await createDiary(
      currentChild.id,
      [{ diDate: selectedDate, diTime: inputTime, amount: Number(inputAmount) }],
      selectedItemId
    );
    setSaving(false);

    if (result.success) {
      setInputAmount('');
      await fetchSummary(currentChild.id, selectedDate);
      await loadLogs();
    }
  };

  const handleDeleteLog = async (diaryId) => {
    if (!currentChild?.id || !diaryId) return;
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;

    const result = await deleteDiary(currentChild.id, diaryId);
    if (result.success) {
      await fetchSummary(currentChild.id, selectedDate);
      await loadLogs();
    }
  };

  // 선택된 항목의 오늘 기록만 필터링
  const filteredLogs = logs.filter(log => log.itemId === selectedItemId);

  return (
    <div className="h-full flex flex-col gap-6 pb-24 md:pb-0">
      {/* 통계 모달 */}
      <DiaryStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        logs={logs}
        diaryItems={diaryItems}
        selectedDate={selectedDate}
        memo={memo}
      />

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">하루 일지</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            통계
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
          {/* 트래커 카드들 - 모바일 1번째, 데스크톱 좌측 1행 */}
          <div className="order-1 lg:order-none lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-1">
              {trackerData.map(item => {
                const isSelected = item.id === selectedItemId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`cursor-pointer transition-all rounded-[1.75rem] relative m-1 ${
                      isSelected
                        ? 'outline outline-3 outline-amber-500 dark:outline-amber-400 shadow-xl shadow-amber-300/50 dark:shadow-amber-500/30 scale-[1.02]'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    <TrackerCard
                      title={item.code}
                      subtitle={item.name}
                      value={item.value}
                      unit={item.unit}
                      icon={item.icon}
                      themeColor={item.themeColor}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오늘의 메모 - 모바일 3번째, 데스크톱 우측 1행 */}
          <div className="order-3 lg:order-none lg:col-span-5">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">오늘의 메모</h3>
              </div>
              <textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="오늘 하루를 간단히 기록해보세요."
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
              />
              <div className="flex justify-end gap-2">
                {memo?.id && (
                  <button
                    onClick={handleDeleteMemo}
                    className="px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveMemo}
                  disabled={savingMemo || !memoContent.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 flex items-center gap-1"
                >
                  {savingMemo ? '저장 중...' : (memo?.id ? '수정' : '저장')}
                </button>
              </div>
            </div>
          </div>

          {/* 입력 폼 - 모바일 2번째, 데스크톱 좌측 2행 */}
          <div className="order-2 lg:order-none lg:col-span-7">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">
                {selectedItem?.name || '항목'} 기록하기
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">시간</label>
                  <input
                    type="time"
                    value={inputTime}
                    onChange={(e) => setInputTime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-amber-400 focus:bg-white dark:focus:bg-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 py-3 px-4 transition-all outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">
                    {selectedItem?.name || '값'} ({selectedItem?.unit || ''})
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-amber-400 focus:bg-white dark:focus:bg-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 py-3 px-4 transition-all outline-none"
                  />
                </div>
                <button
                  onClick={handleAddLog}
                  disabled={!inputAmount || saving}
                  className={`${accent.btn} disabled:bg-gray-200 dark:disabled:bg-gray-600 text-white p-3.5 rounded-xl shadow-lg disabled:shadow-none transition-all active:scale-95`}
                >
                  {saving ? <Clock className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* 오늘의 기록 목록 - 모바일 4번째, 데스크톱 우측 2행 */}
          <div className="order-4 lg:order-none lg:col-span-5 lg:col-start-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                  오늘의 {selectedItem?.name || ''} 기록
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${accent.bg} ${accent.text}`}>
                  총 {filteredLogs.reduce((acc, log) => acc + log.amount, 0)} {selectedItem?.unit || ''}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                    {selectedItem && <selectedStyle.icon className="w-12 h-12 mb-3 opacity-20" />}
                    <p className="text-sm">오늘 기록된 {selectedItem?.name || ''} 내역이 없습니다.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div
                      key={log.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${accent.bg} ${accent.text} px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5`}>
                          <Clock className="w-3.5 h-3.5" />
                          {log.time}
                        </div>
                        <div>
                          <span className="text-lg font-bold text-gray-800 dark:text-white">{log.amount}</span>
                          <span className="text-xs text-gray-400 ml-0.5">{selectedItem?.unit || ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
