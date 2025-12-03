/**
 * 생년월일을 입력받아 현재 개월 수를 반환합니다.
 * @param {string} birthDateString - 'YYYY-MM-DD'
 * @returns {number} months
 */
export const calculateMonths = (birthDateString) => {
  if (!birthDateString) return 0;
  
  const today = new Date();
  const birth = new Date(birthDateString);
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  
  return months <= 0 ? 0 : months;
};