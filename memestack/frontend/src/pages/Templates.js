// ============================================================================
// Templates — browse, search, and use reusable meme templates.
// ----------------------------------------------------------------------------
// Tabs: All · Trending · Mine · Favorites. Each template card has a big
// preview, title, creator, and a "Use" button that deep-links to
// /create?template=:id so the canvas pre-loads the image.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Typography,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    InputAdornment,
    IconButton,
    Button,
    Chip,
    Stack,
    Pagination,
    Avatar,
    Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    AutoAwesome as UseIcon,
    Palette as TemplateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { templatesAPI } from '../services/api';
import {
    PageHeader,
    EmptyState,
    ErrorState,
    SkeletonCard,
} from '../components/common';

const CATEGORIES = [
    { value: '', label: 'All categories' },
    { value: 'reaction', label: 'Reaction' },
    { value: 'mocking', label: 'Mocking' },
    { value: 'success', label: 'Success' },
    { value: 'fail', label: 'Fail' },
    { value: 'advice', label: 'Advice' },
    { value: 'rage', label: 'Rage' },
    { value: 'popular', label: 'Popular' },
    { value: 'classic', label: 'Classic' },
    { value: 'freestyle', label: 'Freestyle' },
];

const SORTS = [
    { value: 'recent', label: 'Newest' },
    { value: 'popular', label: 'Most popular' },
    { value: 'downloads', label: 'Most downloaded' },
    { value: 'rating', label: 'Highest rated' },
    { value: 'trending', label: 'Trending' },
];

const TABS = [
    { value: 0, label: 'All', key: 'all' },
    { value: 1, label: 'Trending', key: 'trending' },
    { value: 2, label: 'Mine', key: 'mine', auth: true },
    { value: 3, label: 'Favorites', key: 'favorites', auth: true },
];

const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
        const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${api.replace('/api', '')}${url}`;
    }
    return url;
};

const TemplateCard = ({ template, onUse, onDownload, onToggleFavorite, isFavorite, isAuth, tint }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const creator = template.createdBy || {};
    const imageUrl = resolveImageUrl(template.imageUrl);

    return (
        <Box
            onClick={() => navigate(`/templates/${template._id || template.id}`)}
            sx={{
                cursor: 'pointer',
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: tint || theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.md,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: theme.tokens?.shadow?.md,
                },
            }}
        >
            <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
                <Box
                    component="img"
                    src={imageUrl}
                    alt={template.name || template.title}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        background: theme.palette.brand?.surfaceSubtle,
                    }}
                />
                {template.category && (
                    <Chip
                        label={template.category}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            background: theme.palette.background.paper,
                            border: `2px solid ${theme.palette.brand?.border}`,
                        }}
                    />
                )}
                {isAuth && (
                    <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(template._id);
                            }}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: theme.palette.background.paper,
                                border: `2px solid ${theme.palette.brand?.border}`,
                                '&:hover': {
                                    background: theme.palette.background.paper,
                                },
                            }}
                        >
                            {isFavorite ? (
                                <FavoriteIcon
                                    fontSize="small"
                                    sx={{ color: theme.palette.error.main }}
                                />
                            ) : (
                                <FavoriteBorderIcon fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {template.name || template.title || 'Untitled template'}
                </Typography>
                {creator.username && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                            src={creator.avatar}
                            sx={{ width: 22, height: 22, fontSize: 12, fontWeight: 800 }}
                        >
                            {creator.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.text.secondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            @{creator.username}
                        </Typography>
                    </Stack>
                )}
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" spacing={1}>
                    <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<UseIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onUse(template);
                        }}
                        sx={{ fontWeight: 800 }}
                    >
                        Use
                    </Button>
                    <Tooltip title="Download">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload(template);
                            }}
                            sx={{
                                border: `2px solid ${theme.palette.brand?.border}`,
                            }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
        </Box>
    );
};

const Templates = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [tab, setTab] = useState(0);
    const [templates, setTemplates] = useState([]);
    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('recent');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [favorites, setFavorites] = useState(new Set());

    const visibleTabs = TABS.filter((t) => !t.auth || isAuthenticated);

    // Load favorites once when logged in.
    useEffect(() => {
        if (!user) {
            setFavorites(new Set());
            return;
        }
        (async () => {
            try {
                const resp = await templatesAPI.getFavoriteTemplates();
                const ids = new Set((resp?.templates || []).map((t) => t._id));
                setFavorites(ids);
            } catch {
                /* non-fatal */
            }
        })();
    }, [user]);

    // Fetch templates when filter/tab changes.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                let resp;
                if (tab === 0) {
                    resp = await templatesAPI.getTemplates({
                        page,
                        limit: 12,
                        sort: sortBy,
                        ...(search ? { search } : {}),
                        ...(category ? { category } : {}),
                    });
                    if (cancelled) return;
                    setTemplates(resp?.templates || []);
                    setTotalPages(resp?.pagination?.totalPages || 1);
                } else if (tab === 1) {
                    resp = await templatesAPI.getTrending();
                    if (cancelled) return;
                    setTemplates(resp?.templates || []);
                    setTotalPages(1);
                } else if (tab === 2) {
                    resp = await templatesAPI.getUserTemplates();
                    if (cancelled) return;
                    setTemplates(resp?.templates || []);
                    setTotalPages(1);
                } else if (tab === 3) {
                    resp = await templatesAPI.getFavoriteTemplates();
                    if (cancelled) return;
                    setTemplates(resp?.templates || []);
                    setTotalPages(1);
                }
            } catch (err) {
                if (!cancelled) setError(err?.message || 'Could not load templates.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [tab, page, sortBy, search, category]);

    const commitSearch = () => {
        setSearch(searchDraft.trim());
        setPage(1);
    };
    const clearSearch = () => {
        setSearchDraft('');
        setSearch('');
        setPage(1);
    };

    const handleToggleFavorite = async (templateId) => {
        try {
            if (favorites.has(templateId)) {
                await templatesAPI.unfavoriteTemplate(templateId);
                setFavorites((prev) => {
                    const n = new Set(prev);
                    n.delete(templateId);
                    return n;
                });
            } else {
                await templatesAPI.favoriteTemplate(templateId);
                setFavorites((prev) => new Set([...prev, templateId]));
            }
        } catch {
            /* non-fatal */
        }
    };

    const handleUse = async (template) => {
        try {
            await templatesAPI.trackTemplateUsage(template._id);
        } catch {
            /* non-fatal */
        }
        navigate(`/create?template=${template._id}`);
    };

    const handleDownload = async (template) => {
        try {
            await templatesAPI.downloadTemplate(template._id);
        } catch {
            /* ignore */
        }
        const url = resolveImageUrl(template.imageUrl);
        const ext = (template.imageUrl || '').split('.').pop() || 'jpg';
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name || 'template'}.${ext}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ---- render ------------------------------------------------------------
    const renderGrid = () => {
        if (loading && templates.length === 0) {
            return (
                <Grid container spacing={2.5}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Grid key={i} item xs={12} sm={6} md={3}>
                            <SkeletonCard aspect="4/3" />
                        </Grid>
                    ))}
                </Grid>
            );
        }
        if (error) {
            return (
                <ErrorState
                    title="Couldn't load templates"
                    description={error}
                    onRetry={() => setPage((p) => p)}
                />
            );
        }
        if (templates.length === 0) {
            const mineEmpty = tab === 2;
            const favsEmpty = tab === 3;
            return (
                <EmptyState
                    icon={mineEmpty ? '🎨' : favsEmpty ? '💛' : '🔍'}
                    title={
                        mineEmpty
                            ? 'You haven\'t made a template yet'
                            : favsEmpty
                            ? 'No favorites yet'
                            : 'No templates match those filters'
                    }
                    description={
                        mineEmpty
                            ? 'Publish your first reusable template — other creators can remix it.'
                            : favsEmpty
                            ? 'Hit the heart on any template to save it here.'
                            : 'Try clearing filters or searching for something looser.'
                    }
                    action={
                        mineEmpty ? (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/templates/create')}
                            >
                                Create a template
                            </Button>
                        ) : favsEmpty ? (
                            <Button variant="contained" onClick={() => setTab(0)}>
                                Browse templates
                            </Button>
                        ) : (
                            <Button variant="contained" onClick={clearSearch}>
                                Clear filters
                            </Button>
                        )
                    }
                />
            );
        }
        const tintList = (() => {
            const t = theme.palette.brand?.tints || {};
            return [t.lavender, t.peach, t.mint, t.sky, t.rose, t.butter];
        })();
        return (
            <Grid container spacing={2.5}>
                {templates.map((t, idx) => (
                    <Grid key={t._id || t.id} item xs={12} sm={6} md={3}>
                        <TemplateCard
                            template={t}
                            isAuth={isAuthenticated}
                            isFavorite={favorites.has(t._id)}
                            onToggleFavorite={handleToggleFavorite}
                            onUse={handleUse}
                            onDownload={handleDownload}
                            tint={tintList[idx % tintList.length]}
                        />
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box>
            <PageHeader
                eyebrow="TEMPLATES"
                title="Template library"
                subtitle="Reusable blanks, popular formats, and your own stash — all in one grid."
                icon={<TemplateIcon />}
                actions={
                    isAuthenticated && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/templates/create')}
                        >
                            New template
                        </Button>
                    )
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        setTab(v);
                        setPage(1);
                    }}
                    sx={{
                        mb: 3,
                        borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        '& .MuiTab-root': { fontWeight: 800, textTransform: 'none' },
                    }}
                >
                    {visibleTabs.map((t) => (
                        <Tab key={t.key} value={t.value} label={t.label} />
                    ))}
                </Tabs>

                {/* Filter bar (only for All tab) */}
                {tab === 0 && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2.5,
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            boxShadow: theme.tokens?.shadow?.sm,
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    placeholder="Search templates"
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchDraft ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={clearSearch}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Category"
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    {CATEGORIES.map((c) => (
                                        <MenuItem key={c.value} value={c.value}>
                                            {c.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Sort"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    {SORTS.map((s) => (
                                        <MenuItem key={s.value} value={s.value}>
                                            {s.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button fullWidth variant="contained" onClick={commitSearch}>
                                    Go
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {renderGrid()}

                {tab === 0 && totalPages > 1 && (
                    <Stack alignItems="center" sx={{ mt: 5 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            color="primary"
                            size="large"
                        />
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default Templates;
