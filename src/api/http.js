import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8080/api', 
  timeout: 5000,
});

// 요청 나갈 때마다 토큰 납치해서 헤더에 넣기
http.interceptors.request.use((config) => {
  // 로컬 스토리지에서 zustand가 저장한 데이터 꺼내기 (직접 접근이 가장 안전)
  // 이름 'bebehelper-storage'는 useStore의 persist name과 같아야 함
  const storage = localStorage.getItem('bebehelper-storage');
  
  if (storage) {
    const parsed = JSON.parse(storage);
    const token = parsed.state?.token; // 토큰 꺼내기
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default http;