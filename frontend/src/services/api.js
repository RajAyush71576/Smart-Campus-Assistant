import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Attendance
export const attendanceAPI = {
  mark: (data) => API.post('/attendance/mark', data),
  markBulk: (data) => API.post('/attendance/bulk', data),
  getStudentAttendance: (id = 'me') => API.get(`/attendance/student/${id}`),
  getAnalytics: (params) => API.get('/attendance/analytics', { params }),
  getStudents: () => API.get('/attendance/students'),
};

// Assignments
export const assignmentAPI = {
  upload: (formData) => API.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => API.get('/assignments', { params }),
  getOne: (id) => API.get(`/assignments/${id}`),
  trackDownload: (id) => API.post(`/assignments/${id}/download`),
  delete: (id) => API.delete(`/assignments/${id}`),
};

// Notices
export const noticeAPI = {
  create: (formData) => API.post('/notices', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => API.get('/notices', { params }),
  getOne: (id) => API.get(`/notices/${id}`),
  update: (id, data) => API.put(`/notices/${id}`, data),
  delete: (id) => API.delete(`/notices/${id}`),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
  getFacultyStats: () => API.get('/notifications/dashboard/faculty'),
};

// Chatbot
export const chatbotAPI = {
  sendMessage: (message) => API.post('/chatbot/message', { message }),
  getSuggestions: () => API.get('/chatbot/suggestions'),
};

export default API;
