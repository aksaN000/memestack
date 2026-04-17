// ============================================================================
// CollaborationDetail — the full view of a single collaboration project.
// ----------------------------------------------------------------------------
// Header with title/status/actions, tabbed content area (Overview / Versions /
// Contributors / Comments / Advanced), and a pile of dialogs for joining,
// inviting, forking, commenting, and publishing new versions.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Avatar,
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
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Analytics as AnalyticsIcon,
    ArrowBack as BackIcon,
    CallSplit as ForkIcon,
    Comment as CommentIcon,
    EmojiEvents as ChallengeIcon,
    Group as GroupIcon,
    History as HistoryIcon,
    People as PeopleIcon,
    Share as ShareIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { collaborationsAPI, memeAPI } from '../services/api';
import useNotifications from '../hooks/useNotifications';
import NotificationPanel from '../components/NotificationPanel';
import AdvancedCollaborationFeatures from '../components/AdvancedCollaborationFeatures';
import { EmptyState, ErrorState, LoadingSpinner } from '../components/common';

const STATUS_COLORS = {
    draft: 'info',
    active: 'success',
    reviewing: 'warning',
    voting: 'warning',
    completed: 'default',
    archived: 'default',
};

const ROLE_COLORS = {
    owner: 'error',
    admin: 'warning',
    editor: 'info',
    reviewer: 'secondary',
    contributor: 'primary',
};

const CollaborationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { user } = useAuth();

    const [collaboration, setCollaboration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const [joinOpen, setJoinOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [forkOpen, setForkOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [versionOpen, setVersionOpen] = useState(false);

    const [joinMessage, setJoinMessage] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteRole, setInviteRole] = useState('contributor');
    const [inviteMessage, setInviteMessage] = useState('');
    const [forkTitle, setForkTitle] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [versionTitle, setVersionTitle] = useState('');
    const [versionDescription, setVersionDescription] = useState('');
    const [selectedMeme, setSelectedMeme] = useState(null);
    const [userMemes, setUserMemes] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
    } = useNotifications(id);

    // --------------------------------------------------------------- loaders
    const loadCollaboration = async () => {
        try {
            setLoading(true);
            const data = await collaborationsAPI.getCollaborationById(id);
            setCollaboration(data);
        } catch (e) {
            setError(e.message || 'Failed to load collaboration');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        loadCollaboration();

        (async () => {
            try {
                const response = await memeAPI.getMyMemes();
                if (cancelled) return;
                setUserMemes(response.data?.memes || response.memes || []);
            } catch {
                /* non-fatal */
            }
        })();

        if (location.state?.forked) {
            setSuccess(location.state.message || 'Fork created successfully!');
            navigate(location.pathname, { replace: true });
        }

        const interval = setInterval(loadCollaboration, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, location.state]);

    // -------------------------------------------------------- mutation wraps
    const handleJoin = async () => {
        try {
            setSubmitting(true);
            await collaborationsAPI.joinCollaboration(id, joinMessage);
            setSuccess('Joined collaboration.');
            setJoinOpen(false);
            setJoinMessage('');
            loadCollaboration();
            addNotification({
                type: 'user_joined',
                title: 'Joined collaboration',
                message: 'You successfully joined this collaboration.',
            });
        } catch (e) {
            setError(e.message || 'Failed to join');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInvite = async () => {
        try {
            setSubmitting(true);
            await collaborationsAPI.inviteUser(id, inviteUsername, inviteRole, inviteMessage);
            setSuccess('Invitation sent.');
            setInviteOpen(false);
            setInviteUsername('');
            setInviteMessage('');
            loadCollaboration();
            addNotification({
                type: 'invitation_sent',
                title: 'Invitation sent',
                message: `Invited ${inviteUsername} as ${inviteRole}.`,
            });
        } catch (e) {
            setError(e.message || 'Failed to send invitation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFork = async () => {
        try {
            setSubmitting(true);
            const forked = await collaborationsAPI.forkCollaboration(id, forkTitle);
            setSuccess('Collaboration forked.');
            setForkOpen(false);
            setForkTitle('');
            navigate(`/collaborations/${forked._id}`, {
                state: {
                    forked: true,
                    originalTitle: collaboration.title,
                    message: 'Fork created — you can now build on top of this work.',
                },
            });
        } catch (e) {
            setError(e.message || 'Failed to fork');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComment = async () => {
        try {
            setSubmitting(true);
            await collaborationsAPI.addComment(id, { content: commentContent });
            setSuccess('Comment added.');
            setCommentOpen(false);
            setCommentContent('');
            loadCollaboration();
        } catch (e) {
            setError(e.message || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateVersion = async () => {
        try {
            setSubmitting(true);
            await collaborationsAPI.createVersion(id, {
                title: versionTitle,
                description: versionDescription,
                meme: selectedMeme,
            });
            setSuccess('New version published.');
            setVersionOpen(false);
            setVersionTitle('');
            setVersionDescription('');
            setSelectedMeme(null);
            loadCollaboration();
        } catch (e) {
            setError(e.message || 'Failed to create version');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorId) => {
        if (!window.confirm('Remove this collaborator?')) return;
        try {
            await collaborationsAPI.removeCollaborator(id, collaboratorId);
            setSuccess('Collaborator removed.');
            loadCollaboration();
        } catch (e) {
            setError(e.message || 'Failed to remove collaborator');
        }
    };

    const handleChangeRole = async (collaboratorId, currentRole) => {
        const roles = ['contributor', 'editor', 'reviewer', 'admin'];
        const newRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
        try {
            await collaborationsAPI.updateCollaboratorRole(id, collaboratorId, newRole);
            setSuccess(`Role updated to ${newRole}.`);
            loadCollaboration();
        } catch (e) {
            setError(e.message || 'Failed to update role');
        }
    };

    // ----------------------------------------------------------- permissions
    const isOwner = () =>
        collaboration && user && collaboration.owner?._id === user._id;

    const myRole = () => {
        if (!collaboration || !user) return null;
        if (isOwner()) return 'owner';
        const c = collaboration.collaborators?.find((x) => x.user._id === user._id);
        return c?.role || null;
    };

    const canCreateVersion = () => {
        const role = myRole();
        return ['owner', 'admin', 'editor', 'contributor'].includes(role);
    };

    const canInvite = () => {
        const role = myRole();
        return ['owner', 'admin'].includes(role);
    };

    // ------------------------------------------------------------- rendering
    if (loading && !collaboration) {
        return <LoadingSpinner message="Loading collaboration…" />;
    }

    if (!collaboration) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <ErrorState
                    title="Collaboration not found"
                    description="It may have been removed, or you may not have permission to view it."
                    action={
                        <Button variant="contained" onClick={() => navigate('/collaborations')}>
                            Back to collaborations
                        </Button>
                    }
                />
            </Container>
        );
    }

    // Reusable inner card
    const surfaceSx = {
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: theme.tokens?.shadow?.sm,
    };

    const mediaCard = (image, title, subtitle) => (
        <Box
            sx={{
                borderRadius: 3,
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.sm,
                overflow: 'hidden',
            }}
        >
            <Box sx={{ width: '100%', aspectRatio: '16 / 10', background: theme.palette.action.hover }}>
                <img
                    src={image}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            </Box>
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    return (
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

            {collaboration.parentCollaboration && isOwner() && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                        Welcome to your forked collaboration
                    </Typography>
                    <Typography variant="body2">
                        You're now the owner. Publish a new version, invite contributors, or
                        share the link with the community.
                    </Typography>
                </Alert>
            )}

            {/* -------------------------------- Header -------------------------------- */}
            <Box sx={{ ...surfaceSx, mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <IconButton
                        onClick={() => navigate('/collaborations')}
                        sx={{
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            '&:hover': { background: theme.palette.action.hover },
                        }}
                    >
                        <BackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            {collaboration.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Updated {new Date(collaboration.updatedAt).toLocaleString()}
                            </Typography>
                            {Date.now() - new Date(collaboration.updatedAt).getTime() < 300000 && (
                                <Chip
                                    size="small"
                                    label="Live"
                                    color="success"
                                    sx={{
                                        fontWeight: 800,
                                        animation: 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                            '0%,100%': { opacity: 1 },
                                            '50%': { opacity: 0.5 },
                                        },
                                    }}
                                />
                            )}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <NotificationPanel
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                            onClear={clearNotifications}
                        />
                        <Chip
                            label={collaboration.status.replace('_', ' ')}
                            color={STATUS_COLORS[collaboration.status] || 'default'}
                            sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                        />
                        <Chip
                            label={collaboration.type.replace('_', ' ')}
                            variant="outlined"
                            sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                        />
                    </Stack>
                </Stack>

                {collaboration.description && (
                    <Typography
                        variant="body1"
                        sx={{ color: theme.palette.text.secondary, mb: 2 }}
                    >
                        {collaboration.description}
                    </Typography>
                )}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {[
                        { label: 'Contributors', value: collaboration.stats?.totalContributors || 0 },
                        { label: 'Versions', value: collaboration.stats?.totalVersions || 0 },
                        { label: 'Views', value: collaboration.stats?.totalViews || 0 },
                        { label: 'Forks', value: collaboration.stats?.totalForks || 0 },
                    ].map((stat) => (
                        <Grid item xs={6} sm={3} key={stat.label}>
                            <Box
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    borderRadius: 2,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    background:
                                        theme.palette.brand?.surfaceSubtle || theme.palette.action.hover,
                                }}
                            >
                                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem' }}>
                                    {stat.value}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {stat.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {user && !collaboration.isCollaborator && collaboration.status === 'active' && (
                        <Button
                            variant="contained"
                            startIcon={<GroupIcon />}
                            onClick={() => setJoinOpen(true)}
                            sx={{ fontWeight: 800 }}
                        >
                            Join collaboration
                        </Button>
                    )}
                    {canCreateVersion() && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setVersionOpen(true)}
                            sx={{ fontWeight: 800 }}
                        >
                            New version
                        </Button>
                    )}
                    {canInvite() && (
                        <Button
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            onClick={() => setInviteOpen(true)}
                            sx={{ fontWeight: 800 }}
                        >
                            Invite
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<ForkIcon />}
                        onClick={() => setForkOpen(true)}
                        sx={{ fontWeight: 800 }}
                    >
                        Fork
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<CommentIcon />}
                        onClick={() => setCommentOpen(true)}
                        sx={{ fontWeight: 800 }}
                    >
                        Comment
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ShareIcon />}
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setSuccess('Link copied to clipboard.');
                        }}
                        sx={{ fontWeight: 800 }}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>

            {/* -------------------------------- Tabs ---------------------------------- */}
            <Box sx={{ ...surfaceSx, p: 0 }}>
                <Box sx={{ borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}` }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ px: 2 }}
                    >
                        <Tab label="Overview" sx={{ fontWeight: 800 }} />
                        <Tab label="Versions" sx={{ fontWeight: 800 }} />
                        <Tab label="Contributors" sx={{ fontWeight: 800 }} />
                        <Tab label="Comments" sx={{ fontWeight: 800 }} />
                        <Tab
                            icon={<AnalyticsIcon />}
                            iconPosition="start"
                            label="Advanced"
                            sx={{ fontWeight: 800 }}
                        />
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {/* ----- Overview ----- */}
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Box sx={surfaceSx}>
                                    <Typography sx={{ fontWeight: 900, mb: 1 }}>
                                        Collaboration progress
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: theme.palette.text.secondary, mb: 2 }}
                                    >
                                        {collaboration.status.charAt(0).toUpperCase() +
                                            collaboration.status.slice(1)}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={
                                            collaboration.status === 'draft'
                                                ? 25
                                                : collaboration.status === 'active'
                                                ? 75
                                                : collaboration.status === 'reviewing'
                                                ? 90
                                                : collaboration.status === 'completed'
                                                ? 100
                                                : 50
                                        }
                                        sx={{ height: 10, borderRadius: 2 }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                {collaboration.currentVersion?.meme
                                    ? mediaCard(
                                          collaboration.currentVersion.meme.imageUrl,
                                          collaboration.currentVersion.title,
                                          collaboration.currentVersion.description
                                      )
                                    : collaboration.originalMeme
                                    ? mediaCard(
                                          collaboration.originalMeme.imageUrl,
                                          collaboration.originalMeme.title,
                                          'Original meme for this collaboration'
                                      )
                                    : (
                                        <Box
                                            sx={{
                                                height: 320,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 3,
                                                border: `2px dashed ${theme.palette.brand?.border || theme.palette.divider}`,
                                                background: theme.palette.action.hover,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                No content yet — start contributing!
                                            </Typography>
                                        </Box>
                                    )}
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Stack spacing={2}>
                                    <Box sx={surfaceSx}>
                                        <Typography sx={{ fontWeight: 900, mb: 1.5 }}>Owner</Typography>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar
                                                src={collaboration.owner?.profile?.avatar}
                                                sx={{
                                                    bgcolor: theme.palette.brand?.accent,
                                                    fontWeight: 900,
                                                }}
                                            >
                                                {collaboration.owner?.username?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800 }}>
                                                    {collaboration.owner?.profile?.displayName ||
                                                        collaboration.owner?.username}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    @{collaboration.owner?.username}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {collaboration.challenge && (
                                        <Box sx={surfaceSx}>
                                            <Typography sx={{ fontWeight: 900, mb: 1 }}>
                                                <ChallengeIcon
                                                    fontSize="small"
                                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                                />
                                                Challenge
                                            </Typography>
                                            <Typography variant="body2">
                                                {collaboration.challenge.title}
                                            </Typography>
                                        </Box>
                                    )}

                                    {collaboration.group && (
                                        <Box sx={surfaceSx}>
                                            <Typography sx={{ fontWeight: 900, mb: 1 }}>
                                                <GroupIcon
                                                    fontSize="small"
                                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                                />
                                                Group
                                            </Typography>
                                            <Typography variant="body2">
                                                {collaboration.group.name}
                                            </Typography>
                                        </Box>
                                    )}

                                    {collaboration.tags?.length > 0 && (
                                        <Box sx={surfaceSx}>
                                            <Typography sx={{ fontWeight: 900, mb: 1 }}>Tags</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {collaboration.tags.map((t) => (
                                                    <Chip
                                                        key={t}
                                                        label={t}
                                                        size="small"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>
                    )}

                    {/* ----- Versions ----- */}
                    {activeTab === 1 && (
                        <Box>
                            {canCreateVersion() && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setVersionOpen(true)}
                                    sx={{ mb: 3, fontWeight: 800 }}
                                >
                                    Create new version
                                </Button>
                            )}
                            {collaboration.versions?.length > 0 ? (
                                <Grid container spacing={2}>
                                    {collaboration.versions.map((v) => (
                                        <Grid item xs={12} sm={6} md={4} key={v._id}>
                                            <Box
                                                sx={{
                                                    borderRadius: 3,
                                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                                    background: theme.palette.background.paper,
                                                    boxShadow: theme.tokens?.shadow?.sm,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {v.meme?.imageUrl && (
                                                    <Box
                                                        sx={{
                                                            width: '100%',
                                                            aspectRatio: '16 / 10',
                                                            background: theme.palette.action.hover,
                                                        }}
                                                    >
                                                        <img
                                                            src={v.meme.imageUrl}
                                                            alt={v.title}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                                <Box sx={{ p: 2 }}>
                                                    <Stack
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={1}
                                                        sx={{ mb: 1 }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label={`v${v.version}`}
                                                            sx={{ fontWeight: 800 }}
                                                        />
                                                        {v.isCurrent && (
                                                            <Chip
                                                                size="small"
                                                                label="Current"
                                                                color="primary"
                                                                sx={{ fontWeight: 800 }}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Typography sx={{ fontWeight: 900 }}>
                                                        {v.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            mb: 1.5,
                                                        }}
                                                    >
                                                        {v.description}
                                                    </Typography>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                    >
                                                        <Avatar
                                                            src={v.createdBy?.profile?.avatar}
                                                            sx={{ width: 24, height: 24 }}
                                                        >
                                                            {v.createdBy?.username?.[0]?.toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="caption">
                                                            {v.createdBy?.username} ·{' '}
                                                            {new Date(v.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <EmptyState
                                    icon={<HistoryIcon sx={{ fontSize: 48 }} />}
                                    title="No versions yet"
                                    description="Contribute a version to this collaboration to get things moving."
                                />
                            )}
                        </Box>
                    )}

                    {/* ----- Contributors ----- */}
                    {activeTab === 2 && (
                        <Box>
                            {collaboration.pendingInvites?.length > 0 && (
                                <>
                                    <Typography sx={{ fontWeight: 900, mb: 2 }}>
                                        Pending invites
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        {collaboration.pendingInvites.map((invite) => (
                                            <Grid item xs={12} sm={6} md={4} key={invite._id}>
                                                <Box
                                                    sx={{
                                                        ...surfaceSx,
                                                        borderStyle: 'dashed',
                                                        borderColor: 'warning.main',
                                                    }}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={2}
                                                        alignItems="center"
                                                    >
                                                        <Avatar src={invite.user?.profile?.avatar}>
                                                            {invite.user?.username?.[0]?.toUpperCase()}
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography sx={{ fontWeight: 800 }}>
                                                                {invite.user?.profile?.displayName ||
                                                                    invite.user?.username}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ color: theme.palette.text.secondary }}
                                                            >
                                                                @{invite.user?.username}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={`${invite.role} · pending`}
                                                            color="warning"
                                                            size="small"
                                                            sx={{ fontWeight: 800 }}
                                                        />
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Divider sx={{ my: 3 }} />
                                </>
                            )}

                            <Typography sx={{ fontWeight: 900, mb: 2 }}>Team members</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box sx={surfaceSx}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar
                                                src={collaboration.owner?.profile?.avatar}
                                                sx={{ bgcolor: theme.palette.brand?.accent }}
                                            >
                                                {collaboration.owner?.username?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography sx={{ fontWeight: 800 }}>
                                                    {collaboration.owner?.profile?.displayName ||
                                                        collaboration.owner?.username}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    @{collaboration.owner?.username}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                color="error"
                                                label="Owner"
                                                sx={{ fontWeight: 800 }}
                                            />
                                        </Stack>
                                    </Box>
                                </Grid>
                                {collaboration.collaborators?.map((c) => (
                                    <Grid item xs={12} sm={6} md={4} key={c.user._id}>
                                        <Box sx={surfaceSx}>
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="center"
                                                sx={{ mb: 1.5 }}
                                            >
                                                <Avatar src={c.user?.profile?.avatar}>
                                                    {c.user?.username?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography sx={{ fontWeight: 800 }}>
                                                        {c.user?.profile?.displayName ||
                                                            c.user?.username}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: theme.palette.text.secondary }}
                                                    >
                                                        @{c.user?.username}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={c.role}
                                                    color={ROLE_COLORS[c.role] || 'default'}
                                                    sx={{ fontWeight: 800 }}
                                                />
                                            </Stack>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                Joined {new Date(c.joinedAt).toLocaleDateString()}
                                            </Typography>
                                            {(isOwner() || myRole() === 'admin') &&
                                                collaboration.owner?._id !== c.user._id && (
                                                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() =>
                                                                handleChangeRole(c.user._id, c.role)
                                                            }
                                                        >
                                                            Change role
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={() =>
                                                                handleRemoveCollaborator(c.user._id)
                                                            }
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Stack>
                                                )}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* ----- Comments ----- */}
                    {activeTab === 3 && (
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<CommentIcon />}
                                onClick={() => setCommentOpen(true)}
                                sx={{ mb: 3, fontWeight: 800 }}
                            >
                                Add comment
                            </Button>
                            {collaboration.comments?.length > 0 ? (
                                <Stack spacing={2}>
                                    {collaboration.comments.map((c) => (
                                        <Box key={c._id} sx={surfaceSx}>
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="center"
                                                sx={{ mb: 1 }}
                                            >
                                                <Avatar
                                                    src={c.user?.profile?.avatar}
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    {c.user?.username?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 800 }}>
                                                    {c.user?.username}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        ml: 'auto !important',
                                                    }}
                                                >
                                                    {new Date(c.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2">{c.content}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <EmptyState
                                    icon={<CommentIcon sx={{ fontSize: 48 }} />}
                                    title="No comments yet"
                                    description="Be the first to share your thoughts on this collaboration."
                                />
                            )}
                        </Box>
                    )}

                    {/* ----- Advanced ----- */}
                    {activeTab === 4 && (
                        <AdvancedCollaborationFeatures
                            collaborationId={id}
                            user={user}
                            onRefresh={loadCollaboration}
                        />
                    )}
                </Box>
            </Box>

            {/* -------------------------------- Dialogs ------------------------------- */}
            <Dialog
                open={versionOpen}
                onClose={() => setVersionOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>
                    <AddIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Create a new version
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Version title"
                            value={versionTitle}
                            onChange={(e) => setVersionTitle(e.target.value)}
                            placeholder="e.g., Added better text styling"
                            required
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="What did you improve?"
                            value={versionDescription}
                            onChange={(e) => setVersionDescription(e.target.value)}
                        />
                        <Autocomplete
                            options={userMemes}
                            getOptionLabel={(option) => option.title || 'Untitled meme'}
                            value={selectedMeme}
                            onChange={(_, newValue) => setSelectedMeme(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select your enhanced meme"
                                    required
                                    helperText="Choose one of your memes to represent this contribution"
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box
                                    component="li"
                                    {...props}
                                    sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                                >
                                    <img
                                        src={option.imageUrl}
                                        alt={option.title}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: 'cover',
                                            borderRadius: 4,
                                        }}
                                    />
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {option.title || 'Untitled'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: theme.palette.text.secondary }}
                                        >
                                            {new Date(option.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        />
                        {userMemes.length === 0 && (
                            <Alert severity="warning">
                                You don't have any memes yet.{' '}
                                <Button size="small" onClick={() => navigate('/create')}>
                                    Create one
                                </Button>
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setVersionOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateVersion}
                        disabled={!versionTitle.trim() || !selectedMeme || submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{ fontWeight: 800 }}
                    >
                        {submitting ? 'Publishing…' : 'Publish version'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={joinOpen} onClose={() => setJoinOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 900 }}>Join collaboration</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Message (optional)"
                        placeholder="Why would you like to join?"
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setJoinOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleJoin}
                        disabled={submitting}
                        sx={{ fontWeight: 800 }}
                    >
                        {submitting ? <CircularProgress size={18} /> : 'Join'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Invite collaborator</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={inviteUsername}
                            onChange={(e) => setInviteUsername(e.target.value)}
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                label="Role"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                            >
                                <MenuItem value="contributor">Contributor</MenuItem>
                                <MenuItem value="editor">Editor</MenuItem>
                                <MenuItem value="reviewer">Reviewer</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Invitation message (optional)"
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleInvite}
                        disabled={!inviteUsername || submitting}
                        sx={{ fontWeight: 800 }}
                    >
                        {submitting ? <CircularProgress size={18} /> : 'Send invite'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={forkOpen} onClose={() => setForkOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 900 }}>
                    <ForkIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Fork this collaboration
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Forking creates your own copy. You become the owner and can invite your
                        own collaborators, publish versions, or take the project in a new
                        direction.
                    </Alert>
                    <TextField
                        fullWidth
                        label="Fork title"
                        value={forkTitle}
                        onChange={(e) => setForkTitle(e.target.value)}
                        placeholder={`Fork of ${collaboration?.title || 'this collaboration'}`}
                        helperText="Leave empty to use a default title."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setForkOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleFork}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <ForkIcon />}
                        sx={{ fontWeight: 800 }}
                    >
                        {submitting ? 'Forking…' : 'Create fork'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Add a comment</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Comment"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Share your thoughts…"
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCommentOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleComment}
                        disabled={!commentContent.trim() || submitting}
                        sx={{ fontWeight: 800 }}
                    >
                        {submitting ? <CircularProgress size={18} /> : 'Post comment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CollaborationDetail;
