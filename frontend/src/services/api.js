import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';

// Safety check: Ensure the URL is absolute in production
if (baseURL && !baseURL.startsWith('http') && baseURL.includes('.')) {
  baseURL = `https://${baseURL}`;
}

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Optionally redirect to login
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Ensure the baseURL doesn't have a trailing slash and the path has a leading slash
  const cleanBaseURL = baseURL.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBaseURL}${cleanPath}`;
};

export default api;

// Guest services
export const guestService = {
  // Get guest by unique code
  getByCode: (code) => api.get(`/guests/code/${code}`),
  
  // Submit RSVP
  submitRSVP: (code, data) => api.post(`/guests/code/${code}/rsvp`, data),
  
  // Get all guests (admin)
  getAll: (params) => api.get('/guests', { params }),
  
  // Create guest
  create: (data) => api.post('/guests', data),
  
  // Update guest
  update: (id, data) => api.put(`/guests/${id}`, data),
  
  // Delete guest
  delete: (id) => api.delete(`/guests/${id}`),

  // Mark WhatsApp invite sent
  markWhatsappInvite: (id) => api.post(`/guests/${id}/whatsapp-invite`),
  
  // Import guests from Excel
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/guests/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Validate import and find conflicts
  validateImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/guests/validate-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Confirm import with resolutions
  confirmImport: (data) => api.post('/guests/import-confirm', data),
  
  // Export guests to Excel
  export: () => api.get('/guests/export', { responseType: 'blob' }),

  // Get guest statistics
  getStats: () => api.get('/guests/statistics'),

  // Bulk update guests
  bulkUpdate: (ids, data) => api.post('/guests/bulk-update', { ids, data }),
};

// Event/Schedule services
export const scheduleService = {
  // Get event schedule (Events list for Admin)
  getSchedule: () => api.get('/schedule/events'),

  // Get timeline (Items list for Public Programme)
  getTimeline: () => api.get('/schedule/full'),
  
  // Get live updates
  getLiveUpdates: () => api.get('/schedule/updates'),
  
  // Update schedule item (admin)
  updateItem: (id, data) => api.put(`/schedule/items/${id}`, data),

  // Delete schedule item (admin)
  deleteItem: (id) => api.delete(`/schedule/items/${id}`),
  
  // Add schedule item (admin)
  createItem: (eventId, data) => api.post(`/schedule/events/${eventId}/items`, data),

  // Create event (admin)
  createEvent: (data) => api.post('/schedule/events', data),

  // Update event (admin)
  updateEvent: (id, data) => api.put(`/schedule/events/${id}`, data),

  // Delete event (admin)
  deleteEvent: (id) => api.delete(`/schedule/events/${id}`),
  
  // Post live update (admin)
  postUpdate: (data) => api.post('/schedule/updates', data),
};

// Gift registry services
export const giftService = {
  // Get all gifts
  getAll: () => api.get('/gifts'),
  
  // Claim a gift
  claim: (id, data) => api.post(`/gifts/${id}/claim`, data),
  
  // Create gift (admin)
  create: (data) => api.post('/gifts', data),
  
  // Update gift (admin)
  update: (id, data) => api.put(`/gifts/${id}`, data),
  
  // Delete gift (admin)
  delete: (id) => api.delete(`/gifts/${id}`),

  // Get gift statistics
  getStats: () => api.get('/gifts/statistics'),
};

// Table services (Seating Chart)
export const tableService = {
  getAll: () => api.get('/tables'),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
  assignGuest: (tableId, guestId) => api.post(`/tables/${tableId}/assign`, { guest_id: guestId }),
  unassignGuest: (guestId) => api.post(`/tables/guests/${guestId}/unassign`),
};

// Gallery services
export const galleryService = {
  getAll: () => api.get('/gallery'),
  create: (data) => api.post('/gallery', data),
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`),
  reorder: (items) => api.post('/gallery/reorder', { items }),
};

// CMS / Content services
export const contentService = {
  getAll: () => api.get('/content'),
  get: (key) => api.get(`/content/${key}`),
  update: (key, data) => api.post(`/content/${key}`, data),
  uploadMedia: (formData) => api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Settings services
export const settingService = {
  // Get all settings
  getAll: () => api.get('/settings'),
  
  // Update settings
  update: (settings) => api.post('/settings', { settings }),
};

// Invitation services
export const invitationService = {
  // Send invitation email
  send: (guestId, data) => api.post(`/invitations/${guestId}/send`, data),
  
  // Send bulk invitations
  sendBulk: (guestIds) => api.post('/invitations/send-bulk', { guest_ids: guestIds }),
  
  // Resend invitation
  resend: (guestId) => api.post(`/invitations/${guestId}/resend`),
};

// 2FA services
export const twoFactorService = {
  setup: () => api.post('/2fa/setup'),
  confirm: (code) => api.post('/2fa/confirm', { code }),
  disable: () => api.post('/2fa/disable'),
  verify: (email, code) => api.post('/verify-2fa', { email, code }),
};


// Notification services
export const notificationService = {
  getRecent: () => api.get('/notifications'),
  markAllRead: () => api.post('/notifications/mark-read'),
};

// Song Request Admin services
export const songRequestService = {
  getAll: () => api.get('/song-requests'),
  markPlayed: (id) => api.patch(`/song-requests-admin/${id}/played`),
  delete: (id) => api.delete(`/song-requests-admin/${id}`),
};

// Guestbook Admin services
export const guestbookService = {
  getAll: () => api.get('/guestbook'),
  approve: (id) => api.patch(`/guestbook-admin/${id}/approve`),
  delete: (id) => api.delete(`/guestbook-admin/${id}`),
};

// FAQ services
export const faqService = {
  getAll: () => api.get('/faqs'),
  create: (data) => api.post('/faqs', data),
  update: (id, data) => api.put(`/faqs/${id}`, data),
  delete: (id) => api.delete(`/faqs/${id}`),
  reorder: (faqs) => api.post('/faqs/reorder', { faqs }),
  uploadMedia: (formData) => api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  })
};
