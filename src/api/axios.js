import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api/admin",
  headers: {
    'Content-Type': 'application/json',
    'x-secret-key': 'IfiuH/ko+rh/P3xwIfo0e8YTN1INFpkTU0knvGJjMO'
  },
  withCredentials: true,
});

export default axiosInstance;
