// ==========================================================================
// MemeStack API client — single source of truth for backend calls.
//
// One axios instance, one auth interceptor, one 401 handler. All feature
// API surfaces (auth / memes / templates / collaborations / …) are grouped
// below and share the same instance.
//
// Every method returns the parsed response body (success + data + etc),
// and throws a normalized { message, status, data } object on failure so
// callers can always `catch (err) { setError(err.message) }`.
// ==========================================================================

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
    baseURL: API_URL,
    timeout: 20000,
    headers: { 'Content-Type': 'application/json' },
});

// ---- request interceptor -------------------------------------------------
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ---- response interceptor ------------------------------------------------
// Normalizes the error shape and handles expired tokens centrally.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network / CORS / offline
        if (!error.response) {
            return Promise.reject({
                message:
                    error.code === 'ECONNABORTED'
                        ? 'Request timed out. Please try again.'
                        : 'Unable to reach the server. Check your connection and try again.',
                status: 0,
                data: null,
            });
        }

        // Expired / invalid token → log out
        if (error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject({
            message:
                error.response.data?.message ||
                (error.response.status >= 500
                    ? 'Something broke on our end. Please try again shortly.'
                    : 'Request failed.'),
            status: error.response.status,
            data: error.response.data || null,
        });
    },
);

// Helper: unwrap `response.data` while preserving the original
// {success, data, …} envelope so callers can read either shape.
const unwrap = (promise) => promise.then((r) => r.data);

// ==========================================================================
// AUTH
// ==========================================================================
export const authAPI = {
    register: async (userData) => {
        const data = await unwrap(API.post('/auth/register', userData));
        if (data?.success && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    login: async (credentials) => {
        const loginData = {
            identifier: credentials.email || credentials.identifier,
            password: credentials.password,
        };
        const data = await unwrap(API.post('/auth/login', loginData));
        if (data?.success && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    logout: async () => {
        try {
            await API.post('/auth/logout');
        } catch (_) {
            // ignore — local state still gets cleared below
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getProfile: () => unwrap(API.get('/auth/profile')),
    updateProfile: async (profileData) => {
        const data = await unwrap(API.put('/auth/profile', profileData));
        if (data?.success && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },
};

// ==========================================================================
// MEMES
// ==========================================================================
export const memeAPI = {
    getAllMemes: (params = {}) => unwrap(API.get('/memes', { params })),
    getTrendingMemes: (limit = 10) => unwrap(API.get('/memes/trending', { params: { limit } })),
    getMemesByCategory: (category, params = {}) => unwrap(API.get(`/memes/category/${category}`, { params })),
    getMemeById: (id) => unwrap(API.get(`/memes/${id}`)),
    createMeme: (memeData) => unwrap(API.post('/memes', memeData)),
    updateMeme: (id, memeData) => unwrap(API.put(`/memes/${id}`, memeData)),
    deleteMeme: (id) => unwrap(API.delete(`/memes/${id}`)),
    toggleLike: (id) => unwrap(API.post(`/memes/${id}/like`)),
    shareMeme: (id) => unwrap(API.post(`/memes/${id}/share`)),
    downloadMeme: (id) => API.get(`/memes/${id}/download`, { responseType: 'blob' }),
    getMyMemes: (includePrivate = true) => unwrap(API.get('/memes/my-memes', { params: { includePrivate } })),
    getUserMemes: (userId = null) =>
        unwrap(API.get(userId ? `/memes/user/${userId}` : '/memes/my-memes')),
    getStats: () => unwrap(API.get('/memes/stats')),
};

// ==========================================================================
// UPLOADS
// ==========================================================================
const withProgress = (onUploadProgress) =>
    onUploadProgress
        ? {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (e) => {
                  if (e.total) onUploadProgress(Math.round((e.loaded * 100) / e.total));
              },
          }
        : { headers: { 'Content-Type': 'multipart/form-data' } };

export const uploadAPI = {
    uploadMeme: (file, onUploadProgress) => {
        const fd = new FormData();
        fd.append('meme', file);
        return unwrap(API.post('/upload/meme', fd, withProgress(onUploadProgress)));
    },
    uploadAvatar: (file, onUploadProgress) => {
        const fd = new FormData();
        fd.append('avatar', file);
        return unwrap(API.post('/upload/avatar', fd, withProgress(onUploadProgress)));
    },
    getHealth: () => unwrap(API.get('/upload/health')),
};

// ==========================================================================
// FOLLOWS
// ==========================================================================
export const followAPI = {
    followUser: (userId) => unwrap(API.post(`/follows/${userId}`)),
    unfollowUser: (userId) => unwrap(API.delete(`/follows/${userId}`)),
    getFollowStatus: (userId) => unwrap(API.get(`/follows/${userId}/status`)),
    getFollowers: (userId, params = {}) => unwrap(API.get(`/follows/${userId}/followers`, { params })),
    getFollowing: (userId, params = {}) => unwrap(API.get(`/follows/${userId}/following`, { params })),
    getFollowingFeed: (params = {}) => unwrap(API.get('/follows/feed', { params })),
};

// ==========================================================================
// TEMPLATES
// ==========================================================================
const templateFormData = (templateData) => {
    const fd = new FormData();
    if (templateData.image) fd.append('image', templateData.image);
    if (templateData.name) fd.append('name', templateData.name);
    if (templateData.category) fd.append('category', templateData.category);
    if (templateData.description !== undefined) fd.append('description', templateData.description);
    if (templateData.textAreas) fd.append('textAreas', JSON.stringify(templateData.textAreas));
    if (templateData.dimensions) fd.append('dimensions', JSON.stringify(templateData.dimensions));
    if (templateData.isPublic !== undefined) fd.append('isPublic', templateData.isPublic ? 'true' : 'false');
    return fd;
};

export const templatesAPI = {
    getTemplates: (params = {}) => unwrap(API.get('/templates', { params })),
    getTemplateById: (id) => unwrap(API.get(`/templates/${id}`)),
    createTemplate: (templateData) =>
        unwrap(
            API.post('/templates', templateFormData(templateData), {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        ),
    updateTemplate: (id, templateData) =>
        unwrap(
            API.put(`/templates/${id}`, templateFormData(templateData), {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        ),
    deleteTemplate: (id) => unwrap(API.delete(`/templates/${id}`)),
    getCategories: () => unwrap(API.get('/templates/categories')),
    getUserTemplates: (params = {}) => unwrap(API.get('/templates/my-templates', { params })),
    getTrending: () => unwrap(API.get('/templates/trending')),
    getFavoriteTemplates: () => unwrap(API.get('/templates/favorites')),
    favoriteTemplate: (id) => unwrap(API.post(`/templates/${id}/favorite`)),
    unfavoriteTemplate: (id) => unwrap(API.delete(`/templates/${id}/favorite`)),
    rateTemplate: (id, rating) => unwrap(API.post(`/templates/${id}/rate`, { rating })),
    downloadTemplate: (id) => API.get(`/templates/${id}/download`, { responseType: 'blob' }),
    trackTemplateUsage: (id) => unwrap(API.post(`/templates/${id}/use`)),
};

// ==========================================================================
// USERS
// ==========================================================================
export const userAPI = {
    getUsers: (params = {}) => unwrap(API.get('/users', { params })),
    getUserById: (userId) => unwrap(API.get(`/users/${userId}`)),
};

// ==========================================================================
// ANALYTICS
// ==========================================================================
export const analyticsAPI = {
    getDashboard: (timeRange = '30') => unwrap(API.get('/analytics/dashboard', { params: { timeRange } })),
    getMemeAnalytics: (memeId) => unwrap(API.get(`/analytics/meme/${memeId}`)),
    getPlatformAnalytics: () => unwrap(API.get('/analytics/platform')),
};

// ==========================================================================
// FOLDERS
// ==========================================================================
export const foldersAPI = {
    getFolders: (params = {}) => unwrap(API.get('/folders', { params })),
    getFolderById: (id) => unwrap(API.get(`/folders/${id}`)),
    createFolder: (folderData) => unwrap(API.post('/folders', folderData)),
    updateFolder: (id, folderData) => unwrap(API.put(`/folders/${id}`, folderData)),
    deleteFolder: (id) => unwrap(API.delete(`/folders/${id}`)),
    addMemeToFolder: (folderId, memeId) => unwrap(API.post(`/folders/${folderId}/memes/${memeId}`)),
    removeMemeFromFolder: (folderId, memeId) => unwrap(API.delete(`/folders/${folderId}/memes/${memeId}`)),
    bulkAddMemesToFolder: (folderId, memeIds) => unwrap(API.post(`/folders/${folderId}/memes/bulk`, { memeIds })),
    generateShareLink: (folderId) => unwrap(API.post(`/folders/${folderId}/share`)),
    getSharedFolder: (token) => unwrap(API.get(`/folders/shared/${token}`)),
};

// ==========================================================================
// COMMENTS
// ==========================================================================
export const commentsAPI = {
    getComments: (memeId, options = {}) => unwrap(API.get(`/comments/memes/${memeId}/comments`, { params: options })),
    addComment: (memeId, commentData) => unwrap(API.post(`/comments/memes/${memeId}/comments`, commentData)),
    updateComment: (commentId, commentData) => unwrap(API.put(`/comments/${commentId}`, commentData)),
    deleteComment: (commentId) => unwrap(API.delete(`/comments/${commentId}`)),
    toggleLikeComment: (commentId) => unwrap(API.post(`/comments/${commentId}/like`)),
    getReplies: (commentId, options = {}) => unwrap(API.get(`/comments/${commentId}/replies`, { params: options })),
    reportComment: (commentId, reportData) => unwrap(API.post(`/comments/${commentId}/report`, reportData)),
    getUserComments: (userId, options = {}) => unwrap(API.get(`/comments/users/${userId}/comments`, { params: options })),
};

// ==========================================================================
// MODERATION
// ==========================================================================
export const moderationAPI = {
    submitReport: (reportData) => unwrap(API.post('/moderation/report', reportData)),
    getReports: (filters = {}) => unwrap(API.get('/moderation/reports', { params: filters })),
    reviewReport: (reportId, action, reason) =>
        unwrap(API.put(`/moderation/reports/${reportId}/review`, { action, reason })),
    dismissReport: (reportId, reason) => unwrap(API.put(`/moderation/reports/${reportId}/dismiss`, { reason })),
    getDashboard: () => unwrap(API.get('/moderation/dashboard')),
    warnUser: (userId, reason, reportId) => unwrap(API.post(`/moderation/users/${userId}/warn`, { reason, reportId })),
    suspendUser: (userId, reason, days, reportId) =>
        unwrap(API.post(`/moderation/users/${userId}/suspend`, { reason, days, reportId })),
    banUser: (userId, reason, reportId) => unwrap(API.post(`/moderation/users/${userId}/ban`, { reason, reportId })),
    unbanUser: (userId) => unwrap(API.post(`/moderation/users/${userId}/unban`)),
};

// ==========================================================================
// GROUPS
// ==========================================================================
export const groupsAPI = {
    getGroups: (options = {}) => unwrap(API.get('/groups', { params: options })),
    getTrending: () => unwrap(API.get('/groups/trending')),
    getUserGroups: () => unwrap(API.get('/groups/user/groups')),
};

// ==========================================================================
// CHALLENGES
// ==========================================================================
export const challengesAPI = {
    getChallenges: (options = {}) => unwrap(API.get('/challenges', { params: options })),
    getTrending: () => unwrap(API.get('/challenges/trending')),
    getUserChallenges: () => unwrap(API.get('/challenges/user/challenges')),
};

// ==========================================================================
// COLLABORATIONS
// ==========================================================================
export const collaborationsAPI = {
    getCollaborations: (options = {}) => unwrap(API.get('/collaborations', { params: options })),
    getTrending: () => unwrap(API.get('/collaborations/trending')),
    getUserCollaborations: () => unwrap(API.get('/collaborations/user/collaborations')),
    getCollaborationById: (id) => unwrap(API.get(`/collaborations/${id}`)),
    createCollaboration: (collaborationData) => unwrap(API.post('/collaborations', collaborationData)),
    updateCollaboration: (id, updates) => unwrap(API.put(`/collaborations/${id}`, updates)),
    joinCollaboration: (id, message = '') => unwrap(API.post(`/collaborations/${id}/join`, { message })),
    inviteUser: (id, username, role = 'contributor', message = '') =>
        unwrap(API.post(`/collaborations/${id}/invite`, { username, role, message })),
    createVersion: (id, versionData) => unwrap(API.post(`/collaborations/${id}/versions`, versionData)),
    forkCollaboration: (id, title) => {
        const body = title && title.trim() ? { title: title.trim() } : {};
        return unwrap(API.post(`/collaborations/${id}/fork`, body));
    },
    addComment: (id, commentData) => unwrap(API.post(`/collaborations/${id}/comments`, commentData)),
    removeCollaborator: (id, collaboratorId) => unwrap(API.delete(`/collaborations/${id}/collaborators/${collaboratorId}`)),
    updateCollaboratorRole: (id, collaboratorId, role) =>
        unwrap(API.put(`/collaborations/${id}/collaborators/${collaboratorId}/role`, { role })),
    acceptInvite: (id) => unwrap(API.post(`/collaborations/${id}/invites/accept`)),
    declineInvite: (id) => unwrap(API.post(`/collaborations/${id}/invites/decline`)),
    getPendingInvites: () => unwrap(API.get('/collaborations/user/invites')),
    getMemeRemixes: (memeId) => unwrap(API.get(`/collaborations/meme/${memeId}/remixes`)),
    deleteCollaboration: (id) => unwrap(API.delete(`/collaborations/${id}`)),

    // advanced
    getTemplates: async (category = null) => {
        const data = await unwrap(API.get('/collaborations/templates', { params: category ? { category } : {} }));
        return data?.templates || [];
    },
    createFromTemplate: (data) => unwrap(API.post('/collaborations/from-template', data)),
    getInsights: async (id) => {
        const data = await unwrap(API.get(`/collaborations/${id}/insights`));
        return data?.insights || null;
    },
    getActivity: (id, limit = 20) => unwrap(API.get(`/collaborations/${id}/activity`, { params: { limit } })),
    getStats: (id) => unwrap(API.get(`/collaborations/${id}/stats`)),
    trackActivity: (id, action, details = {}) =>
        unwrap(API.post(`/collaborations/${id}/track-activity`, { action, details })),
    mergeFork: (parentId, forkId, mergeOptions = {}) =>
        unwrap(API.post(`/collaborations/${parentId}/merge-fork`, { forkId, mergeOptions })),
    bulkOperations: (operation, collaborationIds, data = {}) =>
        unwrap(API.post('/collaborations/bulk-operations', { operation, collaborationIds, data })),
};

// ==========================================================================
// HEALTH
// ==========================================================================
export const healthAPI = {
    checkHealth: () => unwrap(API.get('/health')),
};

// ==========================================================================
// UTILITIES
// ==========================================================================
export const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export const isAuthenticated = () => !!(localStorage.getItem('token') && getCurrentUser());

export const getToken = () => localStorage.getItem('token');

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

/**
 * Pull a useful string out of whatever shape an error has.
 * Works with the normalized `{message}` thrown by the interceptor and
 * with stray raw-axios errors that may have slipped through.
 */
export const handleAPIError = (error) => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.request) return 'Network error. Please check your connection.';
    return 'An unexpected error occurred';
};

export default API;
