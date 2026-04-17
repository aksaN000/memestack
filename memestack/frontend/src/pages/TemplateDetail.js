// ============================================================================
// TemplateDetail — single template view with preview + metadata.
// ----------------------------------------------------------------------------
// Big image preview, metadata sidebar (creator, category, counters), and
// primary CTA: "Use this template" which pre-loads the canvas with the image.
// Secondary actions: favorite toggle, download, share (copy link).
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    Stack,
    Typography,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    Divider,
    Snackbar,
    Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    ArrowBack as BackIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    AutoAwesome as UseIcon,
    Visibility as ViewIcon,
    GetApp as DownloadsIcon,
    StarOutline as StarIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { templatesAPI } from '../services/api';
import { LoadingSpinner, ErrorState } from '../components/common';

const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
        const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${api.replace('/api', '')}${url}`;
    }
    return url;
};

const TemplateDetail = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadError('');
            try {
                const resp = await templatesAPI.getTemplateById(id);
                const tpl = resp?.template || resp?.data?.template || resp?.data;
                if (!tpl) throw new Error('Template not found');
                if (cancelled) return;
                setTemplate(tpl);
                if (user) {
                    try {
                        const favResp = await templatesAPI.getFavoriteTemplates();
                        const favIds = (favResp?.templates || []).map((t) => t._id);
                        if (!cancelled) setIsFavorite(favIds.includes(id));
                    } catch {
                        /* non-fatal */
                    }
                }
            } catch (err) {
                if (!cancelled) setLoadError(err?.message || 'Failed to load template');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, user]);

    const notify = (message, severity = 'success') =>
        setSnack({ open: true, message, severity });

    const handleUse = async () => {
        try {
            await templatesAPI.trackTemplateUsage(id);
        } catch {
            /* non-fatal */
        }
        navigate(`/create?template=${id}`);
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            notify('Log in to save favorites', 'warning');
            return;
        }
        try {
            if (isFavorite) {
                await templatesAPI.unfavoriteTemplate(id);
                setIsFavorite(false);
                setTemplate((prev) => ({
                    ...prev,
                    favoriteCount: Math.max(0, (prev?.favoriteCount || 1) - 1),
                }));
            } else {
                await templatesAPI.favoriteTemplate(id);
                setIsFavorite(true);
                setTemplate((prev) => ({
                    ...prev,
                    favoriteCount: (prev?.favoriteCount || 0) + 1,
                }));
            }
        } catch {
            notify('Could not update favorite', 'error');
        }
    };

    const handleDownload = async () => {
        try {
            await templatesAPI.downloadTemplate(id);
        } catch {
            /* non-fatal */
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
        setTemplate((prev) => ({ ...prev, downloadCount: (prev?.downloadCount || 0) + 1 }));
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: template.name,
                    text: template.description,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                notify('Link copied to clipboard');
            }
        } catch {
            /* user cancelled */
        }
    };

    if (loading) return <LoadingSpinner fullHeight />;
    if (loadError || !template) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <ErrorState
                    title="Couldn't load that template"
                    description={loadError || 'The template may have been removed.'}
                    action={
                        <Button
                            variant="contained"
                            startIcon={<BackIcon />}
                            onClick={() => navigate('/templates')}
                        >
                            Back to templates
                        </Button>
                    }
                />
            </Container>
        );
    }

    const creator = template.createdBy || {};
    const creatorId = creator._id || creator.id;
    const imageUrl = resolveImageUrl(template.imageUrl);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<BackIcon />}
                onClick={() => navigate('/templates')}
                sx={{ mb: 2, fontWeight: 700 }}
            >
                All templates
            </Button>

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    <Box
                        sx={{
                            p: { xs: 1, md: 2 },
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.brand?.surfaceSubtle,
                            boxShadow: theme.tokens?.shadow?.lg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 320,
                        }}
                    >
                        <Box
                            component="img"
                            src={imageUrl}
                            alt={template.name}
                            sx={{
                                width: '100%',
                                maxHeight: 640,
                                objectFit: 'contain',
                                borderRadius: 2,
                                display: 'block',
                            }}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            boxShadow: theme.tokens?.shadow?.md,
                            position: { md: 'sticky' },
                            top: { md: 88 },
                        }}
                    >
                        {template.category && (
                            <Chip
                                label={template.category}
                                size="small"
                                sx={{ textTransform: 'capitalize', fontWeight: 700, mb: 1.5 }}
                            />
                        )}
                        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                            {template.name || template.title}
                        </Typography>
                        {template.description && (
                            <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                {template.description}
                            </Typography>
                        )}

                        {creator.username && (
                            <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                sx={{
                                    py: 1.5,
                                    my: 1.5,
                                    borderTop: `1px dashed ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                                    borderBottom: `1px dashed ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                                }}
                            >
                                <Avatar
                                    src={creator.avatar}
                                    component={RouterLink}
                                    to={creatorId ? `/users/${creatorId}` : '#'}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        fontWeight: 900,
                                        textDecoration: 'none',
                                        background: theme.palette.brand?.gradient,
                                    }}
                                >
                                    {creator.username.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                                        @{creator.username}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        Template creator
                                    </Typography>
                                </Box>
                            </Stack>
                        )}

                        <Stack direction="row" spacing={3} sx={{ mb: 2.5 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <ViewIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {template.usageCount ?? template.viewCount ?? 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    uses
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <DownloadsIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {template.downloadCount || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    downloads
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <FavoriteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {template.favoriteCount || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    favorites
                                </Typography>
                            </Stack>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={1.5}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<UseIcon />}
                                onClick={handleUse}
                                sx={{ fontWeight: 800, py: 1.25 }}
                            >
                                Use this template
                            </Button>
                            <Stack direction="row" spacing={1}>
                                <Tooltip
                                    title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                                >
                                    <IconButton
                                        onClick={handleToggleFavorite}
                                        sx={{
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                        }}
                                        aria-label="favorite"
                                    >
                                        {isFavorite ? (
                                            <FavoriteIcon sx={{ color: theme.palette.error.main }} />
                                        ) : (
                                            <FavoriteBorderIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                    <IconButton
                                        onClick={handleDownload}
                                        sx={{
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                        }}
                                        aria-label="download"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Share">
                                    <IconButton
                                        onClick={handleShare}
                                        sx={{
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                        }}
                                        aria-label="share"
                                    >
                                        <ShareIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        {Array.isArray(template.tags) && template.tags.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    TAGS
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}
                                >
                                    {template.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={`#${tag}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={snack.open}
                autoHideDuration={3500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                    severity={snack.severity}
                    variant="filled"
                    sx={{ fontWeight: 700 }}
                >
                    {snack.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TemplateDetail;
