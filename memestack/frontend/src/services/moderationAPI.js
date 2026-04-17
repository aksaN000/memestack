// ============================================================================
// moderationAPI.js — compatibility re-export layer
// ----------------------------------------------------------------------------
// This file used to define its own axios instance and its own request/response
// interceptors. It has been consolidated into `services/api.js`, which is now
// the single source of truth for all API calls (one axios instance, one
// interceptor chain, one error shape).
//
// This file exists only to keep existing imports working:
//   import { submitReport } from '../services/moderationAPI';
//   import { getReports, getModerationDashboard, ... } from '../services/moderationAPI';
//
// Prefer importing from `services/api.js` directly in new code.
// ============================================================================

import { moderationAPI } from './api';

export const submitReport = (reportData) => moderationAPI.submitReport(reportData);

export const getReports = (filters = {}) => moderationAPI.getReports(filters);

export const reviewReport = (reportId, action, reason) =>
    moderationAPI.reviewReport(reportId, action, reason);

export const dismissReport = (reportId, reason) =>
    moderationAPI.dismissReport(reportId, reason);

// Legacy name kept for ModerationDashboard.js — prefer moderationAPI.getDashboard().
export const getModerationDashboard = () => moderationAPI.getDashboard();

export const warnUser = (userId, reason, reportId) =>
    moderationAPI.warnUser(userId, reason, reportId);

export const suspendUser = (userId, reason, days, reportId) =>
    moderationAPI.suspendUser(userId, reason, days, reportId);

export const banUser = (userId, reason, reportId) =>
    moderationAPI.banUser(userId, reason, reportId);

export const unbanUser = (userId) => moderationAPI.unbanUser(userId);

export default moderationAPI;
