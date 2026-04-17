// ============================================================================
// TemplateManager — browse, create, edit, and delete meme templates.
// ----------------------------------------------------------------------------
// PageHeader with CTA + filter bar + template grid. Cards show template
// thumbnail, name, category, privacy, usage count, and creator. Owners get a
// context menu with edit/delete actions. Dialogs handle create/edit/delete.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Category as CategoryIcon,
    CloudUpload as CloudUploadIcon,
    Collections as CollectionsIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { templatesAPI } from '../services/api';
import { PageHeader, EmptyState, SkeletonCard } from '../components/common';

// ---------------------------------------------------------------------------
// Utility — resolve a template image URL to an absolute path if needed.
const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads')) {
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const serverURL = baseURL.replace('/api', '');
        return `${serverURL}${imageUrl}`;
    }
    return imageUrl;
};

const emptyForm = {
    name: '',
    category: 'general',
    description: '',
    isPublic: false,
    image: null,
};

const TemplateManager = () => {
    const theme = useTheme();
    const { user } = useAuth();

    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMine, setShowMine] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [anchorEl, setAnchorEl] = useState(null);

    // ------------------------------------------------------------------ load
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const params = {
                    page,
                    limit: 12,
                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                    search: searchTerm || undefined,
                };
                const response = showMine
                    ? await templatesAPI.getUserTemplates(params)
                    : await templatesAPI.getTemplates(params);
                if (cancelled) return;
                setTemplates(response.templates || []);
                setTotalPages(response.pagination?.totalPages || 1);
            } catch (e) {
                if (!cancelled) setError(e.message || 'Failed to load templates');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, selectedCategory, searchTerm, showMine]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const response = await templatesAPI.getCategories();
                if (!cancelled) setCategories(response.categories || []);
            } catch {
                /* non-fatal */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // --------------------------------------------------------------- actions
    const resetForm = () => {
        setFormData(emptyForm);
        setSelectedTemplate(null);
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('category', formData.category);
        fd.append('description', formData.description);
        fd.append('isPublic', formData.isPublic);
        if (formData.image) fd.append('image', formData.image);
        return fd;
    };

    const handleCreate = async () => {
        try {
            await templatesAPI.createTemplate(buildFormData());
            setSuccess('Template created successfully.');
            setCreateOpen(false);
            resetForm();
            // Bump filters to trigger refetch
            setPage((p) => (p === 1 ? 1 : 1));
            setSelectedCategory((c) => c);
        } catch (e) {
            setError(e.message || 'Failed to create template');
        }
    };

    const handleUpdate = async () => {
        if (!selectedTemplate) return;
        try {
            await templatesAPI.updateTemplate(selectedTemplate._id, buildFormData());
            setSuccess('Template updated.');
            setEditOpen(false);
            resetForm();
            setPage((p) => p);
        } catch (e) {
            setError(e.message || 'Failed to update template');
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;
        try {
            await templatesAPI.deleteTemplate(selectedTemplate._id);
            setSuccess('Template deleted.');
            setDeleteOpen(false);
            resetForm();
            setPage((p) => p);
        } catch (e) {
            setError(e.message || 'Failed to delete template');
        }
    };

    const openEditDialog = (template) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            category: template.category,
            description: template.description || '',
            isPublic: template.isPublic,
            image: null,
        });
        setEditOpen(true);
    };

    const openDeleteDialog = (template) => {
        setSelectedTemplate(template);
        setDeleteOpen(true);
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            return;
        }
        setFormData((prev) => ({ ...prev, image: file }));
    };

    const canEdit = (template) =>
        user && template?.creator && template.creator._id === user._id;

    // -------------------------------------------------------------- rendering
    const renderCard = (template) => (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.sm,
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: theme.tokens?.shadow?.md,
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    background: theme.palette.brand?.surfaceSubtle || theme.palette.action.hover,
                    borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                }}
            >
                <img
                    src={getImageUrl(template.imageUrl)}
                    alt={template.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
                {canEdit(template) && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedTemplate(template);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: theme.palette.background.paper,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            '&:hover': { background: theme.palette.background.paper },
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1rem' }} noWrap>
                    {template.name}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 36,
                    }}
                >
                    {template.description || 'No description'}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    <Chip
                        icon={<CategoryIcon />}
                        label={template.category}
                        size="small"
                        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                    {template.isPublic ? (
                        <Chip
                            icon={<VisibilityIcon />}
                            label="Public"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700 }}
                        />
                    ) : (
                        <Chip
                            icon={<VisibilityOffIcon />}
                            label="Private"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                        />
                    )}
                </Stack>

                <Box
                    sx={{
                        mt: 'auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: 1,
                        borderTop: `1px dashed ${theme.palette.brand?.border || theme.palette.divider}`,
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Used {template.usageCount || 0}×
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                        noWrap
                    >
                        @{template.creator?.username || 'unknown'}
                    </Typography>
                </Box>

                <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    onClick={() =>
                        window.open(`/meme-creator?template=${template._id}`, '_blank')
                    }
                    sx={{ mt: 1.5, fontWeight: 800 }}
                >
                    Use Template
                </Button>
            </Box>
        </Box>
    );

    const renderDialogBody = (isEdit) => (
        <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
                fullWidth
                label="Template name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
            />
            <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                    {(categories.length ? categories : ['general']).map((cat) => (
                        <MenuItem key={cat} value={cat} sx={{ textTransform: 'capitalize' }}>
                            {cat}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={formData.isPublic}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    />
                }
                label="Make this template public"
            />
            <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ fontWeight: 800 }}
            >
                {isEdit ? 'Replace image (optional)' : 'Upload template image'}
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </Button>
            {formData.image && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Selected: {formData.image.name}
                </Typography>
            )}
        </Stack>
    );

    return (
        <Box>
            <PageHeader
                eyebrow="TEMPLATES"
                title="Your template library"
                subtitle="Upload, edit, and share the starting points for every meme you make."
                icon={<CollectionsIcon />}
                actions={
                    user && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                resetForm();
                                setCreateOpen(true);
                            }}
                            sx={{ fontWeight: 900 }}
                        >
                            New template
                        </Button>
                    )
                }
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.sm,
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                placeholder="Search templates…"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    label="Category"
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="all">All categories</MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat} value={cat} sx={{ textTransform: 'capitalize' }}>
                                            {cat}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {user && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showMine}
                                            onChange={(e) => {
                                                setShowMine(e.target.checked);
                                                setPage(1);
                                            }}
                                        />
                                    }
                                    label="My templates"
                                />
                            )}
                        </Grid>
                    </Grid>
                </Box>

                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : templates.length === 0 ? (
                    <EmptyState
                        icon={<CollectionsIcon sx={{ fontSize: 48 }} />}
                        title="No templates yet"
                        description={
                            showMine
                                ? 'Upload your first template to get started.'
                                : 'Try a different search or category — or add one yourself.'
                        }
                        action={
                            user && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        resetForm();
                                        setCreateOpen(true);
                                    }}
                                >
                                    New template
                                </Button>
                            )
                        }
                    />
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {templates.map((t) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={t._id}>
                                    {renderCard(t)}
                                </Grid>
                            ))}
                        </Grid>

                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_, p) => setPage(p)}
                                    color="primary"
                                    size="large"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem
                    onClick={() => {
                        openEditDialog(selectedTemplate);
                        setAnchorEl(null);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit template</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        openDeleteDialog(selectedTemplate);
                        setAnchorEl(null);
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>Delete template</ListItemText>
                </MenuItem>
            </Menu>

            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Create template</DialogTitle>
                <DialogContent>{renderDialogBody(false)}</DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!formData.name || !formData.image}
                        sx={{ fontWeight: 800 }}
                    >
                        Create template
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Edit template</DialogTitle>
                <DialogContent>{renderDialogBody(true)}</DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpdate}
                        variant="contained"
                        disabled={!formData.name}
                        sx={{ fontWeight: 800 }}
                    >
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle sx={{ fontWeight: 900 }}>Delete template?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete{' '}
                        <strong>"{selectedTemplate?.name}"</strong>? This action cannot be
                        undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        sx={{ fontWeight: 800 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TemplateManager;
