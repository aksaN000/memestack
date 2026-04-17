// ============================================================================
// Challenges — browse meme challenges and contests.
// ----------------------------------------------------------------------------
// Tabs: All / Trending / Mine (auth). Each tab renders a grid of
// ChallengeCard tiles. Filters bar on the "All" tab for search/category/sort.
// "Create challenge" button routes to /challenges/create for logged-in users.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Avatar,
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
    EmojiEvents,
    People,
    AccessTime,
    Add,
    Search,
    TrendingUp,
    Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { challengesAPI } from '../services/api';
import {
    PageHeader,
    EmptyState,
    SkeletonCard,
} from '../components/common';

const CATEGORIES = [
    'reaction', 'mocking', 'success', 'fail', 'advice',
    'rage', 'philosoraptor', 'first_world_problems',
    'conspiracy', 'confession', 'socially_awkward',
    'good_guy', 'scumbag', 'popular', 'classic', 'freestyle',
];

const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'popular', label: 'Most popular' },
    { value: 'ending_soon', label: 'Ending soon' },
    { value: 'featured', label: 'Featured' },
];

const STATUS_COLORS = {
    active: 'success',
    voting: 'warning',
    completed: 'default',
    draft: 'info',
};

const formatTimeRemaining = (endDate) => {
    if (!endDate) return '—';
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
};

const ChallengeCard = ({ challenge, onOpen, theme, tint }) => (
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
        {challenge.template?.imageUrl && (
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="180"
                    image={challenge.template.imageUrl}
                    alt={challenge.title}
                    sx={{ objectFit: 'cover' }}
                />
                <Chip
                    label={(challenge.status || 'draft').toUpperCase()}
                    size="small"
                    color={STATUS_COLORS[challenge.status] || 'default'}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                    }}
                />
            </Box>
        )}

        <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', mb: 1, lineHeight: 1.3 }}>
                {challenge.title}
            </Typography>
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
                {challenge.description || 'No description.'}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                    src={challenge.creator?.profile?.avatar}
                    sx={{
                        width: 28,
                        height: 28,
                        background: theme.palette.brand?.gradient,
                        fontSize: 14,
                        fontWeight: 800,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                    }}
                >
                    {(challenge.creator?.username || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    by {challenge.creator?.profile?.displayName || challenge.creator?.username || 'Unknown'}
                </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <People fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {challenge.stats?.participantCount || 0}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTime fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {formatTimeRemaining(challenge.endDate)}
                    </Typography>
                </Stack>
                {challenge.prizes?.length > 0 && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <EmojiEvents fontSize="small" sx={{ color: '#f59e0b' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                            {challenge.prizes.length} prize{challenge.prizes.length === 1 ? '' : 's'}
                        </Typography>
                    </Stack>
                )}
            </Stack>

            <Chip
                label={(challenge.category || 'general').replace(/_/g, ' ')}
                size="small"
                sx={{ textTransform: 'capitalize', fontWeight: 700, alignSelf: 'flex-start' }}
            />
        </Box>
    </Box>
);

const Challenges = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                if (tab === 1) {
                    const resp = await challengesAPI.getTrending();
                    if (!cancelled) setChallenges(resp.data || []);
                    return;
                }
                if (tab === 2) {
                    if (!user) {
                        if (!cancelled) setChallenges([]);
                        return;
                    }
                    const resp = await challengesAPI.getUserChallenges();
                    if (!cancelled) setChallenges(resp.data || []);
                    return;
                }
                const params = { page: currentPage, limit: 12, sort: sortBy };
                if (searchTerm) params.search = searchTerm;
                if (categoryFilter) params.category = categoryFilter;
                const resp = await challengesAPI.getChallenges(params);
                if (cancelled) return;
                setChallenges(resp.data?.challenges || []);
                setTotalPages(resp.data?.totalPages || 1);
            } catch (err) {
                if (!cancelled) setChallenges([]);
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
                eyebrow="CONTESTS"
                title="Meme challenges"
                subtitle="Compete in community meme contests, vote on entries, and claim bragging rights."
                icon={<EmojiEvents />}
                actions={
                    user ? (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/challenges/create')}
                            sx={{ fontWeight: 800 }}
                        >
                            Create challenge
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
                        <Tab label="All" icon={<EmojiEvents />} iconPosition="start" />
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
                                    placeholder="Search challenges…"
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
                ) : challenges.length === 0 ? (
                    <EmptyState
                        icon={<EmojiEvents sx={{ fontSize: 48 }} />}
                        title="No challenges found"
                        description={
                            tab === 2
                                ? "You haven't created any challenges yet."
                                : 'Try adjusting your filters or check back soon.'
                        }
                        action={
                            user ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => navigate('/challenges/create')}
                                >
                                    Create the first one
                                </Button>
                            ) : null
                        }
                    />
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {challenges.map((c, idx) => {
                                const t = theme.palette.brand?.tints || {};
                                const cycle = [t.lavender, t.peach, t.mint, t.sky, t.rose, t.butter];
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={c._id}>
                                        <ChallengeCard
                                            challenge={c}
                                            theme={theme}
                                            tint={cycle[idx % cycle.length]}
                                            onOpen={() => navigate(`/challenges/${c._id}`)}
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
        </Box>
    );
};

export default Challenges;
