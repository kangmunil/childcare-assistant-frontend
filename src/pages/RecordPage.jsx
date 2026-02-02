import React, { useState, useEffect, useRef } from 'react';
import { Ruler, Weight, Check, Plus, Mic, Camera, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateMonths } from '../utils/dateUtils';
import GrowthInputModal from '../components/GrowthInputModal';

const CHECKLIST_DIVISION = 'behavior';

const RecordPage = () => {
  const {
    children, childrenLoaded, activeChildId, growthRecords = [], growthRecordsLoaded,
    createGrowthHistory, fetchGrowthHistory,
    checklistUnchecked, checklistChecked, checklistLoaded,
    fetchAllChecklists, addCheck, removeCheck,
  } = useStore();

  const fileInputRef = useRef(null);

  const currentChild = children?.find(c => c.id === activeChildId) || children?.[0] || { name: '아이' };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const birthDay = currentChild.birthDay || currentChild.birthDate;
  const currentMonths = birthDay ? calculateMonths(birthDay) : 0;

  // 성장 이력 + 체크리스트 데이터 로드
  useEffect(() => {
    if (childrenLoaded && currentChild?.id) {
      fetchGrowthHistory(currentChild.id);
      fetchAllChecklists(currentChild.id, [CHECKLIST_DIVISION]);
    }
  }, [childrenLoaded, currentChild?.id]);

  // 체크된 항목 ID 설정
  const checkedItemIds = new Set(checklistChecked.map(item => item.itemId));

  // 발달 체크리스트에는 미완료 항목만 표시 (월령별 필터 적용)
  const toggleCheck = async (itemId) => {
    if (togglingId) return;
    if (!currentChild?.id) return;

    setTogglingId(itemId);
    const isCurrentlyChecked = checkedItemIds.has(itemId);

    let result;
    if (isCurrentlyChecked) {
      result = await removeCheck(currentChild.id, itemId);
    } else {
      result = await addCheck(currentChild.id, itemId);
    }

    if (result.success) {
      await fetchAllChecklists(currentChild.id, [CHECKLIST_DIVISION]);
    }
    setTogglingId(null);
  };

  const handleRecordAll = async () => {
    if (checklistUnchecked.length === 0) {
      alert("모든 항목이 이미 체크되어 있어요!");
      return;
    }
    if (!window.confirm(`미완료 ${checklistUnchecked.length}개 항목을 모두 기록할까요?`)) return;

    for (const item of checklistUnchecked) {
      await addCheck(currentChild.id, item.itemId);
    }
    await fetchAllChecklists(currentChild.id, [CHECKLIST_DIVISION]);
    alert('모두 기록했습니다!');
  };

  const handleSaveGrowth = async (newData) => {
    if (!currentChild?.id) return;

    await createGrowthHistory(currentChild.id, {
      height: newData.height,
      weight: newData.weight,
    });
  };

  // ---------------------------------------------------------
  // 1. 🎤 음성 인식 기능 (Web Speech API)
  // ---------------------------------------------------------
  const handleVoiceRecord = () => {
    // 브라우저 지원 여부 확인
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; // 한국어 설정
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log('음성 인식 결과:', text);
      setIsListening(false);

      // 정규식으로 숫자 추출 (예: "키 65.5 몸무게 7.2" -> 65.5, 7.2)
      // 간단하게 문장에서 숫자(소수점 포함)를 순서대로 찾음
      const numbers = text.match(/\d+(\.\d+)?/g);

      if (numbers && numbers.length >= 2) {
        const height = numbers[0];
        const weight = numbers[1];

        if (window.confirm(`"${text}"라고 인식했어요.\n키: ${height}cm, 몸무게: ${weight}kg\n이대로 기록할까요?`)) {
            handleSaveGrowth({ date: new Date(), height, weight });
        }
      } else {
        alert(`인식된 내용: "${text}"\n\n정확한 수치를 인식하지 못했어요. "키 60 몸무게 6" 처럼 말해보세요!`);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("음성 인식 중 오류가 발생했습니다.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // ---------------------------------------------------------
  // 2. 📸 사진 분석 시뮬레이션
  // ---------------------------------------------------------
  const handlePhotoAnalysis = (e) => {
    const file = e.target.files[0];
    if (file) {
        setIsAnalyzing(true);

        // 1.5초 동안 분석하는 척 (Simulation)
        setTimeout(() => {
            setIsAnalyzing(false);

            // 더미 데이터 생성 (현재 기록보다 조금 크게)
            const simulatedHeight = (latestData.height + 0.5).toFixed(1);
            const simulatedWeight = (latestData.weight + 0.2).toFixed(1);

            if(window.confirm(`[AI 분석 완료] 영유아 검진표가 감지되었습니다!\n\n감지된 키: ${simulatedHeight}cm\n감지된 몸무게: ${simulatedWeight}kg\n\n기록하시겠습니까?`)) {
                handleSaveGrowth({ date: new Date(), height: simulatedHeight, weight: simulatedWeight });
            }
        }, 1500);
    }
  };

  const latestData = growthRecords.length > 0
    ? growthRecords[growthRecords.length - 1]
    : {
        height: parseFloat(currentChild.height) || 0,
        weight: parseFloat(currentChild.weight) || 0,
      };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <GrowthInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGrowth}
      />

      {/* 숨겨진 파일 인풋 (카메라 호출용) */}
      <input
        type="file"
        accept="image/*"
        capture="environment" // 모바일에서 후면 카메라 바로 실행
        ref={fileInputRef}
        onChange={handlePhotoAnalysis}
        className="hidden"
      />

      {/* 분석 중 로딩 오버레이 */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-lg font-bold text-indigo-900 animate-pulse">AI가 검진표를 분석 중입니다...</p>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center shrink-0 pt-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">신체 발달 기록</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          기록 추가
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-24 md:pb-0 pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* [Left] 그래프 */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Ruler className="w-16 h-16 text-blue-500" />
                </div>
                <p className="text-gray-400 text-xs font-bold mb-1">키 (Height)</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-800 dark:text-white">{latestData.height}</span>
                  <span className="text-sm font-bold text-gray-400">cm</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Weight className="w-16 h-16 text-rose-500" />
                </div>
                <p className="text-gray-400 text-xs font-bold mb-1">몸무게 (Weight)</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-800 dark:text-white">{latestData.weight}</span>
                  <span className="text-sm font-bold text-gray-400">kg</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-[350px]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">성장 추이</h3>
              <div className="flex-1 flex items-end justify-between px-2 gap-4 relative h-64">
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-6">
                  <div className="border-b border-gray-50 dark:border-gray-700 h-0 w-full"></div>
                  <div className="border-b border-gray-50 dark:border-gray-700 h-0 w-full"></div>
                  <div className="border-b border-gray-50 dark:border-gray-700 h-0 w-full"></div>
                  <div className="border-b border-gray-50 dark:border-gray-700 h-0 w-full"></div>
                </div>

                {growthRecords.map((data, idx) => (
                  <div key={idx} className="h-full flex flex-col justify-end items-center gap-2 z-10 group cursor-pointer w-full">
                    <div className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-1.5 py-0.5 rounded mb-1">
                      {data.height}cm
                    </div>
                    <div
                      style={{ height: `${Math.min((data.height / 100) * 100, 100)}%` }}
                      className="w-full max-w-[40px] bg-amber-200 dark:bg-amber-800 rounded-t-xl relative group-hover:bg-amber-400 dark:group-hover:bg-amber-600 transition-colors"
                    ></div>
                    <span className="text-xs font-bold text-gray-400">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* [Right] 발달 체크리스트 */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden shrink-0">
              <h3 className="text-lg font-bold mb-1 relative z-10">발달 체크리스트</h3>
              <p className="text-indigo-100 text-xs mb-4 relative z-10">
                생후 {currentMonths}개월 ({currentChild.name})
                <br />
                지금 시기엔 이런 걸 할 수 있어요!
              </p>

              <div className="space-y-3 relative z-10">
                {!checklistLoaded ? (
                  <div className="text-center py-4 text-indigo-200 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    불러오는 중...
                  </div>
                ) : checklistUnchecked.length > 0 ? (
                  checklistUnchecked.map(item => {
                    const isToggling = togglingId === item.itemId;
                    return (
                      <div
                        key={item.itemId}
                        onClick={() => toggleCheck(item.itemId)}
                        className={`backdrop-blur-md border p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all bg-white/10 border-white/20 hover:bg-white/20 ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center shrink-0" />
                        <span className="text-sm font-medium flex-1">{item.itemContent}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-indigo-200 text-sm">
                    해당 시기의 체크리스트가 아직 없어요
                  </div>
                )}
              </div>

              {checklistUnchecked.length > 0 && (
                <button
                  onClick={handleRecordAll}
                  className="mt-4 w-full py-3 bg-white text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  모두 기록하기
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">완료한 과업</h3>
              {checklistChecked.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {checklistChecked.map(item => (
                    <div
                      key={item.itemId}
                      onClick={() => toggleCheck(item.itemId)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 line-through">{item.itemContent}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 dark:bg-gray-700 rounded-xl">
                  아직 기록된 완료 과업이 없어요.<br />
                  위에서 체크하고 기록해보세요!
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
            {/* 🎤 음성 기록 버튼 */}
              <button
                onClick={handleVoiceRecord}
                disabled={isListening}
                className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  isListening
                    ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                    : 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 text-gray-400'
                }`}
              >
                <Mic className={`w-6 h-6 ${isListening ? 'animate-bounce' : ''}`} />
                <span className="text-xs font-bold">
                  {isListening ? '듣는 중...' : '말로 기록'}
                </span>
              </button>

             {/* 📸 사진 분석 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all text-gray-400"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-bold">사진 분석</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordPage;
