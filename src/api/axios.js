import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3030/api/data', 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default axiosInstance;