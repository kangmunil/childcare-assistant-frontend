import client from './client';

// 회원 관련 API 모음
export const authApi = {
  /**
   * 회원가입
   * @param {Object} data - { id, password, name }
   * 명세서에는 Path Param으로 되어 있으나, 보안상 Body가 맞으므로 Body로 전송함.
   */
  register: async (data) => {
    // POST 요청은 두 번째 인자가 Body(Payload)
    const response = await client.post('/api/auth/register', data);
    return response; 
    // client.js 인터셉터 덕분에 response.data가 바로 리턴됨
    // 성공 시: { accessToken: "...", user: { ... } } 반환
  },

  /**
   * 로그인
   * @param {Object} data - { id, password }
   */
  login: async (data) => {
    const response = await client.post('/api/auth/login', data);
    return response;
  },

  /**
   * 내 정보 조회 (토큰 필요)
   * client.js 인터셉터가 토큰을 자동으로 헤더에 넣어주므로 별도 처리 불필요
   */
  getMe: async () => {
    const response = await client.get('/api/members/me');
    return response;
  }
};