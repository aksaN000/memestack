// ============================================================================
// FolderManager — organize memes into personal folders (collections).
// ----------------------------------------------------------------------------
// Grid of folder cards with icon/color customization + create/edit dialog.
// Context menu per folder: Edit / Share (copy link) / Delete.
// Uses `foldersAPI` for CRUD and `generateShareLink` for share URLs.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Folder as FolderIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Share as ShareIcon,
    MoreVert as MoreVertIcon,
    Star as StarIcon,
    Bookmark as BookmarkIcon,
    Image as ImageIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Home as HomeIcon,
    Sports as SportsIcon,
    MusicNote as MusicIcon,
    TrendingUp as TrendingUpIcon,
    Favorite as FavoriteIcon,
    Public as PublicIcon,
    Label as TagIcon,
} from '@mui/icons-material';

import { foldersAPI } from '../services/api';
import { PageHeader, EmptyState } from '../components/common';

const ICON_OPTIONS = [
    { value: 'folder', label: 'Folder', icon: <FolderIcon /> },
    { value: 'star', label: 'Star', icon: <StarIcon /> },
    { value: 'bookmark', label: 'Bookmark', icon: <BookmarkIcon /> },
    { value: 'image', label: 'Image', icon: <ImageIcon /> },
    { value: 'work', label: 'Work', icon: <WorkIcon /> },
    { value: 'school', label: 'School', icon: <SchoolIcon /> },
    { value: 'home', label: 'Home', icon: <HomeIcon /> },
    { value: 'sports', label: 'Sports', icon: <SportsIcon /> },
    { value: 'music', label: 'Music', icon: <MusicIcon /> },
    { value: 'trending_up', label: 'Trending', icon: <TrendingUpIcon /> },
    { value: 'favorite', label: 'Favorite', icon: <FavoriteIcon /> },
    { value: 'public', label: 'Public', icon: <PublicIcon /> },
    { value: 'tag', label: 'Tag', icon: <TagIcon /> },
];

const COLOR_OPTIONS = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
    '#f97316', '#6b7280', '#1f2937', '#7c3aed',
];

const getIcon = (name) => {
    const match = ICON_OPTIONS.find((o) => o.value === name);
    return match ? match.icon : <FolderIcon />;
};

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const FolderManager = () => {
    const theme = useTheme();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'folder',
        isPrivate: true,
    });

    const [anchorEl, setAnchorEl] = useState(null);
    const [menuFolder, setMenuFolder] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const resp = await foldersAPI.getFolders();
                if (cancelled) return;
                setFolders(resp.folders || []);
            } catch (err) {
                if (!cancelled) setError('Failed to load folders');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const refresh = async () => {
        try {
            const resp = await foldersAPI.getFolders();
            setFolders(resp.folders || []);
        } catch {
            /* ignore */
        }
    };

    const openCreate = () => {
        setSelectedFolder(null);
        setForm({
            name: '',
            description: '',
            color: '#6366f1',
            icon: 'folder',
            isPrivate: true,
        });
        setDialogOpen(true);
    };

    const openEdit = (folder) => {
        setSelectedFolder(folder);
        setForm({
            name: folder.name,
            description: folder.description || '',
            color: folder.color || '#6366f1',
            icon: folder.icon || 'folder',
            isPrivate: folder.isPrivate ?? true,
        });
        setDialogOpen(true);
        closeMenu();
    };

    const submit = async () => {
        try {
            if (selectedFolder) {
                await foldersAPI.updateFolder(selectedFolder._id, form);
                setSuccess('Folder updated.');
            } else {
                await foldersAPI.createFolder(form);
                setSuccess('Folder created.');
            }
            setDialogOpen(false);
            refresh();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save folder');
        }
    };

    const removeFolder = async (id) => {
        if (!window.confirm('Delete this folder? This cannot be undone.')) return;
        try {
            await foldersAPI.deleteFolder(id);
            setSuccess('Folder deleted.');
            refresh();
        } catch {
            setError('Failed to delete folder');
        }
        closeMenu();
    };

    const shareFolder = async (id) => {
        try {
            const resp = await foldersAPI.generateShareLink(id);
            const url = `${window.location.origin}${resp.shareUrl}`;
            await navigator.clipboard.writeText(url);
            setSuccess('Share link copied to clipboard.');
        } catch {
            setError('Failed to generate share link');
        }
        closeMenu();
    };

    const openMenu = (e, folder) => {
        setAnchorEl(e.currentTarget);
        setMenuFolder(folder);
    };
    const closeMenu = () => {
        setAnchorEl(null);
        setMenuFolder(null);
    };

    return (
        <Box>
            <PageHeader
                eyebrow="COLLECTIONS"
                title="Folder manager"
                subtitle="Organize your memes into labeled collections. Pick an icon, pick a color, keep it private or share the link."
                icon={<FolderIcon />}
                actions={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreate}
                        sx={{ fontWeight: 800 }}
                    >
                        New folder
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
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : folders.length === 0 ? (
                    <EmptyState
                        icon={<FolderIcon sx={{ fontSize: 48 }} />}
                        title="No folders yet"
                        description="Create your first folder to organize your memes into neat collections."
                        action={
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={openCreate}
                            >
                                Create your first folder
                            </Button>
                        }
                    />
                ) : (
                    <Grid container spacing={3}>
                        {folders.map((folder) => (
                            <Grid item xs={12} sm={6} md={4} key={folder._id}>
                                <Box
                                    sx={{
                                        p: 2.5,
                                        height: '100%',
                                        borderRadius: 3,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: theme.palette.background.paper,
                                        boxShadow: theme.tokens?.shadow?.sm,
                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: theme.tokens?.shadow?.md,
                                        },
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                backgroundColor: folder.color || '#6366f1',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `2px solid ${theme.palette.brand?.border || '#0f172a'}`,
                                                boxShadow: theme.tokens?.shadow?.sm,
                                            }}
                                        >
                                            {getIcon(folder.icon)}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                sx={{ fontWeight: 800, lineHeight: 1.2 }}
                                                noWrap
                                                title={folder.name}
                                            >
                                                {folder.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                {folder.memeCount || 0} meme{(folder.memeCount || 0) === 1 ? '' : 's'}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openMenu(e, folder)}
                                            aria-label="folder actions"
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Stack>

                                    {folder.description && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: theme.palette.text.secondary,
                                                mb: 1.5,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {folder.description}
                                        </Typography>
                                    )}

                                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            label={folder.isPrivate ? 'Private' : 'Public'}
                                            size="small"
                                            color={folder.isPrivate ? 'default' : 'primary'}
                                            sx={{ fontWeight: 700 }}
                                        />
                                        {folder.sharing?.isPublic && (
                                            <Chip
                                                label="Shared"
                                                size="small"
                                                color="secondary"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        )}
                                    </Stack>

                                    <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        Created {formatDate(folder.createdAt)}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Context menu */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
                    <MenuItem onClick={() => openEdit(menuFolder)}>
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Edit folder</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => shareFolder(menuFolder?._id)}>
                        <ListItemIcon>
                            <ShareIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Copy share link</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                        onClick={() => removeFolder(menuFolder?._id)}
                        sx={{ color: theme.palette.error.main }}
                    >
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Delete folder</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Create / edit dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            boxShadow: theme.tokens?.shadow?.lg,
                        },
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 900 }}>
                        {selectedFolder ? 'Edit folder' : 'New folder'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <TextField
                                fullWidth
                                label="Folder name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                autoFocus
                            />
                            <TextField
                                fullWidth
                                label="Description (optional)"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                multiline
                                rows={2}
                                inputProps={{ maxLength: 200 }}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Icon</InputLabel>
                                <Select
                                    value={form.icon}
                                    label="Icon"
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                >
                                    {ICON_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {opt.icon}
                                                <Typography>{opt.label}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box>
                                <Typography sx={{ fontWeight: 700, mb: 1 }}>Color</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {COLOR_OPTIONS.map((c) => (
                                        <Box
                                            key={c}
                                            onClick={() => setForm({ ...form, color: c })}
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 2,
                                                backgroundColor: c,
                                                cursor: 'pointer',
                                                border:
                                                    form.color === c
                                                        ? `3px solid ${theme.palette.brand?.accent || theme.palette.primary.main}`
                                                        : `2px solid ${theme.palette.divider}`,
                                                boxShadow:
                                                    form.color === c ? theme.tokens?.shadow?.sm : 'none',
                                                transition: 'transform 0.1s',
                                                '&:hover': { transform: 'scale(1.08)' },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Privacy</InputLabel>
                                <Select
                                    value={form.isPrivate}
                                    label="Privacy"
                                    onChange={(e) =>
                                        setForm({ ...form, isPrivate: e.target.value })
                                    }
                                >
                                    <MenuItem value={true}>Private (only me)</MenuItem>
                                    <MenuItem value={false}>Public (anyone with the link)</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submit}
                            variant="contained"
                            disabled={!form.name.trim()}
                            sx={{ fontWeight: 800, minWidth: 120 }}
                        >
                            {selectedFolder ? 'Save changes' : 'Create folder'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default FolderManager;
