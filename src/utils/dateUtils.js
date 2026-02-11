/**
 * 생년월일을 입력받아 현재 '만' 개월 수를 반환합니다. (일자 보정 포함)
 * @param {string} birthDateString - 'YYYY-MM-DD'
 * @returns {number} months
 */
export const calculateMonths = (birthDateString) => {
  if (!birthDateString) return 0;
  
  const today = new Date();
  const birth = new Date(birthDateString);

  // 날짜 파싱 유효성 검사 (Legacy 시절부터 기본이지?)
  if (isNaN(birth.getTime())) return 0;
  
  // 1. 단순 연/월 차이 계산
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();

  // 2. 일(Day) 단위 보정 (핵심!)
  // 오늘 날짜(일)가 생일 날짜(일)보다 작다면, 아직 이번 달 생일이 안 지난 것임 -> 1개월 차감
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  
  return months <= 0 ? 0 : months;
};