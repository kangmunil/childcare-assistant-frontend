import axios from 'axios';
import useStore from '../store/useStore';

// 1. Axios 인스턴스 생성 (기지국 설정)
// 백엔드 주소가 아직 없으면 로컬호스트(8080)를 기본값으로 둠
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5초 안에 응답 없으면 에러 처리 (무한 대기 방지)
});

// 2. 요청 인터셉터 (Request Interceptor)
// "편지 보낼 때마다 우표(토큰) 자동으로 붙이기"
client.interceptors.request.use(
  (config) => {
    // 스토어에서 토큰 가져오기 (Zustand는 컴포넌트 밖에서도 이렇게 조회 가능!)
    const { token } = useStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
// "편지 받을 때 미리 뜯어서 확인하기"
client.interceptors.response.use(
  (response) => {
    // 성공 시: 백엔드가 보내준 { status: "success", data: ... } 껍데기 벗기기
    // 바로 response.data를 반환하면 프론트에서 쓸 때 더 깔끔함
    return response.data;
  },
  (error) => {
    // 실패 시: 에러 코드별로 친절하게 대응하기
    if (error.response && error.response.data) {
      const { code, message } = error.response.data;

      // 인증 관련 에러 3형제 처리 (강제 로그아웃)
      // AUTH_001: 권한 없음 (토큰 없음 등)
      // AUTH_008: 토큰 만료 (Time's up)
      // AUTH_009: 유효하지 않은 토큰 (위조/변조)
      if (code === 'AUTH_001' || code === 'AUTH_008' || code === 'AUTH_009') {

        // 1. 스토어 상태 비우기 (로그아웃)
        useStore.getState().logout();

        // 2. 사용자 알림 (만료된 경우에만 친절하게)
        if (code === 'AUTH_008') {
          alert("로그인 시간이 만료되었습니다. 다시 로그인해주세요.");
        } else if (code === 'AUTH_009') {
          // 위조된 토큰일 경우 조용히 보내거나 보안 경고를 띄울 수 있음
          // 여기선 일단 조용히 로그인 페이지로 보냄
        }

        // 3. 로그인 페이지로 튕겨내기
        window.location.href = '/login';

        return Promise.reject(error);
      }

      // 권한 없음 (남의 자녀 접근 등)
      if (code && code.startsWith('ACCESS_')) {
        alert(message || '접근 권한이 없습니다.');
      }

      // 그 외 에러는 콘솔에 찍어두기
      console.error(`[API Error] ${code}: ${message}`);
    } else {
      console.error('[Network Error] 서버와 연결할 수 없습니다.');
    }

    return Promise.reject(error);
  }
);

export default client;