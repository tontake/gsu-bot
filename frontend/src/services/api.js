import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  googleRedirect: () => `${API_URL}/auth/google/redirect`,
  resetPasswordUnauth: (data) =>
    api.post("/auth/reset-password-unauthenticated", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  setSecurityCode: (data) => api.post("/auth/set-security-code", data),
  acknowledgeSecurityCode: () => api.post("/auth/acknowledge-security-code"),
};

// Onboarding
export const onboardingApi = {
  complete: (data) => api.post("/onboarding/complete", data),
};

// Chat
export const chatApi = {
  send: (data) => api.post("/chat/send", data),
  sessions: () => api.get("/chat/sessions"),
  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  deleteAllSessions: () => api.delete("/chat/sessions"),
};

// Tickets
export const ticketApi = {
  create: (data) => api.post("/tickets", data),
  list: (params) => api.get("/tickets", { params }),
  get: (id) => api.get(`/tickets/${id}`),
  show: (id) => api.get(`/tickets/${id}`),
  reply: (id, data) => api.post(`/tickets/${id}/reply`, data),
};

// Notifications
export const notificationApi = {
  list: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// Admin
export const adminApi = {
  // Knowledge Base
  knowledgeBase: {
    list: (params) => api.get("/admin/knowledge-base", { params }),
    create: (data) => api.post("/admin/knowledge-base", data),
    update: (id, data) => api.put(`/admin/knowledge-base/${id}`, data),
    delete: (id) => api.delete(`/admin/knowledge-base/${id}`),
  },
  // Knowledge Sources
  knowledgeSources: {
    list: (params) => api.get("/admin/knowledge-sources", { params }),
    create: (data) => api.post("/admin/knowledge-sources", data),
    update: (id, data) => api.put(`/admin/knowledge-sources/${id}`, data),
    delete: (id) => api.delete(`/admin/knowledge-sources/${id}`),
  },
  // Data Sources (MySQL database connections)
  dataSources: {
    tables: (params) => api.get("/admin/data-sources/tables", { params }),
    columns: (table, params) =>
      api.get(`/admin/data-sources/tables/${table}/columns`, { params }),
    configure: (data) => api.post("/admin/data-sources/configure", data),
    test: (data) => api.post("/admin/data-sources/test", data),
    testConnection: (data) =>
      api.post("/admin/data-sources/test-connection", data),
    crawl: (data) => api.post("/admin/data-sources/crawl", data),
  },
  // Tickets
  tickets: {
    list: (params) => api.get("/admin/tickets", { params }),
    show: (id) => api.get(`/admin/tickets/${id}`),
    reply: (id, data) => api.put(`/admin/tickets/${id}/reply`, data),
    updateStatus: (id, data) => api.put(`/admin/tickets/${id}/status`, data),
  },
  // Users
  users: {
    list: (params) => api.get("/admin/users", { params }),
    create: (data) => api.post("/admin/users", data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
    generateSecurityCode: (id) =>
      api.post(`/admin/users/${id}/generate-security-code`),
    importCsv: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post("/admin/users/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  },
  // Dashboard
  dashboard: () => api.get("/admin/dashboard/stats"),
  // FAQ Analytics
  faqAnalytics: {
    list: () => api.get("/admin/faq-analytics"),
    enhance: (id) => api.post(`/admin/faq-analytics/${id}/enhance`),
  },
  // Settings
  settings: {
    get: () => api.get("/admin/settings"),
    update: (data) => api.put("/admin/settings", data),
  },
  // Audit Log
  auditLog: (params) => api.get("/admin/audit-log", { params }),
};

export default api;
