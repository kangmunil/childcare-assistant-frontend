import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';

const headerColors = {
  amber:   'bg-amber-400',
  emerald: 'bg-emerald-400',
  indigo:  'bg-indigo-400',
  sky:     'bg-sky-400',
};

const accentColors = {
  amber:   { bg: 'bg-amber-50', text: 'text-amber-600', input: 'focus:border-amber-400 focus:ring-amber-400', btn: 'bg-amber-500 shadow-amber-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', input: 'focus:border-emerald-400 focus:ring-emerald-400', btn: 'bg-emerald-500 shadow-emerald-200' },
  indigo:  { bg: 'bg-indigo-50', text: 'text-indigo-600', input: 'focus:border-indigo-400 focus:ring-indigo-400', btn: 'bg-indigo-500 shadow-indigo-200' },
  sky:     { bg: 'bg-sky-50', text: 'text-sky-600', input: 'focus:border-sky-400 focus:ring-sky-400', btn: 'bg-sky-500 shadow-sky-200' },
};

const TrackerInputModal = ({ isOpen, onClose, data, initialLogs = [], onAddLog }) => {
  const [logs, setLogs] = useState([]);
  const [inputTime, setInputTime] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // 모달이 열릴 때 기존 값을 input에 세팅
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setInputTime(timeStr);
      setInputAmount('');
      setLogs(initialLogs);
    }
  }, [isOpen, data, initialLogs]);

  if (!isOpen || !data) return null;

  const Icon = data.icon;
  const color = headerColors[data.themeColor] || headerColors.amber;
  const accent = accentColors[data.themeColor] || accentColors.amber;

  const totalAmount = logs.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleAddLog = async () => {
    if (!inputTime || !inputAmount || saving) return;

    const newLog = {
      id: Date.now(),
      time: inputTime,
      amount: Number(inputAmount),
    };

    setSaving(true);
    const success = await onAddLog(newLog);
    setSaving(false);

    if (success) {
      const sortedLogs = [...logs, newLog].sort((a, b) => a.time.localeCompare(b.time));
      setLogs(sortedLogs);
      setInputAmount('');
    }
  };

  const handleDeleteLog = (id) => {
    setLogs(logs.filter((log) => log.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`${color} p-6 text-white shrink-0`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-black">{data.subtitle} 기록</h2>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight">{totalAmount}</span>
            <span className="text-xl font-bold opacity-80 mb-2">{data.unit}</span>
            <span className="text-sm opacity-70 mb-3 ml-auto">오늘 총 {data.subtitle}</span>
          </div>
        </div>

        {/* Body: Log List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-[200px]">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
              <Icon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">오늘 기록된 {data.subtitle} 내역이 없습니다.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`${accent.bg} ${accent.text} px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5`}>
                    <Clock className="w-3.5 h-3.5" />
                    {log.time}
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-800">{log.amount}</span>
                    <span className="text-xs text-gray-400 ml-0.5">{data.unit}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="text-gray-300 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: Input Form */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 pb-8 sm:pb-4">
          <div className="flex gap-3 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">시간</label>
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className={`w-full bg-gray-50 border-transparent focus:bg-white ${accent.input} rounded-xl font-bold text-gray-700 py-3 px-4 transition-all`}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">{data.subtitle} ({data.unit})</label>
              <input
                type="number"
                pattern="\d*"
                placeholder="0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                className={`w-full bg-gray-50 border-transparent focus:bg-white ${accent.input} rounded-xl font-bold text-gray-700 py-3 px-4 transition-all`}
              />
            </div>
            <button
              onClick={handleAddLog}
              disabled={!inputAmount || saving}
              className={`${accent.btn} disabled:bg-gray-200 text-white p-3.5 rounded-xl shadow-lg disabled:shadow-none transition-all active:scale-95`}
            >
              {saving ? <Clock className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackerInputModal;
