import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://crm-live-pro-server.onrender.com/api/admin",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true,
});

export default axiosInstance;
