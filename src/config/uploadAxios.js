import axios from "axios";

const UPLOAD_API_URL =
  process.env.NEXT_PUBLIC_APACHE_UPLOAD_URL ?? "https://www.todayfridge.today/upload_commu_image.php";
  process.env.NEXT_PUBLIC_UPLOAD_API_URL ?? "https://www.todayfridge.today/upload_fridge_image.php";

const uploadApi = axios.create({
  // 로컬/서버 모두 환경변수 우선, 미설정 시 개발 기본값 사용
  baseURL: UPLOAD_API_URL,
});

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 기존 axios.js와 동일한 방식으로 에러 정규화
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = data?.error ?? error?.message ?? "Upload API error";
    
    const normalizedError = {
      name: "UploadApiError",
      message,
      status: status ?? null,
      data: data ?? null,
      originalError: error ?? null,
    };

    return Promise.reject(normalizedError);
  }
);

export default uploadApi;
