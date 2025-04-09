import axios from 'axios';
import axiosRetry from 'axios-retry';

const axiosInstance = axios.create({
  baseURL: 'https://face2-backend.onrender.com/api/data',
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  },
  withCredentials: true,
});

// Retry failed requests up to 3 times with exponential backoff
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Wait 1s, 2s, 3s before retrying
  },
  shouldResetTimeout: true,
});

export default axiosInstance;