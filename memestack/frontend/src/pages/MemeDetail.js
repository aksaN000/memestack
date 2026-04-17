// ============================================================================
// MemeDetail — single meme view.
// ----------------------------------------------------------------------------
// Two-column layout on desktop (image left, metadata + actions right),
// stacked on mobile. Below the fold: comment thread. Supports like, share,
// download, and — for non-creators — a report dialog that posts to the
// moderation API.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Button,
    IconButton,
    Chip,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    Tooltip,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Report as ReportIcon,
    ArrowBack as ArrowBackIcon,
    ChatBubbleOutline as CommentIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { memeAPI } from '../services/api';
import { submitReport } from '../services/moderationAPI';
import {
    LoadingSpinner,
    ErrorState,
    Section,
    FollowButton,
} from '../components/common';
import CommentSection from '../components/comments/CommentSection';

const REPORT_REASONS = [
    'Inappropriate content',
    'Spam',
    'Harassment',
    'Copyright violation',
    'Hate speech',
    'Violence',
    'Misleading information',
    'Other',
];

const MemeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { user, isAuthenticated } = useAuth();

    const [meme, setMeme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [liked, setLiked] = useState(false);

    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');

    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadError('');
            try {
                if (!id || id === 'undefined' || id === 'null') {
                    throw new Error('Invalid meme ID');
                }
                const resp = await memeAPI.getMemeById(id);
                if (cancelled) return;
                const data = resp?.data?.meme || resp?.data || resp?.meme;
                if (!data) throw new Error('Meme not found');
                setMeme(data);
                setLiked(!!data.isLiked);
            } catch (err) {
                if (!cancelled) setLoadError(err?.message || 'Failed to load meme');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    // ---------- actions -----------------------------------------------------
    const notify = (message, severity = 'success') =>
        setSnack({ open: true, message, severity });

    const handleLike = async () => {
        if (!isAuthenticated) {
            notify('Log in to like memes', 'warning');
            return;
        }
        try {
            const resp = await memeAPI.toggleLike(id);
            if (resp?.success) {
                setLiked(resp.data.isLiked);
                setMeme((prev) => ({
                    ...prev,
                    stats: { ...prev?.stats, likesCount: resp.data.likesCount },
                }));
            }
        } catch (err) {
            notify('Could not update like', 'error');
        }
    };

    const handleDownload = async () => {
        try {
            const resp = await fetch(meme.imageUrl);
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${meme.title || 'meme'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            notify('Download failed', 'error');
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: meme.title,
                    text: meme.description,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                notify('Link copied to clipboard');
            }
        } catch {
            /* user cancelled or clipboard blocked */
        }
    };

    const handleReport = async () => {
        if (!isAuthenticated) {
            notify('Log in to report content', 'warning');
            return;
        }
        try {
            await submitReport({
                contentType: 'meme',
                contentId: id,
                reason: reportReason,
                description: reportDescription,
            });
            setReportOpen(false);
            setReportReason('');
            setReportDescription('');
            notify('Report submitted — thanks for flagging.');
        } catch {
            notify('Failed to submit report', 'error');
        }
    };

    // ---------- render ------------------------------------------------------
    if (loading) return <LoadingSpinner fullHeight />;

    if (loadError || !meme) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <ErrorState
                    title="Couldn't load that meme"
                    description={loadError || 'The meme may have been removed or set private.'}
                    action={
                        <Button
                            variant="contained"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/memes')}
                        >
                            Back to gallery
                        </Button>
                    }
                />
            </Container>
        );
    }

    const creator = meme.creator || {};
    const isOwner = isAuthenticated && (user?.id === creator.id || user?._id === creator._id);
    const creatorId = creator._id || creator.id;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Back */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 2, fontWeight: 700 }}
            >
                Back
            </Button>

            <Grid container spacing={4}>
                {/* Image */}
                <Grid item xs={12} md={7}>
                    <Box
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.brand?.surfaceSubtle,
                            boxShadow: theme.tokens?.shadow?.lg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 320,
                            p: { xs: 1, md: 2 },
                        }}
                    >
                        <Box
                            component="img"
                            src={meme.imageUrl}
                            alt={meme.title}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: 640,
                                objectFit: 'contain',
                                borderRadius: 2,
                                display: 'block',
                            }}
                        />
                    </Box>
                </Grid>

                {/* Metadata + actions */}
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
                        {/* Category + privacy */}
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                            {meme.category && (
                                <Chip
                                    label={meme.category}
                                    size="small"
                                    sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                                />
                            )}
                            {meme.isPublic === false && (
                                <Chip
                                    icon={<LockIcon sx={{ fontSize: 14 }} />}
                                    label="Private"
                                    size="small"
                                    color="warning"
                                    sx={{ fontWeight: 700 }}
                                />
                            )}
                        </Stack>

                        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15, mb: 1 }}>
                            {meme.title}
                        </Typography>

                        {meme.description && (
                            <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                {meme.description}
                            </Typography>
                        )}

                        {/* Creator row */}
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{
                                py: 1.5,
                                my: 1,
                                borderTop: `1px dashed ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                                borderBottom: `1px dashed ${theme.palette.brand?.borderSoft || theme.palette.divider}`,
                            }}
                        >
                            <Avatar
                                src={creator.avatar || creator.profile?.avatar}
                                component={RouterLink}
                                to={creatorId ? `/users/${creatorId}` : '#'}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    fontWeight: 900,
                                    textDecoration: 'none',
                                    background: theme.palette.brand?.gradient,
                                }}
                            >
                                {(creator.profile?.displayName || creator.username || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    component={RouterLink}
                                    to={creatorId ? `/users/${creatorId}` : '#'}
                                    sx={{
                                        fontWeight: 800,
                                        color: theme.palette.text.primary,
                                        textDecoration: 'none',
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        '&:hover': { color: theme.palette.primary.main },
                                    }}
                                >
                                    {creator.profile?.displayName || creator.username || 'Unknown creator'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    {new Date(meme.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Typography>
                            </Box>
                            {isAuthenticated && !isOwner && creatorId && (
                                <FollowButton userId={creatorId} />
                            )}
                        </Stack>

                        {/* Template attribution */}
                        {meme.templateInfo?.templateCreator?.username && (
                            <Typography
                                variant="caption"
                                sx={{ display: 'block', color: theme.palette.text.secondary, mb: 1.5 }}
                            >
                                Made from a template by{' '}
                                <strong>@{meme.templateInfo.templateCreator.username}</strong>
                            </Typography>
                        )}

                        {/* Tags */}
                        {Array.isArray(meme.tags) && meme.tags.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {meme.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={`#${tag}`}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                ))}
                            </Stack>
                        )}

                        {/* Stats */}
                        <Stack direction="row" spacing={3} sx={{ mb: 2.5 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <FavoriteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {meme.stats?.likesCount ?? 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    likes
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <ViewIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {meme.stats?.viewsCount ?? meme.stats?.views ?? 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    views
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <CommentIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                                <Typography sx={{ fontWeight: 700 }}>
                                    {meme.stats?.commentsCount ?? 0}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    comments
                                </Typography>
                            </Stack>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {/* Action buttons */}
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <Button
                                onClick={handleLike}
                                disabled={!isAuthenticated}
                                variant={liked ? 'contained' : 'outlined'}
                                color={liked ? 'error' : 'inherit'}
                                startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                sx={{ fontWeight: 700 }}
                            >
                                {liked ? 'Liked' : 'Like'}
                            </Button>
                            <Tooltip title="Share">
                                <IconButton onClick={handleShare} aria-label="share">
                                    <ShareIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                                <IconButton onClick={handleDownload} aria-label="download">
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                            {isAuthenticated && !isOwner && (
                                <Tooltip title="Report">
                                    <IconButton
                                        onClick={() => setReportOpen(true)}
                                        aria-label="report"
                                        sx={{ color: theme.palette.warning.main }}
                                    >
                                        <ReportIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                </Grid>
            </Grid>

            {/* Comments */}
            <Section
                title="Comments"
                subtitle="Drop a reaction, roast, or deep thought."
                icon={<CommentIcon />}
                dense
            >
                <Box
                    sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.sm,
                    }}
                >
                    <CommentSection memeId={id} />
                </Box>
            </Section>

            {/* Report dialog */}
            <Dialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        boxShadow: theme.tokens?.shadow?.lg,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Report this meme</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Reports are reviewed by moderators. Be specific so they can act quickly.
                    </Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="report-reason-label">Reason</InputLabel>
                        <Select
                            labelId="report-reason-label"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            label="Reason"
                        >
                            {REPORT_REASONS.map((reason) => (
                                <MenuItem key={reason} value={reason}>
                                    {reason}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Details (optional)"
                        multiline
                        rows={4}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="What specifically is the issue?"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setReportOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleReport}
                        disabled={!reportReason}
                        variant="contained"
                        color="warning"
                    >
                        Submit report
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snack */}
            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
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

export default MemeDetail;
