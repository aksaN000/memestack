// ============================================================================
// AnalyticsDashboard — personal performance metrics for a signed-in creator.
// ----------------------------------------------------------------------------
// PageHeader with time-range picker, grid of StatCards, and two insight panels:
// top performing memes + category breakdown with progress bars.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Chip,
    Container,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Assessment as AnalyticsIcon,
    Comment as CommentsIcon,
    Download as DownloadsIcon,
    EmojiEvents as TrophyIcon,
    Favorite as LikesIcon,
    People as FollowersIcon,
    Share as SharesIcon,
    TrendingUp as TrendingUpIcon,
    Visibility as ViewsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    EmptyState,
    ErrorState,
    LoadingSpinner,
    PageHeader,
    StatCard,
} from '../components/common';

const AnalyticsDashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { user } = useAuth();

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await analyticsAPI.getDashboard(timeRange);
                if (cancelled) return;
                setAnalytics(response.data);
            } catch (e) {
                if (!cancelled) setError(e.message || 'Failed to load analytics');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user, timeRange]);

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info">Log in to view your analytics dashboard.</Alert>
            </Container>
        );
    }

    if (loading) {
        return <LoadingSpinner message="Crunching the numbers…" fullScreen />;
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <ErrorState
                    title="Couldn't load analytics"
                    description={error}
                />
            </Container>
        );
    }

    const overview = analytics?.overview || {};
    const growth = analytics?.growth || {};
    const topMemes = analytics?.topMemes || [];
    const categoryStats = analytics?.categoryStats || [];

    const surfaceSx = {
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: theme.tokens?.shadow?.sm,
    };

    return (
        <Box>
            <PageHeader
                eyebrow="ANALYTICS"
                title="Your performance at a glance"
                subtitle="Track reach, reactions, and audience growth over time."
                icon={<AnalyticsIcon />}
                actions={
                    <FormControl
                        size="small"
                        sx={{ minWidth: 180, background: theme.palette.background.paper, borderRadius: 2 }}
                    >
                        <InputLabel>Time range</InputLabel>
                        <Select
                            value={timeRange}
                            label="Time range"
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value={7}>Last 7 days</MenuItem>
                            <MenuItem value={30}>Last 30 days</MenuItem>
                            <MenuItem value={90}>Last 3 months</MenuItem>
                            <MenuItem value={365}>Last year</MenuItem>
                        </Select>
                    </FormControl>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total memes"
                            value={overview.totalMemes}
                            icon={<AnalyticsIcon />}
                            growth={growth.memesGrowth}
                            color="primary"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total likes"
                            value={overview.totalLikes}
                            icon={<LikesIcon />}
                            color="error"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total views"
                            value={overview.totalViews}
                            icon={<ViewsIcon />}
                            color="info"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Followers"
                            value={overview.followersCount}
                            icon={<FollowersIcon />}
                            growth={growth.followersGrowth}
                            color="success"
                            variant="detailed"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total shares"
                            value={overview.totalShares}
                            icon={<SharesIcon />}
                            color="secondary"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Downloads"
                            value={overview.totalDownloads}
                            icon={<DownloadsIcon />}
                            color="warning"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Comments"
                            value={overview.totalComments}
                            icon={<CommentsIcon />}
                            color="info"
                            variant="detailed"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Avg engagement"
                            value={overview.avgEngagement}
                            icon={<TrendingUpIcon />}
                            color="success"
                            variant="detailed"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={surfaceSx}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                                <Typography sx={{ fontWeight: 900 }}>Top performing memes</Typography>
                            </Stack>
                            {topMemes.length === 0 ? (
                                <EmptyState
                                    icon={<AnalyticsIcon sx={{ fontSize: 40 }} />}
                                    title="No memes yet"
                                    description="Create some memes to start seeing insights here."
                                />
                            ) : (
                                <Stack spacing={1.5}>
                                    {topMemes.map((meme, index) => (
                                        <Box
                                            key={meme._id}
                                            onClick={() => navigate(`/meme/${meme._id}`)}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'center',
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                                cursor: 'pointer',
                                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                                '&:hover': {
                                                    transform: 'translate(-2px, -2px)',
                                                    boxShadow: theme.tokens?.shadow?.sm,
                                                },
                                            }}
                                        >
                                            <Box sx={{ position: 'relative' }}>
                                                <Avatar
                                                    src={meme.imageUrl}
                                                    variant="rounded"
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                                    }}
                                                />
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: -8,
                                                        left: -8,
                                                        fontWeight: 900,
                                                        background: theme.palette.brand?.accent,
                                                        color: '#fff',
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 800 }} noWrap>
                                                    {meme.title}
                                                </Typography>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ mt: 0.5 }}
                                                    useFlexGap
                                                    flexWrap="wrap"
                                                >
                                                    <Chip
                                                        size="small"
                                                        icon={<LikesIcon />}
                                                        label={meme.stats?.likesCount || 0}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        icon={<ViewsIcon />}
                                                        label={meme.stats?.views || 0}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={meme.category}
                                                        sx={{ textTransform: 'capitalize' }}
                                                        color="primary"
                                                    />
                                                </Stack>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={surfaceSx}>
                            <Typography sx={{ fontWeight: 900, mb: 2 }}>
                                Category performance
                            </Typography>
                            {categoryStats.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary }}
                                >
                                    No category data yet — post more memes to see a breakdown.
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {categoryStats.map((cat) => {
                                        const percent =
                                            overview.totalMemes > 0
                                                ? Math.min((cat.count / overview.totalMemes) * 100, 100)
                                                : 0;
                                        return (
                                            <Box key={cat._id}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {cat._id}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}
                                                    >
                                                        {cat.count} memes
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percent}
                                                    sx={{ height: 8, borderRadius: 2, mb: 0.75 }}
                                                />
                                                <Stack direction="row" spacing={1}>
                                                    <Chip
                                                        size="small"
                                                        icon={<LikesIcon />}
                                                        label={cat.totalLikes || 0}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`Avg ${(cat.avgLikes || 0).toFixed(1)}`}
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default AnalyticsDashboard;
