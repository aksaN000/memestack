// ============================================================================
// Dashboard — logged-in home screen.
// ----------------------------------------------------------------------------
// Shows the user's real stats (pulled from their User record), their most
// recent uploads, and three quick actions. Empty states render cleanly when
// the user hasn't posted yet.
//
// Data sources:
//   • user.stats.* — populated server-side on every login/update.
//   • memeAPI.getUserMemes() — the logged-in user's own memes (any privacy).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    Stack,
    Typography,
    Avatar,
    Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    PhotoLibrary as GalleryIcon,
    Favorite as FavoriteIcon,
    Visibility as VisibilityIcon,
    Share as ShareIcon,
    Image as ImageIcon,
    Timeline as AnalyticsIcon,
    Bolt as BoltIcon,
    ArrowForward as ArrowIcon,
    AutoAwesome as SparkleIcon,
    FolderOpen as FolderIcon,
    EmojiEvents as ChallengeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { memeAPI } from '../services/api';
import {
    PageHeader,
    Section,
    MemeCard,
    SkeletonCard,
    EmptyState,
    StatCard,
} from '../components/common';

const Dashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [recentMemes, setRecentMemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const resp = await memeAPI.getUserMemes({ limit: 6, sortBy: 'createdAt' });
                if (cancelled) return;
                // API may return either { memes: [...] } or { data: { memes: [...] } }
                const memes = resp?.memes || resp?.data?.memes || resp?.data || [];
                setRecentMemes(Array.isArray(memes) ? memes : []);
            } catch (err) {
                if (!cancelled) setLoadError(err?.message || 'Could not load your memes.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const stats = useMemo(() => {
        const s = user?.stats || {};
        return [
            { key: 'memes',  title: 'Memes created', value: s.memesCreated ?? 0, icon: <ImageIcon sx={{ color: theme.palette.primary.main }} /> },
            { key: 'likes',  title: 'Likes received', value: s.totalLikes ?? 0,  icon: <FavoriteIcon sx={{ color: theme.palette.error.main }} /> },
            { key: 'views',  title: 'Total views',    value: s.totalViews ?? 0,  icon: <VisibilityIcon sx={{ color: theme.palette.info.main }} /> },
            { key: 'shares', title: 'Shares',         value: s.totalShares ?? 0, icon: <ShareIcon sx={{ color: theme.palette.secondary.main }} /> },
        ];
    }, [user, theme]);

    const tints = theme.palette.brand?.tints || {};
    const quickActions = [
        {
            title: 'Create a meme',
            description: 'Blank canvas or a template — same fast editor.',
            icon: <AddIcon />,
            iconBg: theme.palette.primary.main,
            surface: tints.lavender,
            ink: tints.lavenderInk,
            action: () => navigate('/create'),
        },
        {
            title: 'Browse templates',
            description: 'Pick a template and go. Save favorites for later.',
            icon: <GalleryIcon />,
            iconBg: theme.palette.secondary.main,
            surface: tints.rose,
            ink: tints.roseInk,
            action: () => navigate('/templates'),
        },
        {
            title: 'See your analytics',
            description: 'Likes, views, and shares — broken down by meme.',
            icon: <AnalyticsIcon />,
            iconBg: theme.palette.brand?.accent || theme.palette.primary.main,
            surface: tints.butter,
            ink: tints.butterInk,
            action: () => navigate('/analytics'),
        },
    ];

    const discoverCards = [
        { title: 'Active challenges', desc: 'Weekly themes, voting, leaderboards.',    to: '/challenges', surface: tints.peach, ink: tints.peachInk },
        { title: 'Groups',            desc: 'Find a meme crew that fits your humor.',  to: '/groups',     surface: tints.mint,  ink: tints.mintInk },
        { title: 'Following feed',    desc: 'Only memes from creators you follow.',    to: '/feed',       surface: tints.sky,   ink: tints.skyInk },
    ];

    const hasMemes = recentMemes.length > 0;

    return (
        <Box>
            <PageHeader
                eyebrow="DASHBOARD"
                title={`Welcome back${user?.profile?.displayName || user?.username ? `, ${user?.profile?.displayName || user?.username}` : ''} 👋`}
                subtitle="Your recent activity, quick actions, and a nudge to create more."
                icon={
                    <Avatar
                        src={user?.profile?.avatar}
                        sx={{
                            width: 48,
                            height: 48,
                            fontWeight: 900,
                            background: theme.palette.brand?.gradient,
                        }}
                    >
                        {(user?.profile?.displayName || user?.username || '?').charAt(0).toUpperCase()}
                    </Avatar>
                }
                actions={
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<FolderIcon />}
                            onClick={() => navigate('/folders')}
                        >
                            Folders
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/create')}
                        >
                            Create
                        </Button>
                    </>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Stats */}
                <Grid container spacing={2.5}>
                    {stats.map((s) => (
                        <Grid key={s.key} item xs={6} md={3}>
                            <StatCard
                                variant="detailed"
                                title={s.title}
                                value={s.value}
                                icon={s.icon}
                            />
                        </Grid>
                    ))}
                </Grid>

                {/* Recent memes */}
                <Section
                    title="Your recent memes"
                    subtitle="The last six memes you uploaded — public or private."
                    icon={<BoltIcon />}
                    action={
                        hasMemes && (
                            <Button
                                endIcon={<ArrowIcon />}
                                onClick={() => navigate(`/users/${user?._id || user?.id}`)}
                            >
                                See all
                            </Button>
                        )
                    }
                >
                    {loading ? (
                        <Grid container spacing={2.5}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Grid key={i} item xs={12} sm={6} md={4}>
                                    <SkeletonCard />
                                </Grid>
                            ))}
                        </Grid>
                    ) : loadError ? (
                        <EmptyState
                            icon="⚠️"
                            title="Couldn't load your memes"
                            description={loadError}
                            action={<Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>}
                        />
                    ) : !hasMemes ? (
                        <EmptyState
                            icon="🎨"
                            title="You haven't posted a meme yet"
                            description="Drop your first one — you'll land in the gallery alongside everyone else."
                            action={
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/create')}>
                                    Create your first meme
                                </Button>
                            }
                        />
                    ) : (
                        <Grid container spacing={2.5}>
                            {recentMemes.slice(0, 6).map((meme) => (
                                <Grid key={meme.id || meme._id} item xs={12} sm={6} md={4}>
                                    <MemeCard meme={meme} />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Section>

                {/* Quick actions */}
                <Section
                    title="Jump back in"
                    subtitle="The three things most people open next."
                    icon={<SparkleIcon />}
                >
                    <Grid container spacing={2.5}>
                        {quickActions.map((qa) => (
                            <Grid key={qa.title} item xs={12} md={4}>
                                <Box
                                    onClick={qa.action}
                                    sx={{
                                        cursor: 'pointer',
                                        p: 3,
                                        borderRadius: 3,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: qa.surface || theme.palette.background.paper,
                                        boxShadow: theme.tokens?.shadow?.md,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.5,
                                        transition: 'transform 160ms ease, box-shadow 160ms ease',
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: theme.tokens?.shadow?.lg,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 2,
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                            background: qa.iconBg,
                                            color: '#fff',
                                            boxShadow: theme.tokens?.shadow?.sm,
                                            '& svg': { fontSize: 26 },
                                        }}
                                    >
                                        {qa.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: qa.ink || 'inherit' }}>
                                        {qa.title}
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.secondary }}>
                                        {qa.description}
                                    </Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography sx={{ fontWeight: 700, color: qa.ink || theme.palette.primary.main }}>
                                            Open
                                        </Typography>
                                        <ArrowIcon sx={{ fontSize: 18, color: qa.ink || theme.palette.primary.main }} />
                                    </Stack>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Section>

                {/* Discover strip */}
                <Section
                    title="Discover"
                    subtitle="Explore what's active across the platform."
                    icon={<ChallengeIcon />}
                    dense
                >
                    <Grid container spacing={2}>
                        {discoverCards.map((d) => (
                            <Grid key={d.title} item xs={12} sm={4}>
                                <Box
                                    onClick={() => navigate(d.to)}
                                    sx={{
                                        cursor: 'pointer',
                                        p: 2.5,
                                        borderRadius: 2,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: d.surface || theme.palette.brand?.surfaceSubtle,
                                        boxShadow: theme.tokens?.shadow?.sm,
                                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: theme.tokens?.shadow?.md,
                                        },
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 800, mb: 0.5, color: d.ink || 'inherit' }}>
                                        {d.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                        {d.desc}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Section>
            </Container>
        </Box>
    );
};

export default Dashboard;
