import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api/admin",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true,
});

export default axiosInstance;
