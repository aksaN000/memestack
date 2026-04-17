// ============================================================================
// Profile — the logged-in user's own profile at /profile.
// ----------------------------------------------------------------------------
// Identity card (avatar, name, bio, join date) + stat strip + quick links to
// folders, feed, analytics, and account settings. Public-user profiles (viewed
// by *other* people) live at /users/:id and are rendered by a different page.
// ============================================================================

import React from 'react';
import {
    Box,
    Container,
    Grid,
    Stack,
    Typography,
    Button,
    Avatar,
    Chip,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Edit as EditIcon,
    Settings as SettingsIcon,
    CalendarToday as CalendarIcon,
    PhotoLibrary as GalleryIcon,
    Favorite as FavoriteIcon,
    Visibility as ViewIcon,
    Share as ShareIcon,
    FolderOpen as FolderIcon,
    Timeline as AnalyticsIcon,
    RssFeed as FeedIcon,
    Group as GroupIcon,
    EmojiEvents as ChallengeIcon,
    BookmarkBorder as BookmarkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { PageHeader, StatCard, Section } from '../components/common';

const formatDate = (value) => {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const Profile = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const stats = user?.stats || {};
    const profile = user?.profile || {};
    const userId = user?._id || user?.id;

    const statCards = [
        {
            key: 'memes',
            title: 'Memes created',
            value: stats.memesCreated ?? 0,
            icon: <GalleryIcon sx={{ color: theme.palette.primary.main }} />,
        },
        {
            key: 'likes',
            title: 'Likes received',
            value: stats.totalLikes ?? 0,
            icon: <FavoriteIcon sx={{ color: theme.palette.error.main }} />,
        },
        {
            key: 'views',
            title: 'Total views',
            value: stats.totalViews ?? 0,
            icon: <ViewIcon sx={{ color: theme.palette.info.main }} />,
        },
        {
            key: 'shares',
            title: 'Shares',
            value: stats.totalShares ?? 0,
            icon: <ShareIcon sx={{ color: theme.palette.secondary.main }} />,
        },
    ];

    const quickLinks = [
        {
            title: 'Folders',
            description: 'Organize memes into collections.',
            icon: <FolderIcon />,
            to: '/folders',
            tint: theme.palette.primary.main,
        },
        {
            title: 'Analytics',
            description: 'Likes, views, and shares over time.',
            icon: <AnalyticsIcon />,
            to: '/analytics',
            tint: theme.palette.info.main,
        },
        {
            title: 'Following feed',
            description: 'Memes from the creators you follow.',
            icon: <FeedIcon />,
            to: '/feed',
            tint: theme.palette.secondary.main,
        },
        {
            title: 'Groups',
            description: 'Your meme crews and shared boards.',
            icon: <GroupIcon />,
            to: '/groups',
            tint: theme.palette.warning.main,
        },
        {
            title: 'Challenges',
            description: 'Active weekly themes and leaderboards.',
            icon: <ChallengeIcon />,
            to: '/challenges',
            tint: theme.palette.brand?.accent || theme.palette.primary.main,
        },
        {
            title: 'Saved',
            description: 'Memes and templates you bookmarked.',
            icon: <BookmarkIcon />,
            to: '/saved',
            tint: theme.palette.success.main,
        },
    ];

    return (
        <Box>
            <PageHeader
                eyebrow="PROFILE"
                title="Your profile"
                subtitle="Your public identity on MemeStack — plus quick access to your stuff."
                actions={
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => navigate('/settings')}
                        >
                            Settings
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate('/profile/edit')}
                        >
                            Edit profile
                        </Button>
                    </>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Identity card */}
                <Box
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.md,
                        mb: 4,
                    }}
                >
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm="auto">
                            <Avatar
                                src={profile.avatar}
                                sx={{
                                    width: 112,
                                    height: 112,
                                    fontSize: '2.75rem',
                                    fontWeight: 900,
                                    background: theme.palette.brand?.gradient,
                                    border: `3px solid ${theme.palette.brand?.border}`,
                                    boxShadow: theme.tokens?.shadow?.md,
                                }}
                            >
                                {(profile.displayName || user?.username || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                            </Avatar>
                        </Grid>
                        <Grid item xs={12} sm>
                            <Stack spacing={1}>
                                <Typography
                                    variant="h4"
                                    sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}
                                >
                                    {profile.displayName || user?.username || 'You'}
                                </Typography>
                                {user?.username && (
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            color: theme.palette.text.secondary,
                                        }}
                                    >
                                        @{user.username}
                                    </Typography>
                                )}
                                {profile.bio && (
                                    <Typography
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            maxWidth: 640,
                                            mt: 0.5,
                                        }}
                                    >
                                        {profile.bio}
                                    </Typography>
                                )}
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}
                                >
                                    <Chip
                                        icon={<CalendarIcon sx={{ fontSize: 16 }} />}
                                        label={`Joined ${formatDate(user?.createdAt)}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    {user?.role && user.role !== 'user' && (
                                        <Chip
                                            label={user.role.toUpperCase()}
                                            size="small"
                                            color="secondary"
                                            sx={{ fontWeight: 800 }}
                                        />
                                    )}
                                    {userId && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => navigate(`/users/${userId}`)}
                                            sx={{ fontWeight: 700 }}
                                        >
                                            View as public
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                {/* Stats */}
                <Grid container spacing={2.5} sx={{ mb: 1 }}>
                    {statCards.map((s) => (
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

                {/* Quick links */}
                <Section
                    title="Your stuff"
                    subtitle="Jump back into the parts of MemeStack you use most."
                >
                    <Grid container spacing={2.5}>
                        {quickLinks.map((link) => (
                            <Grid key={link.title} item xs={12} sm={6} md={4}>
                                <Box
                                    onClick={() => navigate(link.to)}
                                    sx={{
                                        cursor: 'pointer',
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: theme.palette.background.paper,
                                        boxShadow: theme.tokens?.shadow?.sm,
                                        transition: 'transform 140ms ease, box-shadow 140ms ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.25,
                                        '&:hover': {
                                            transform: 'translate(-2px, -2px)',
                                            boxShadow: theme.tokens?.shadow?.md,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 2,
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                            background: link.tint,
                                            color: '#fff',
                                            boxShadow: theme.tokens?.shadow?.sm,
                                        }}
                                    >
                                        {link.icon}
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                                        {link.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        {link.description}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Section>

                {/* Account info strip */}
                <Section title="Account" subtitle="Your sign-in details. Edit in settings." dense>
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.brand?.surfaceSubtle,
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontWeight: 800,
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    USERNAME
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {user?.username || '—'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontWeight: 800,
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    EMAIL
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {user?.email || '—'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        fontWeight: 800,
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    MEMBER SINCE
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {formatDate(user?.createdAt)}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => navigate('/profile/edit')}
                            >
                                Edit profile
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => navigate('/settings')}
                            >
                                Account settings
                            </Button>
                        </Stack>
                    </Box>
                </Section>
            </Container>
        </Box>
    );
};

export default Profile;
