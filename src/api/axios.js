import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://face2-backend.onrender.com/api/data', 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default axiosInstance;