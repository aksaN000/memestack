// ============================================================================
// CreateMeme — upload, pick a template, or jump into the canvas.
// ----------------------------------------------------------------------------
// Two-pane flow:
//   1. Left pane: upload zone OR template preview, with drag & drop.
//   2. Right pane: metadata form (title, description, category, tags, privacy).
// The big "Edit in canvas" button uploads (or reuses a template URL) and hands
// control to <MemeEditor/>. A plain Publish button posts without editing.
//
// Templates are loaded via `?template=:id` search-param: when present we skip
// the upload step and pre-fill title + category.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    TextField,
    MenuItem,
    Typography,
    Stack,
    Chip,
    IconButton,
    Alert,
    LinearProgress,
    CircularProgress,
    Switch,
    FormControlLabel,
    InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    CloudUpload as UploadIcon,
    Palette as EditorIcon,
    Publish as PublishIcon,
    Close as CloseIcon,
    Tag as TagIcon,
    Image as ImageIcon,
    AutoAwesome as SparkleIcon,
    Replay as ResetIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { useMemes } from '../contexts/MemeContext';
import { uploadAPI, templatesAPI } from '../services/api';
import MemeEditor from '../components/MemeEditor';
import { PageHeader } from '../components/common';

const CATEGORIES = [
    { value: 'funny', label: 'Funny' },
    { value: 'reaction', label: 'Reaction' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'sports', label: 'Sports' },
    { value: 'political', label: 'Political' },
    { value: 'wholesome', label: 'Wholesome' },
    { value: 'dark', label: 'Dark' },
    { value: 'trending', label: 'Trending' },
    { value: 'custom', label: 'Custom' },
    { value: 'other', label: 'Other' },
];

const MAX_FILE_SIZE_MB = 10;

// Accept both absolute URLs and /uploads paths coming from older endpoints.
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
        const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${api.replace('/api', '')}${url}`;
    }
    return url;
};

const CreateMeme = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const { createMeme } = useMemes();

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'funny',
        isPublic: true,
    });
    const [tags, setTags] = useState([]);
    const [tagDraft, setTagDraft] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEditor, setShowEditor] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // ---- template pre-fill from URL query ---------------------------------
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const templateId = params.get('template');
        if (!templateId) return;

        let cancelled = false;
        (async () => {
            setLoadingTemplate(true);
            setError('');
            try {
                const resp = await templatesAPI.getTemplateById(templateId);
                const tpl = resp?.template || resp?.data?.template || resp?.data;
                if (!tpl) throw new Error('Template not found');
                const imageUrl = resolveImageUrl(tpl.imageUrl);
                if (!imageUrl) throw new Error('Template has no image');
                if (cancelled) return;
                setSelectedTemplate(tpl);
                setPreviewUrl(imageUrl);
                setUploadedUrl(imageUrl);
                setForm((prev) => ({
                    ...prev,
                    title: tpl.title ? `Based on: ${tpl.title}` : prev.title,
                    category: tpl.category || prev.category,
                }));
            } catch (err) {
                if (!cancelled) setError(err.message || 'Failed to load template');
            } finally {
                if (!cancelled) setLoadingTemplate(false);
            }
        })();
        return () => { cancelled = true; };
    }, [location.search]);

    // ---- file handling -----------------------------------------------------
    const acceptFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please drop an image file (JPG, PNG, GIF, WebP).');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setError(`Image too large. Keep it under ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }
        setError('');
        setImageFile(file);
        setSelectedTemplate(null);
        setUploadedUrl('');
        setPreviewUrl(URL.createObjectURL(file));
    };

    const onFileChange = (e) => acceptFile(e.target.files?.[0]);
    const onDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const resetSource = () => {
        setImageFile(null);
        setPreviewUrl('');
        setUploadedUrl('');
        setSelectedTemplate(null);
        setError('');
    };

    // ---- tag input ---------------------------------------------------------
    const addTag = () => {
        const v = tagDraft.trim().replace(/^#/, '');
        if (!v) return;
        if (tags.length >= 10) {
            setError('Max 10 tags per meme.');
            return;
        }
        if (!tags.includes(v)) setTags([...tags, v]);
        setTagDraft('');
    };

    const removeTag = (t) => setTags(tags.filter((x) => x !== t));

    // ---- upload + editor ---------------------------------------------------
    const ensureUploaded = async () => {
        if (uploadedUrl) return uploadedUrl;
        if (!imageFile) throw new Error('Select an image first');
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const resp = await uploadAPI.uploadMeme(imageFile, (p) => setUploadProgress(p));
            if (!resp?.success) throw new Error(resp?.message || 'Upload failed');
            const url = resp.data.url;
            setUploadedUrl(url);
            return url;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const openEditor = async () => {
        try {
            setError('');
            if (!imageFile && !selectedTemplate) {
                setError('Add an image first — upload one or pick a template.');
                return;
            }
            await ensureUploaded();
            setShowEditor(true);
        } catch (err) {
            setError(err.message || 'Could not open the editor.');
        }
    };

    // Editor → Save
    const handleSaveFromEditor = async (dataUrl) => {
        try {
            setError('');
            const resp = await fetch(dataUrl);
            const blob = await resp.blob();
            const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const up = await uploadAPI.uploadMeme(file);
            if (!up?.success) throw new Error(up?.message || 'Failed to upload edited meme');
            await publish(up.data.url);
        } catch (err) {
            setError(err.message || 'Failed to save meme');
        }
    };

    // Straight publish (no editor changes)
    const handlePublish = async (e) => {
        e?.preventDefault();
        try {
            setError('');
            if (!form.title.trim()) {
                setError('Give your meme a title.');
                return;
            }
            if (!imageFile && !selectedTemplate) {
                setError('Add an image first — upload one or pick a template.');
                return;
            }
            const url = await ensureUploaded();
            await publish(url);
        } catch (err) {
            setError(err.message || 'Failed to publish meme');
        }
    };

    const publish = async (finalImageUrl) => {
        const payload = {
            ...form,
            visibility: form.isPublic ? 'public' : 'private',
            imageUrl: finalImageUrl,
            tags,
            templateInfo: selectedTemplate
                ? {
                      templateId: selectedTemplate._id,
                      templateTitle: selectedTemplate.title,
                      templateCreator: {
                          userId:
                              selectedTemplate.createdBy?._id ||
                              selectedTemplate.createdBy,
                          username:
                              selectedTemplate.createdBy?.username || 'Unknown',
                      },
                      usedAt: new Date(),
                  }
                : null,
        };
        const result = await createMeme(payload);
        if (result?.success) {
            navigate('/dashboard');
        } else {
            setError(result?.error || 'Failed to create meme');
        }
    };

    // ---- editor takeover ---------------------------------------------------
    if (showEditor && uploadedUrl) {
        return (
            <MemeEditor
                imageUrl={uploadedUrl}
                onSave={handleSaveFromEditor}
                onCancel={() => setShowEditor(false)}
            />
        );
    }

    // ---- render ------------------------------------------------------------
    const hasSource = !!previewUrl;
    const sourceLabel = useMemo(() => {
        if (selectedTemplate) return `Template: ${selectedTemplate.title || 'Untitled'}`;
        if (imageFile) return imageFile.name;
        return '';
    }, [selectedTemplate, imageFile]);

    return (
        <Box>
            <PageHeader
                eyebrow="CREATE"
                title="Make a meme"
                subtitle="Drop an image, pick a template, or jump straight into the canvas editor."
                icon={<SparkleIcon />}
                actions={
                    <Button variant="outlined" onClick={() => navigate('/templates')}>
                        Browse templates
                    </Button>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loadingTemplate && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Loading template…
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    {/* Left: source */}
                    <Grid item xs={12} md={7}>
                        <Box
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={onDrop}
                            sx={{
                                p: 0,
                                borderRadius: 3,
                                border: `2px ${dragActive ? 'solid' : 'dashed'} ${
                                    dragActive
                                        ? theme.palette.primary.main
                                        : theme.palette.brand?.border || theme.palette.divider
                                }`,
                                background: dragActive
                                    ? theme.palette.brand?.surfaceSubtle
                                    : theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.md,
                                overflow: 'hidden',
                                transition: 'background 120ms ease, border 120ms ease',
                            }}
                        >
                            {hasSource ? (
                                <Box sx={{ position: 'relative' }}>
                                    <Box
                                        component="img"
                                        src={previewUrl}
                                        alt="Preview"
                                        sx={{
                                            width: '100%',
                                            maxHeight: 520,
                                            objectFit: 'contain',
                                            display: 'block',
                                            background: theme.palette.brand?.surfaceSubtle,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            display: 'flex',
                                            gap: 1,
                                        }}
                                    >
                                        <IconButton
                                            onClick={resetSource}
                                            size="small"
                                            sx={{
                                                background: theme.palette.background.paper,
                                                border: `2px solid ${theme.palette.brand?.border}`,
                                                '&:hover': {
                                                    background: theme.palette.error.light,
                                                },
                                            }}
                                            aria-label="Remove image"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderTop: `2px dashed ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                                            background: theme.palette.brand?.surfaceSubtle,
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1.5}
                                            alignItems={{ sm: 'center' }}
                                            justifyContent="space-between"
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: theme.palette.text.secondary,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: { sm: 280 },
                                                }}
                                                title={sourceLabel}
                                            >
                                                {sourceLabel}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    startIcon={<ResetIcon />}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    Replace
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<EditorIcon />}
                                                    onClick={openEditor}
                                                    disabled={isUploading}
                                                >
                                                    Edit in canvas
                                                </Button>
                                            </Stack>
                                        </Stack>
                                        {isUploading && (
                                            <Box sx={{ mt: 1.5 }}>
                                                <LinearProgress variant="determinate" value={uploadProgress} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    Uploading… {uploadProgress}%
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ) : (
                                <Box
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        p: { xs: 5, md: 8 },
                                        minHeight: 360,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 3,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                            background: theme.palette.brand?.gradient,
                                            color: '#fff',
                                            boxShadow: theme.tokens?.shadow?.md,
                                            mb: 2,
                                        }}
                                    >
                                        <UploadIcon sx={{ fontSize: 36 }} />
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                                        Drop an image here
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                                        …or click to upload. JPG, PNG, GIF, WebP up to {MAX_FILE_SIZE_MB}MB.
                                    </Typography>
                                    <Stack direction="row" spacing={1.5}>
                                        <Button
                                            variant="contained"
                                            startIcon={<UploadIcon />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            Choose file
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ImageIcon />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/templates');
                                            }}
                                        >
                                            Pick a template
                                        </Button>
                                    </Stack>
                                </Box>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={onFileChange}
                            />
                        </Box>
                    </Grid>

                    {/* Right: metadata form */}
                    <Grid item xs={12} md={5}>
                        <Box
                            component="form"
                            onSubmit={handlePublish}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                background: theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.md,
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                                Details
                            </Typography>

                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                inputProps={{ maxLength: 120 }}
                                helperText={`${form.title.length}/120`}
                                sx={{ mb: 2 }}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                multiline
                                rows={3}
                                inputProps={{ maxLength: 500 }}
                                helperText={`${form.description.length}/500`}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                select
                                label="Category"
                                name="category"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                sx={{ mb: 2 }}
                            >
                                {CATEGORIES.map((c) => (
                                    <MenuItem key={c.value} value={c.value}>
                                        {c.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                fullWidth
                                label="Add a tag"
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                placeholder="Press Enter to add"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <TagIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1.5 }}
                            />

                            {tags.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {tags.map((t) => (
                                        <Chip
                                            key={t}
                                            label={`#${t}`}
                                            onDelete={() => removeTag(t)}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    ))}
                                </Stack>
                            )}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPublic}
                                        onChange={(e) =>
                                            setForm({ ...form, isPublic: e.target.checked })
                                        }
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {form.isPublic ? 'Public' : 'Private'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: theme.palette.text.secondary }}
                                        >
                                            {form.isPublic
                                                ? 'Anyone can see this meme in the gallery.'
                                                : 'Only you will see this meme.'}
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', mb: 3, ml: 0 }}
                            />

                            <Stack spacing={1.5}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={
                                        isUploading ? (
                                            <CircularProgress size={18} color="inherit" />
                                        ) : (
                                            <PublishIcon />
                                        )
                                    }
                                    disabled={isUploading}
                                    sx={{ py: 1.5, fontWeight: 800 }}
                                >
                                    {isUploading ? `Uploading ${uploadProgress}%` : 'Publish'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<EditorIcon />}
                                    onClick={openEditor}
                                    disabled={!hasSource || isUploading}
                                    sx={{ py: 1.5, fontWeight: 800 }}
                                >
                                    Edit in canvas first
                                </Button>
                            </Stack>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    color: theme.palette.text.secondary,
                                    mt: 2,
                                }}
                            >
                                Tip: the canvas lets you add captions, stickers, and filters. Publish
                                skips that and posts the raw image with your details.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default CreateMeme;
