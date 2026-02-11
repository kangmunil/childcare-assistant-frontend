import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar as CalIcon, Syringe, PartyPopper, Trash2, Pencil, Check, AlignLeft } from 'lucide-react';

const CalendarDetailModal = ({ isOpen, onClose, event, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen && event) {
      setIsEditing(false);
      setSaving(false);
      setForm({
        title: event.title || '',
        type: event.type || 'todo',
        date: event.date || '',
        time: event.time || '00:00',
        location: event.location || '',
        description: event.description || '',
      });
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'hospital': return <Syringe className="w-6 h-6 text-white" />;
      case 'event': return <PartyPopper className="w-6 h-6 text-white" />;
      default: return <Clock className="w-6 h-6 text-white" />;
    }
  };

  const getGradient = (type) => {
    switch (type) {
      case 'hospital': return 'from-rose-400 to-pink-500';
      case 'event': return 'from-purple-400 to-indigo-500';
      default: return 'from-amber-400 to-orange-500';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'hospital': return '병원';
      case 'event': return '이벤트';
      default: return '할 일';
    }
  };

  const formatDateKr = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await onUpdate(event.id, form);
    setSaving(false);
    if (result?.success) {
      setIsEditing(false);
    }
  };

  // ─── 수정 모드: CalendarInputModal과 동일한 디자인 ───
  if (isEditing) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">

          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg mb-2 inline-block">
                {formatDateLong(form.date)}
              </span>
              <h3 className="text-xl font-black text-gray-800">일정 수정</h3>
            </div>
            <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 입력 폼 */}
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">일정 제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-800 transition-all placeholder:text-gray-300"
                placeholder="예: 영유아 검진"
                autoFocus
              />
            </div>

            {/* 시간 & 종류 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">시간</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 outline-none font-bold text-gray-800"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">종류</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 outline-none font-bold text-gray-800 appearance-none"
                >
                  <option value="hospital">🏥 병원</option>
                  <option value="event">🎉 이벤트</option>
                  <option value="todo">✅ 할 일</option>
                </select>
              </div>
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 outline-none font-bold text-gray-800"
              />
            </div>

            {/* 장소 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">장소 (선택)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-3 pl-9 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 focus:bg-white outline-none font-medium text-gray-800 transition-all placeholder:text-gray-300"
                  placeholder="예: 서울 소아과"
                />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">메모 (선택)</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full p-3 pl-9 bg-gray-50 rounded-xl border border-gray-100 focus:border-indigo-500 focus:bg-white outline-none font-medium text-gray-800 transition-all placeholder:text-gray-300 resize-none"
                  placeholder="준비물이나 메모를 적어주세요"
                />
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 py-4 bg-indigo-600 disabled:bg-gray-300 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {saving ? '저장 중...' : '일정 수정하기'}
          </button>
        </div>
      </div>
    );
  }

  // ─── 조회 모드 ───
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden">

        {/* 헤더 */}
        <div className={`bg-gradient-to-br ${getGradient(event.type)} p-8 text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors [&>svg]:pointer-events-none"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              {getIcon(event.type)}
            </div>
            <p className="text-lg font-black">일정 상세</p>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            {/* 제목 + 종류 */}
            <div>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg mb-2 ${
                event.type === 'hospital' ? 'bg-rose-100 text-rose-600'
                : event.type === 'event' ? 'bg-purple-100 text-purple-600'
                : 'bg-amber-100 text-amber-600'
              }`}>
                {getTypeLabel(event.type)}
              </span>
              <h3 className="text-xl font-black text-gray-900">{event.title}</h3>
            </div>

            {/* 날짜 · 시간 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <CalIcon className="w-4 h-4 text-gray-400" />
                {formatDateKr(event.date)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <Clock className="w-4 h-4 text-gray-400" />
                {event.time}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* 장소 */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-700">
                  {event.location || '장소 미정'}
                </p>
                {(event.address1 || event.address2) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[event.address1, event.address2].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            </div>

            {/* 메모 */}
            {event.description && (
              <>
                <hr className="border-gray-200" />
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">메모</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              </>
            )}
          </div>

          {/* 수정 / 삭제 버튼 */}
          <div className="flex gap-3">
            {onUpdate && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-3 text-sm font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="flex-1 py-3 text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDetailModal;
