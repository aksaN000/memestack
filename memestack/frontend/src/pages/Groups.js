// ============================================================================
// Groups — browse meme communities.
// ----------------------------------------------------------------------------
// Tabs: All / Trending / Mine (auth). Filter bar (All tab). Each group card
// shows banner, avatar, name, privacy chip, description, creator, member and
// post counts, active members preview, and category chip.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Avatar,
    AvatarGroup,
    Box,
    Button,
    CardMedia,
    Chip,
    Container,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Groups as GroupsIcon,
    People,
    Public,
    Lock,
    Add,
    Search,
    TrendingUp,
    Star,
    Verified,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { groupsAPI } from '../services/api';
import {
    PageHeader,
    EmptyState,
    SkeletonCard,
} from '../components/common';

const CATEGORIES = [
    'general', 'gaming', 'sports', 'politics', 'entertainment',
    'technology', 'science', 'art', 'music', 'education',
    'business', 'lifestyle', 'food', 'travel', 'fashion',
    'dank', 'wholesome', 'dark_humor', 'nsfw', 'regional',
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Most popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'active', label: 'Most active' },
    { value: 'featured', label: 'Featured' },
];

const PRIVACY_INFO = {
    public: { icon: <Public fontSize="small" />, color: 'success' },
    private: { icon: <Lock fontSize="small" />, color: 'error' },
    invite_only: { icon: <Lock fontSize="small" />, color: 'warning' },
};

const GroupCard = ({ group, onOpen, theme }) => {
    const privacy = PRIVACY_INFO[group.privacy] || PRIVACY_INFO.public;
    return (
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
                background: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.sm,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: theme.tokens?.shadow?.md,
                },
            }}
        >
            {group.banner ? (
                <CardMedia
                    component="img"
                    height="100"
                    image={group.banner}
                    alt={group.name}
                    sx={{ objectFit: 'cover' }}
                />
            ) : (
                <Box
                    sx={{
                        height: 100,
                        background: theme.palette.brand?.gradient,
                    }}
                />
            )}

            <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Avatar
                        src={group.avatar}
                        sx={{
                            width: 56,
                            height: 56,
                            mt: -5,
                            background: theme.palette.brand?.gradient,
                            border: `3px solid ${theme.palette.background.paper}`,
                            boxShadow: theme.tokens?.shadow?.sm,
                        }}
                    >
                        <GroupsIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography
                                sx={{ fontWeight: 900, fontSize: '1.05rem' }}
                                noWrap
                                title={group.name}
                            >
                                {group.name}
                            </Typography>
                            {group.verified && (
                                <Verified sx={{ color: theme.palette.info.main, fontSize: 18 }} />
                            )}
                            {group.featured && (
                                <Star sx={{ color: '#f59e0b', fontSize: 18 }} />
                            )}
                        </Stack>
                        <Chip
                            icon={privacy.icon}
                            label={(group.privacy || 'public').replace(/_/g, ' ')}
                            size="small"
                            color={privacy.color}
                            sx={{ mt: 0.5, textTransform: 'capitalize', fontWeight: 700 }}
                        />
                    </Box>
                </Stack>

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
                    {group.description || 'No description.'}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 1.5 }} alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <People fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {group.stats?.memberCount || 0}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                        {group.stats?.postCount || 0} posts
                    </Typography>
                </Stack>

                {group.members?.length > 0 && (
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
                            {group.members.slice(0, 4).map((m, i) => (
                                <Avatar
                                    key={i}
                                    src={m.user?.profile?.avatar}
                                    sx={{ background: theme.palette.brand?.gradient }}
                                >
                                    {(m.user?.username || '?').charAt(0).toUpperCase()}
                                </Avatar>
                            ))}
                        </AvatarGroup>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Recent members
                        </Typography>
                    </Stack>
                )}

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 'auto' }}
                >
                    <Chip
                        label={(group.category || 'general').replace(/_/g, ' ')}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                    />
                    {group.userRole && (
                        <Chip
                            label={group.userRole}
                            size="small"
                            color="primary"
                            sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                        />
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

const Groups = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('popular');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                if (tab === 1) {
                    const resp = await groupsAPI.getTrending();
                    if (!cancelled) setGroups(resp.data || []);
                    return;
                }
                if (tab === 2) {
                    if (!user) {
                        if (!cancelled) setGroups([]);
                        return;
                    }
                    const resp = await groupsAPI.getUserGroups();
                    if (!cancelled) setGroups(resp.data || []);
                    return;
                }
                const params = { page: currentPage, limit: 12, sort: sortBy };
                if (searchTerm) params.search = searchTerm;
                if (categoryFilter) params.category = categoryFilter;
                const resp = await groupsAPI.getGroups(params);
                if (cancelled) return;
                setGroups(resp.data?.groups || []);
                setTotalPages(resp.data?.totalPages || 1);
            } catch {
                if (!cancelled) setGroups([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [tab, searchTerm, categoryFilter, sortBy, currentPage, user]);

    return (
        <Box>
            <PageHeader
                eyebrow="COMMUNITIES"
                title="Meme communities"
                subtitle="Find your people — niche subreddits' vibes, but native to MemeStack."
                icon={<GroupsIcon />}
                actions={
                    user ? (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/groups/create')}
                            sx={{ fontWeight: 800 }}
                        >
                            New group
                        </Button>
                    ) : null
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
                        <Tab label="All" icon={<GroupsIcon />} iconPosition="start" />
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
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search groups…"
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
                            <Grid item xs={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={categoryFilter}
                                        label="Category"
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <MenuItem value="">All categories</MenuItem>
                                        {CATEGORIES.map((c) => (
                                            <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>
                                                {c.replace(/_/g, ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Sort by</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort by"
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
                ) : groups.length === 0 ? (
                    <EmptyState
                        icon={<GroupsIcon sx={{ fontSize: 48 }} />}
                        title="No groups found"
                        description={
                            tab === 2
                                ? "You haven't joined any groups yet."
                                : 'Try adjusting your filters or create the first one.'
                        }
                        action={
                            user ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => navigate('/groups/create')}
                                >
                                    Create a group
                                </Button>
                            ) : null
                        }
                    />
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {groups.map((g) => (
                                <Grid item xs={12} sm={6} md={4} key={g._id}>
                                    <GroupCard
                                        group={g}
                                        theme={theme}
                                        onOpen={() => navigate(`/groups/${g.slug || g._id}`)}
                                    />
                                </Grid>
                            ))}
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
        </Box>
    );
};

export default Groups;
