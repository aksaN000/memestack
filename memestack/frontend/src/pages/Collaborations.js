// ============================================================================
// Collaborations — browse remixes, joint projects, and community collab work.
// ----------------------------------------------------------------------------
// Tabs: All / Trending / Mine (auth). Filter bar on All (search, type, status,
// sort). Pending invites dialog for logged-in users. Each card shows type
// icon, title, status chip, participant stack, and a "publish" action for
// draft owners.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    Avatar,
    AvatarGroup,
    Box,
    Button,
    CardMedia,
    Chip,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Handshake,
    People,
    Shuffle,
    Add,
    Search,
    TrendingUp,
    Star,
    Palette,
    Notifications,
    Publish as PublishIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { collaborationsAPI } from '../services/api';
import PendingInvites from '../components/PendingInvites';
import {
    PageHeader,
    EmptyState,
    SkeletonCard,
} from '../components/common';

const TYPES = [
    { value: 'remix', label: 'Remix', icon: <Shuffle fontSize="small" /> },
    { value: 'collaboration', label: 'Collaboration', icon: <Handshake fontSize="small" /> },
    { value: 'template_creation', label: 'Template creation', icon: <Palette fontSize="small" /> },
    { value: 'challenge_response', label: 'Challenge response', icon: <Star fontSize="small" /> },
];

const STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'popular', label: 'Most popular' },
    { value: 'active', label: 'Most active' },
];

const STATUS_COLORS = {
    active: 'success',
    reviewing: 'warning',
    completed: 'info',
    draft: 'default',
};

const getTypeIcon = (type) => TYPES.find((t) => t.value === type)?.icon || <Handshake fontSize="small" />;

const CollaborationCard = ({ collaboration, onOpen, onPublish, theme, isOwner, tint }) => (
    <Box
        onClick={onOpen}
        sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
            background: tint || theme.palette.background.paper,
            boxShadow: theme.tokens?.shadow?.md,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
                transform: 'translate(-2px, -2px)',
                boxShadow: theme.tokens?.shadow?.lg,
            },
        }}
    >
        {collaboration.originalMeme?.imageUrl && (
            <CardMedia
                component="img"
                height="160"
                image={collaboration.originalMeme.imageUrl}
                alt={collaboration.title}
                sx={{ objectFit: 'cover' }}
            />
        )}

        <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Stack
                direction="row"
                spacing={1}
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ mb: 1 }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    {getTypeIcon(collaboration.type)}
                    <Typography sx={{ fontWeight: 900, fontSize: '1.05rem' }} noWrap>
                        {collaboration.title}
                    </Typography>
                </Stack>
                <Chip
                    label={(collaboration.status || 'draft').toUpperCase()}
                    size="small"
                    color={STATUS_COLORS[collaboration.status] || 'default'}
                    sx={{ fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }}
                />
            </Stack>

            <Chip
                label={(collaboration.type || 'collaboration').replace(/_/g, ' ')}
                size="small"
                sx={{ textTransform: 'capitalize', fontWeight: 700, alignSelf: 'flex-start', mb: 1.5 }}
            />

            <Typography
                variant="body2"
                sx={{
                    color: theme.palette.text.secondary,
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 40,
                }}
            >
                {collaboration.description || 'No description.'}
            </Typography>

            {collaboration.participants?.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <AvatarGroup
                        max={4}
                        sx={{
                            '& .MuiAvatar-root': {
                                width: 26,
                                height: 26,
                                fontSize: 12,
                                border: `2px solid ${theme.palette.background.paper}`,
                            },
                        }}
                    >
                        {collaboration.participants.slice(0, 4).map((p, i) => (
                            <Avatar
                                key={i}
                                src={p.user?.profile?.avatar}
                                sx={{ background: theme.palette.brand?.gradient }}
                            >
                                {(p.user?.username || '?').charAt(0).toUpperCase()}
                            </Avatar>
                        ))}
                    </AvatarGroup>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                        {collaboration.participants.length} participant{collaboration.participants.length === 1 ? '' : 's'}
                    </Typography>
                </Stack>
            )}

            {collaboration.originalMeme && (
                <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', mb: 1 }}
                    noWrap
                >
                    Based on: {collaboration.originalMeme.title}
                </Typography>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 1 }} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <People fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {collaboration.stats?.participantCount || collaboration.participants?.length || 0}
                    </Typography>
                </Stack>
                {isOwner && collaboration.status === 'draft' && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PublishIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPublish(collaboration._id);
                        }}
                        sx={{ ml: 'auto', fontWeight: 700 }}
                    >
                        Publish
                    </Button>
                )}
            </Stack>
        </Box>
    </Box>
);

const Collaborations = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [collaborations, setCollaborations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [invitesOpen, setInvitesOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const fetchCollaborations = useCallback(async () => {
        try {
            setLoading(true);
            if (tab === 1) {
                const response = await collaborationsAPI.getTrending();
                const data = response?.data || response?.collaborations || [];
                setCollaborations(Array.isArray(data) ? data : []);
                return;
            }
            if (tab === 2) {
                if (!user) {
                    setCollaborations([]);
                    return;
                }
                const response = await collaborationsAPI.getUserCollaborations();
                const data = response?.data || response?.collaborations || [];
                setCollaborations(Array.isArray(data) ? data : []);
                return;
            }
            const params = { page: currentPage, limit: 12, sort: sortBy };
            if (searchTerm) params.search = searchTerm;
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const response = await collaborationsAPI.getCollaborations(params);
            const data = response?.collaborations || response?.data?.collaborations || [];
            setCollaborations(Array.isArray(data) ? data : []);
            setTotalPages(response?.totalPages || response?.data?.totalPages || 1);
        } catch {
            setCollaborations([]);
        } finally {
            setLoading(false);
        }
    }, [tab, searchTerm, typeFilter, statusFilter, sortBy, currentPage, user]);

    useEffect(() => {
        fetchCollaborations();
    }, [fetchCollaborations]);

    const handlePublish = async (id) => {
        try {
            await collaborationsAPI.updateCollaboration(id, {
                status: 'active',
                'settings.isPublic': true,
            });
            fetchCollaborations();
        } catch {
            /* swallow */
        }
    };

    return (
        <Box>
            <PageHeader
                eyebrow="COLLABORATE"
                title="Collaborations"
                subtitle="Remix memes, team up on templates, and reply to challenges — all in one place."
                icon={<Handshake />}
                actions={
                    <Stack direction="row" spacing={1}>
                        {user && (
                            <Tooltip title="Pending invites">
                                <IconButton
                                    onClick={() => setInvitesOpen(true)}
                                    sx={{
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    }}
                                >
                                    <Notifications />
                                </IconButton>
                            </Tooltip>
                        )}
                        {user && (
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setCreateOpen(true)}
                                sx={{ fontWeight: 800 }}
                            >
                                New collab
                            </Button>
                        )}
                    </Stack>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.sm,
                        overflow: 'hidden',
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={(_, v) => {
                            setTab(v);
                            setCurrentPage(1);
                        }}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '1rem' },
                        }}
                    >
                        <Tab label="All" icon={<Handshake />} iconPosition="start" />
                        <Tab label="Trending" icon={<TrendingUp />} iconPosition="start" />
                        {user && <Tab label="Mine" icon={<Star />} iconPosition="start" />}
                    </Tabs>
                </Box>

                {tab === 0 && (
                    <Box
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 3,
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            boxShadow: theme.tokens?.shadow?.sm,
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search collaborations…"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={typeFilter}
                                        label="Type"
                                        onChange={(e) => {
                                            setTypeFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <MenuItem value="">All types</MenuItem>
                                        {TYPES.map((t) => (
                                            <MenuItem key={t.value} value={t.value}>
                                                {t.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <MenuItem value="">All statuses</MenuItem>
                                        {STATUSES.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>
                                                {s.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Sort</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort"
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {SORT_OPTIONS.map((o) => (
                                            <MenuItem key={o.value} value={o.value}>
                                                {o.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : collaborations.length === 0 ? (
                    <EmptyState
                        icon={<Handshake sx={{ fontSize: 48 }} />}
                        title="No collaborations here"
                        description={
                            tab === 2
                                ? "You haven't started any collabs yet."
                                : 'Be the first to kick one off — remix a meme or start a joint template.'
                        }
                        action={
                            user ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => setCreateOpen(true)}
                                >
                                    Start a collab
                                </Button>
                            ) : null
                        }
                    />
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {collaborations.map((c, idx) => {
                                const isOwner = user && c.createdBy && (c.createdBy === user._id || c.createdBy?._id === user._id);
                                const t = theme.palette.brand?.tints || {};
                                const cycle = [t.rose, t.sky, t.butter, t.mint, t.lavender, t.peach];
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={c._id}>
                                        <CollaborationCard
                                            collaboration={c}
                                            theme={theme}
                                            isOwner={isOwner}
                                            tint={cycle[idx % cycle.length]}
                                            onOpen={() => navigate(`/collaborations/${c._id}`)}
                                            onPublish={handlePublish}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {tab === 0 && totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, p) => setCurrentPage(p)}
                                    color="primary"
                                    size="large"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>

            {/* Pending invites dialog */}
            <Dialog
                open={invitesOpen}
                onClose={() => setInvitesOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Pending invites</DialogTitle>
                <DialogContent dividers>
                    <PendingInvites onClose={() => setInvitesOpen(false)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInvitesOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Start collab dialog — lets user pick a type */}
            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>What kind of collab?</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        {TYPES.map((t) => (
                            <Grid item xs={12} sm={6} key={t.value}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={t.icon}
                                    onClick={() => {
                                        setCreateOpen(false);
                                        navigate(`/collaborations/create?type=${t.value}`);
                                    }}
                                    sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 700 }}
                                >
                                    {t.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Collaborations;
