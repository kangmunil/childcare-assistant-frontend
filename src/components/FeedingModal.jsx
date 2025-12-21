import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Droplet } from 'lucide-react';

const FeedingModal = ({ isOpen, onClose, initialData, onSave }) => {
  // 실제 구현 시에는 Store에서 해당 날짜의 feedingLogs 배열을 가져와야 합니다.
  // 여기서는 로컬 state로 시뮬레이션 합니다.
  const [logs, setLogs] = useState([]);
  
  // 입력 폼 상태
  const [inputTime, setInputTime] = useState('');
  const [inputAmount, setInputAmount] = useState('');

  // 모달 열릴 때 초기화 (현재 시간 자동 세팅 등)
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setInputTime(timeStr);
      setInputAmount('');
      
      // [TODO] 실제로는 서버나 Store에서 기존 로그를 불러와야 함
      // setLogs(initialData.logs || []); 
    }
  }, [isOpen, initialData]);

  // 총량 자동 계산 (Aggregation)
  const totalAmount = logs.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleAddLog = () => {
    if (!inputTime || !inputAmount) return;

    const newLog = {
      id: Date.now(), // 임시 ID
      time: inputTime,
      amount: Number(inputAmount),
      type: 'formula' // 모유/분유 구분 필요 시 확장 포인트
    };

    const sortedLogs = [...logs, newLog].sort((a, b) => a.time.localeCompare(b.time));
    setLogs(sortedLogs);
    
    // 폼 초기화
    setInputAmount('');
  };

  const handleDeleteLog = (id) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  const handleConfirm = () => {
    // 부모 컴포넌트(Store)에 '로그 리스트'와 '계산된 총량'을 모두 전달
    // 대시보드에는 totalAmount만 보여주더라도, 데이터는 로그가 저장되어야 함
    onSave({
      total: totalAmount,
      logs: logs
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-amber-400 p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-black">수유 기록</h2>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight">{totalAmount}</span>
            <span className="text-xl font-bold opacity-80 mb-2">ml</span>
            <span className="text-sm opacity-70 mb-3 ml-auto">오늘 총 섭취량</span>
          </div>
        </div>

        {/* Body: Log List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-[200px]">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
              <Droplet className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">오늘 기록된 수유 내역이 없습니다.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {log.time}
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-800">{log.amount}</span>
                    <span className="text-xs text-gray-400 ml-0.5">ml</span>
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
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-amber-400 focus:ring-amber-400 rounded-xl font-bold text-gray-700 py-3 px-4 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">용량 (ml)</label>
              <input 
                type="number" 
                pattern="\d*"
                placeholder="0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-amber-400 focus:ring-amber-400 rounded-xl font-bold text-gray-700 py-3 px-4 transition-all"
              />
            </div>
            <button 
              onClick={handleAddLog}
              disabled={!inputAmount}
              className="bg-amber-500 disabled:bg-gray-200 text-white p-3.5 rounded-xl shadow-lg shadow-amber-200 disabled:shadow-none transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          
          <button 
            onClick={handleConfirm}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            기록 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedingModal;