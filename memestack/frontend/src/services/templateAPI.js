// ============================================================================
// templateAPI.js — compatibility re-export layer
// ----------------------------------------------------------------------------
// Consolidated into `services/api.js`. Prefer `import { templatesAPI } from
// '../services/api';` in new code.
// ============================================================================

import { templatesAPI } from './api';

export const getTemplates = (params = {}) => templatesAPI.getTemplates(params);

export const getTemplateById = (templateId) => templatesAPI.getTemplateById(templateId);

export const createTemplate = (templateData) => templatesAPI.createTemplate(templateData);

export const updateTemplate = (templateId, templateData) =>
    templatesAPI.updateTemplate(templateId, templateData);

export const deleteTemplate = (templateId) => templatesAPI.deleteTemplate(templateId);

export const getTemplateCategories = () => templatesAPI.getCategories();

export const getUserTemplates = (params = {}) => templatesAPI.getUserTemplates(params);

export default {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateCategories,
    getUserTemplates,
};
