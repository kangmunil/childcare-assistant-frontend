import React, { useState, useEffect } from 'react';
import { X, Check, MapPin, Clock, AlignLeft, Calendar as CalIcon } from 'lucide-react';

const CalendarInputModal = ({ isOpen, onClose, onSave, selectedDate }) => {
  const [title, setTitle] = useState(''); // summary
  const [time, setTime] = useState('12:00'); // start.dateTime (시간 부분)
  const [location, setLocation] = useState(''); // location
  const [description, setDescription] = useState(''); // description
  const [type, setType] = useState('todo'); // colorId 매핑용 (병원, 이벤트, 할일)
  const [saving, setSaving] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime('12:00');
      setLocation('');
      setDescription('');
      setType('todo');
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title) {
      alert('일정 제목을 입력해주세요!');
      return;
    }
    if (saving) return;

    setSaving(true);
    await onSave({
      title,
      time,
      location,
      description,
      type,
      date: selectedDate // 날짜는 부모가 선택한 날짜 사용
    });
    setSaving(false);
    onClose();
  };

  // 날짜 포맷팅 (YYYY년 MM월 DD일)
  const dateStr = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100 relative">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <CalIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">일정 추가</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">새로운 일정을 입력해요</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-300" />
            </button>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">일정 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-600 outline-none font-bold text-gray-800 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
              placeholder="예: 영유아 검진"
              autoFocus
            />
          </div>

          {/* 시간 & 종류 선택 */}
          <div className="flex gap-3">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">시간</label>
                <div className="relative">
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 focus:border-indigo-500 outline-none font-bold text-gray-800 dark:text-white"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">종류</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 focus:border-indigo-500 outline-none font-bold text-gray-800 dark:text-white appearance-none"
                >
                    <option value="hospital">🏥 병원</option>
                    <option value="event">🎉 이벤트</option>
                    <option value="todo">✅ 할 일</option>
                </select>
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">장소 (선택)</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-600 outline-none font-medium text-gray-800 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                    placeholder="예: 서울 소아과"
                />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">메모 (선택)</label>
            <div className="relative">
                <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-600 outline-none font-medium text-gray-800 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 resize-none"
                    placeholder="준비물이나 메모를 적어주세요"
                />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full mt-6 py-4 bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          {saving ? '저장 중...' : '일정 추가하기'}
        </button>
      </div>
    </div>
  );
};

export default CalendarInputModal;
