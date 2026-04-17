// ============================================================================
// CreateTemplate — publish a reusable template to the library.
// ----------------------------------------------------------------------------
// Upload zone + metadata form. Optional: text-box hints (default captions,
// positioning) so creators using the template see placeholders already placed.
// The canvas editor itself lives on /create; templates here are just images
// + metadata + optional default-text regions.
// ============================================================================

import React, { useRef, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    TextField,
    MenuItem,
    Typography,
    Alert,
    Stack,
    Chip,
    IconButton,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    CircularProgress,
    InputAdornment,
    LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    CloudUpload as UploadIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    DeleteOutline as DeleteIcon,
    Tag as TagIcon,
    Replay as ResetIcon,
    Palette as TemplateIcon,
    TextFields as TextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { templatesAPI } from '../services/api';
import { PageHeader } from '../components/common';

const CATEGORIES = [
    'reaction',
    'mocking',
    'success',
    'fail',
    'advice',
    'rage',
    'popular',
    'classic',
    'freestyle',
];

const FONTS = ['Impact', 'Arial', 'Helvetica', 'Times New Roman', 'Comic Sans MS'];

const DEFAULT_TEXT_AREA = {
    id: '',
    defaultText: '',
    x: 50,
    y: 50,
    width: 80,
    height: 15,
    fontSize: 36,
    fontFamily: 'Impact',
    fontColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    textAlign: 'center',
    verticalAlign: 'middle',
};

const MAX_SIZE_MB = 10;

const CreateTemplate = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'popular',
        isPublic: true,
    });
    const [tags, setTags] = useState([]);
    const [tagDraft, setTagDraft] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const [textAreas, setTextAreas] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // ---- file handling -----------------------------------------------------
    const acceptFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Pick an image (JPG, PNG, GIF, WebP).');
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`Image too large. Keep it under ${MAX_SIZE_MB}MB.`);
            return;
        }
        setError('');
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        const img = new Image();
        img.onload = () => setDimensions({ width: img.width, height: img.height });
        img.src = url;
    };

    const resetImage = () => {
        setImageFile(null);
        setPreviewUrl('');
    };

    // ---- tags --------------------------------------------------------------
    const addTag = () => {
        const v = tagDraft.trim().replace(/^#/, '');
        if (!v) return;
        if (tags.length >= 10) {
            setError('Max 10 tags per template.');
            return;
        }
        if (!tags.includes(v)) setTags([...tags, v]);
        setTagDraft('');
    };
    const removeTag = (t) => setTags(tags.filter((x) => x !== t));

    // ---- text areas --------------------------------------------------------
    const openNewArea = () =>
        setEditing({ ...DEFAULT_TEXT_AREA, id: `text${textAreas.length + 1}` });

    const openEditArea = (area, index) => {
        setEditing({ ...area });
        setEditingIndex(index);
    };

    const saveArea = () => {
        if (!editing?.defaultText?.trim()) {
            setError('Give the text box a default caption.');
            return;
        }
        setTextAreas((prev) =>
            editingIndex === null
                ? [...prev, editing]
                : prev.map((a, i) => (i === editingIndex ? editing : a)),
        );
        setEditing(null);
        setEditingIndex(null);
        setError('');
    };

    const closeEditor = () => {
        setEditing(null);
        setEditingIndex(null);
    };

    const removeArea = (i) => setTextAreas((prev) => prev.filter((_, idx) => idx !== i));

    // ---- submit ------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Give your template a name.');
            return;
        }
        if (!imageFile) {
            setError('Upload a template image.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const resp = await templatesAPI.createTemplate({
                ...form,
                image: imageFile,
                tags,
                textAreas,
                dimensions,
            });
            if (resp?.success) {
                setSuccess('Template published — redirecting…');
                setTimeout(() => navigate('/templates'), 1200);
            } else {
                throw new Error(resp?.message || 'Failed to publish template');
            }
        } catch (err) {
            setError(err.message || 'Failed to publish template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <PageHeader
                eyebrow="NEW TEMPLATE"
                title="Create a template"
                subtitle="Publish a reusable template to the library so other creators can remix it."
                icon={<TemplateIcon />}
                actions={
                    <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() => navigate('/templates')}
                    >
                        Cancel
                    </Button>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        {/* Left: image upload */}
                        <Grid item xs={12} md={7}>
                            <Box
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActive(false);
                                    acceptFile(e.dataTransfer.files?.[0]);
                                }}
                                sx={{
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
                                    mb: 3,
                                }}
                            >
                                {previewUrl ? (
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            component="img"
                                            src={previewUrl}
                                            alt="Preview"
                                            sx={{
                                                width: '100%',
                                                maxHeight: 500,
                                                objectFit: 'contain',
                                                display: 'block',
                                                background: theme.palette.brand?.surfaceSubtle,
                                            }}
                                        />
                                        {/* Text-area overlays */}
                                        {textAreas.map((a, i) => (
                                            <Box
                                                key={i}
                                                onClick={() => openEditArea(a, i)}
                                                sx={{
                                                    position: 'absolute',
                                                    left: `${a.x - a.width / 2}%`,
                                                    top: `${a.y - a.height / 2}%`,
                                                    width: `${a.width}%`,
                                                    height: `${a.height}%`,
                                                    border: `2px dashed ${theme.palette.primary.main}`,
                                                    background: `${theme.palette.primary.main}20`,
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    color: '#fff',
                                                    fontFamily: a.fontFamily,
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                                                    px: 0.5,
                                                    '&:hover': {
                                                        background: `${theme.palette.primary.main}35`,
                                                    },
                                                }}
                                            >
                                                {a.defaultText}
                                            </Box>
                                        ))}
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
                                                size="small"
                                                onClick={resetImage}
                                                sx={{
                                                    background: theme.palette.background.paper,
                                                    border: `2px solid ${theme.palette.brand?.border}`,
                                                }}
                                                aria-label="Remove image"
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            p: 8,
                                            minHeight: 320,
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
                                            Upload template image
                                        </Typography>
                                        <Typography
                                            sx={{ color: theme.palette.text.secondary, mb: 3 }}
                                        >
                                            Drop an image here or click to choose. Up to{' '}
                                            {MAX_SIZE_MB}MB.
                                        </Typography>
                                        <Button variant="contained" startIcon={<UploadIcon />}>
                                            Choose file
                                        </Button>
                                    </Box>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => acceptFile(e.target.files?.[0])}
                                />
                            </Box>

                            {/* Text boxes */}
                            {previewUrl && (
                                <Box
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: theme.palette.background.paper,
                                        boxShadow: theme.tokens?.shadow?.sm,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 1.5 }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 900 }}>
                                                Text boxes
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                Optional. Suggest caption positions for remixers.
                                            </Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={openNewArea}
                                        >
                                            Add
                                        </Button>
                                    </Stack>
                                    {textAreas.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            sx={{ color: theme.palette.text.secondary }}
                                        >
                                            No text boxes yet. The template will publish as a plain
                                            image if you skip this.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {textAreas.map((a, i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        border: `2px solid ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                    }}
                                                >
                                                    <TextIcon
                                                        sx={{ color: theme.palette.primary.main }}
                                                    />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 700,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {a.defaultText}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                            }}
                                                        >
                                                            {a.fontFamily} · {a.fontSize}px ·{' '}
                                                            {a.x}%, {a.y}%
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openEditArea(a, i)}
                                                    >
                                                        <TextIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeArea(i)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Grid>

                        {/* Right: metadata */}
                        <Grid item xs={12} md={5}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    background: theme.palette.background.paper,
                                    boxShadow: theme.tokens?.shadow?.md,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                                    Template details
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="Name"
                                        name="name"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        name="description"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({ ...form, description: e.target.value })
                                        }
                                        multiline
                                        rows={3}
                                        inputProps={{ maxLength: 500 }}
                                        helperText={`${form.description.length}/500`}
                                    />
                                    <TextField
                                        select
                                        fullWidth
                                        label="Category"
                                        value={form.category}
                                        onChange={(e) =>
                                            setForm({ ...form, category: e.target.value })
                                        }
                                    >
                                        {CATEGORIES.map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {c.charAt(0).toUpperCase() + c.slice(1)}
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <TagIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="Press Enter to add"
                                    />
                                    {tags.length > 0 && (
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ flexWrap: 'wrap', gap: 1 }}
                                        >
                                            {tags.map((t) => (
                                                <Chip
                                                    key={t}
                                                    label={`#${t}`}
                                                    size="small"
                                                    onDelete={() => removeTag(t)}
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
                                                    setForm({
                                                        ...form,
                                                        isPublic: e.target.checked,
                                                    })
                                                }
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography sx={{ fontWeight: 700 }}>
                                                    {form.isPublic
                                                        ? 'Public template'
                                                        : 'Private template'}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    {form.isPublic
                                                        ? 'Anyone can find and remix it.'
                                                        : 'Only you can see and use it.'}
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ alignItems: 'flex-start', ml: 0 }}
                                    />
                                </Stack>

                                {loading && <LinearProgress sx={{ mt: 3 }} />}

                                <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => navigate('/templates')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        startIcon={
                                            loading ? (
                                                <CircularProgress size={16} color="inherit" />
                                            ) : (
                                                <SaveIcon />
                                            )
                                        }
                                        disabled={loading}
                                        sx={{ fontWeight: 800 }}
                                    >
                                        {loading ? 'Publishing…' : 'Publish'}
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Text area editor dialog */}
            <Dialog
                open={!!editing}
                onClose={closeEditor}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        boxShadow: theme.tokens?.shadow?.lg,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>
                    {editingIndex === null ? 'Add text box' : 'Edit text box'}
                </DialogTitle>
                <DialogContent>
                    {editing && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Default caption"
                                value={editing.defaultText}
                                onChange={(e) =>
                                    setEditing({ ...editing, defaultText: e.target.value })
                                }
                                required
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Font"
                                    value={editing.fontFamily}
                                    onChange={(e) =>
                                        setEditing({ ...editing, fontFamily: e.target.value })
                                    }
                                >
                                    {FONTS.map((f) => (
                                        <MenuItem key={f} value={f}>
                                            {f}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    label="Font size"
                                    type="number"
                                    value={editing.fontSize}
                                    onChange={(e) =>
                                        setEditing({
                                            ...editing,
                                            fontSize: Number(e.target.value),
                                        })
                                    }
                                />
                            </Stack>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                    POSITION
                                </Typography>
                                <Stack direction="row" spacing={3}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption">X: {editing.x}%</Typography>
                                        <Slider
                                            value={editing.x}
                                            onChange={(_, v) =>
                                                setEditing({ ...editing, x: v })
                                            }
                                            min={0}
                                            max={100}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption">Y: {editing.y}%</Typography>
                                        <Slider
                                            value={editing.y}
                                            onChange={(_, v) =>
                                                setEditing({ ...editing, y: v })
                                            }
                                            min={0}
                                            max={100}
                                        />
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={3}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption">
                                            Width: {editing.width}%
                                        </Typography>
                                        <Slider
                                            value={editing.width}
                                            onChange={(_, v) =>
                                                setEditing({ ...editing, width: v })
                                            }
                                            min={10}
                                            max={100}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption">
                                            Height: {editing.height}%
                                        </Typography>
                                        <Slider
                                            value={editing.height}
                                            onChange={(_, v) =>
                                                setEditing({ ...editing, height: v })
                                            }
                                            min={5}
                                            max={60}
                                        />
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeEditor}>Cancel</Button>
                    <Button onClick={saveArea} variant="contained">
                        {editingIndex === null ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreateTemplate;
