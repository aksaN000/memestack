// ============================================================================
// folderAPI.js — compatibility re-export layer
// ----------------------------------------------------------------------------
// Consolidated into `services/api.js`. This file used to define its own axios
// instance; now all folder calls go through the shared API client with unified
// auth/error handling.
//
// Existing named imports remain supported. Prefer importing `foldersAPI` from
// `services/api.js` in new code.
// ============================================================================

import { foldersAPI } from './api';

export const createFolder = (folderData) => foldersAPI.createFolder(folderData);

export const getUserFolders = (params = {}) => foldersAPI.getFolders(params);

export const getFolder = (folderId) => foldersAPI.getFolderById(folderId);

export const updateFolder = (folderId, folderData) =>
    foldersAPI.updateFolder(folderId, folderData);

export const deleteFolder = (folderId) => foldersAPI.deleteFolder(folderId);

export const addMemeToFolder = (folderId, memeId) =>
    foldersAPI.addMemeToFolder(folderId, memeId);

export const removeMemeFromFolder = (folderId, memeId) =>
    foldersAPI.removeMemeFromFolder(folderId, memeId);

export const bulkAddMemesToFolder = (folderId, memeIds) =>
    foldersAPI.bulkAddMemesToFolder(folderId, memeIds);

export const generateShareLink = (folderId) => foldersAPI.generateShareLink(folderId);

export const getSharedFolder = (token) => foldersAPI.getSharedFolder(token);

export default foldersAPI;
