// ============================================================================
// Home — marketing landing page.
// ----------------------------------------------------------------------------
// First impression of the product. Structure:
//   1. Hero — big headline, supporting copy, two CTAs, brand shape on the right.
//   2. Trending strip — show real memes pulled from the API so the site looks
//      alive on first visit.
//   3. "What you can do" — three focused feature cards (create, remix, compete).
//   4. How it works — three numbered steps.
//   5. Closing CTA.
// All colors come from the theme. No made-up stats.
// ============================================================================

import React, { useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    Stack,
    Typography,
    Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    PhotoLibrary as GalleryIcon,
    Add as CreateIcon,
    Groups as GroupsIcon,
    EmojiEvents as ChallengeIcon,
    Palette as PaletteIcon,
    Handshake as HandshakeIcon,
    ArrowForward as ArrowIcon,
    AutoAwesome as SparkleIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useMemes } from '../contexts/MemeContext';
import { Section, MemeCard, SkeletonCard } from '../components/common';

const Home = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { trendingMemes, loading, fetchTrendingMemes } = useMemes();

    useEffect(() => {
        fetchTrendingMemes(6);
    }, [fetchTrendingMemes]);

    // --------------------------------------------------------------- sections
    const renderHero = () => (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.brand?.gradientSoft,
                py: { xs: 8, md: 12 },
            }}
        >
            {/* Background sticker shapes */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: theme.palette.mode === 'light' ? 0.5 : 0.22,
                    backgroundImage: `
                        radial-gradient(circle at 12% 18%, ${theme.palette.primary.main}22 0%, transparent 40%),
                        radial-gradient(circle at 88% 82%, ${theme.palette.secondary.main}22 0%, transparent 38%)
                    `,
                }}
            />
            <Container maxWidth="lg" sx={{ position: 'relative' }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Chip
                            icon={<SparkleIcon />}
                            label="New: faster create flow + cleaner gallery"
                            sx={{
                                fontWeight: 700,
                                mb: 2.5,
                                background: theme.palette.background.paper,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                '& .MuiChip-icon': { color: theme.palette.primary.main },
                            }}
                        />
                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.04em',
                                lineHeight: 1.02,
                                fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4rem' },
                                mb: 2,
                            }}
                        >
                            Make memes.{' '}
                            <Box
                                component="span"
                                sx={{
                                    background: theme.palette.brand?.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                Ship laughs.
                            </Box>{' '}
                            Start a stack.
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '1rem', md: '1.125rem' },
                                lineHeight: 1.6,
                                maxWidth: 560,
                                mb: 4,
                            }}
                        >
                            MemeStack is the toolbox for meme creators — a canvas editor, a
                            template library, challenges, groups, and collaborations. Built
                            for people who post for the dopamine, not the clout.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                size="large"
                                variant="contained"
                                startIcon={<CreateIcon />}
                                onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
                                sx={{ fontWeight: 800 }}
                            >
                                {isAuthenticated ? 'Create a meme' : 'Get started — it\'s free'}
                            </Button>
                            <Button
                                size="large"
                                variant="outlined"
                                startIcon={<GalleryIcon />}
                                onClick={() => navigate('/gallery')}
                                sx={{ fontWeight: 800 }}
                            >
                                Explore gallery
                            </Button>
                        </Stack>
                    </Grid>

                    {/* Decorative sticker card */}
                    <Grid item xs={12} md={5}>
                        <Box
                            sx={{
                                position: 'relative',
                                aspectRatio: '1 / 1',
                                maxWidth: 420,
                                mx: 'auto',
                            }}
                        >
                            {/* Stacked sticker cards for visual interest */}
                            {[
                                { rotate: -6, accent: theme.palette.primary.main,   emoji: '🎭', top: '6%',  left: '4%',  z: 1 },
                                { rotate: 4,  accent: theme.palette.secondary.main, emoji: '🔥', top: '14%', left: '30%', z: 2 },
                                { rotate: -2, accent: theme.palette.brand?.accent,  emoji: '💯', top: '40%', left: '14%', z: 3 },
                            ].map((s, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        position: 'absolute',
                                        top: s.top,
                                        left: s.left,
                                        width: '58%',
                                        aspectRatio: '1 / 1',
                                        borderRadius: 3,
                                        border: `2px solid ${theme.palette.brand?.border}`,
                                        background: theme.palette.background.paper,
                                        boxShadow: theme.tokens?.shadow?.lg,
                                        transform: `rotate(${s.rotate}deg)`,
                                        zIndex: s.z,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ fontSize: 64, lineHeight: 1 }}>{s.emoji}</Box>
                                    <Box
                                        sx={{
                                            height: 6,
                                            width: '40%',
                                            borderRadius: 3,
                                            background: s.accent,
                                            border: `2px solid ${theme.palette.brand?.border}`,
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );

    const renderTrending = () => (
        <Container maxWidth="lg">
            <Section
                title="Trending on MemeStack"
                subtitle="What the community is liking right now."
                icon={<BoltIcon />}
                action={
                    <Button
                        endIcon={<ArrowIcon />}
                        onClick={() => navigate('/gallery')}
                        sx={{ fontWeight: 700 }}
                    >
                        See all
                    </Button>
                }
            >
                <Grid container spacing={2.5}>
                    {loading && (!trendingMemes || trendingMemes.length === 0)
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Grid key={i} item xs={12} sm={6} md={4}>
                                <SkeletonCard />
                            </Grid>
                        ))
                        : (trendingMemes || []).slice(0, 6).map((meme) => (
                            <Grid key={meme.id || meme._id} item xs={12} sm={6} md={4}>
                                <MemeCard meme={meme} />
                            </Grid>
                        ))}
                    {!loading && (!trendingMemes || trendingMemes.length === 0) && (
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    border: `2px dashed ${theme.palette.brand?.border || theme.palette.divider}`,
                                    borderRadius: 3,
                                    p: 6,
                                    textAlign: 'center',
                                    background: theme.palette.brand?.surfaceSubtle,
                                }}
                            >
                                <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', mb: 1 }}>
                                    The gallery's quiet right now.
                                </Typography>
                                <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                    Be the first to drop a banger.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<CreateIcon />}
                                    onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
                                >
                                    Post a meme
                                </Button>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Section>
        </Container>
    );

    const tints = theme.palette.brand?.tints || {};
    const features = [
        {
            icon: <PaletteIcon />,
            title: 'A canvas built for memes',
            body: 'Upload or pick a template, add text layers, drag, resize, and export clean PNGs in seconds. No Photoshop needed.',
            iconBg: theme.palette.primary.main,
            surface: tints.lavender,
            ink: tints.lavenderInk,
            cta: { label: 'Try the editor', to: isAuthenticated ? '/create' : '/register' },
        },
        {
            icon: <ChallengeIcon />,
            title: 'Challenges keep it spicy',
            body: 'Join weekly themed challenges, submit entries, vote on favorites, climb the leaderboard.',
            iconBg: theme.palette.secondary.main,
            surface: tints.rose,
            ink: tints.roseInk,
            cta: { label: 'See challenges', to: '/challenges' },
        },
        {
            icon: <HandshakeIcon />,
            title: 'Make memes with friends',
            body: 'Start a collaboration, invite others, remix in real-ish time. Groups let you build scenes together.',
            iconBg: theme.palette.brand?.accent || theme.palette.primary.main,
            surface: tints.mint,
            ink: tints.mintInk,
            cta: { label: 'Browse collabs', to: '/collaborations' },
        },
    ];

    const renderFeatures = () => (
        <Container maxWidth="lg">
            <Section
                title="What you can do here"
                subtitle="The whole loop — create, share, compete, collab — in one place."
                icon={<SparkleIcon />}
            >
                <Grid container spacing={3}>
                    {features.map((f) => (
                        <Grid key={f.title} item xs={12} md={4}>
                            <Box
                                sx={{
                                    height: '100%',
                                    p: 3.5,
                                    borderRadius: 3,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    backgroundColor: f.surface || theme.palette.background.paper,
                                    boxShadow: theme.tokens?.shadow?.md,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    transition: 'transform 160ms ease, box-shadow 160ms ease',
                                    '&:hover': {
                                        transform: 'translate(-2px, -2px)',
                                        boxShadow: theme.tokens?.shadow?.lg,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 2,
                                        border: `2px solid ${theme.palette.brand?.border}`,
                                        background: f.iconBg,
                                        color: '#fff',
                                        '& svg': { fontSize: 28 },
                                        boxShadow: theme.tokens?.shadow?.sm,
                                    }}
                                >
                                    {f.icon}
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: f.ink || 'inherit' }}>
                                    {f.title}
                                </Typography>
                                <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                                    {f.body}
                                </Typography>
                                <Box sx={{ flex: 1 }} />
                                <Button
                                    onClick={() => navigate(f.cta.to)}
                                    endIcon={<ArrowIcon />}
                                    sx={{ alignSelf: 'flex-start', fontWeight: 700, mt: 1, color: f.ink || theme.palette.primary.main }}
                                >
                                    {f.cta.label}
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Section>
        </Container>
    );

    const renderHowItWorks = () => {
        const steps = [
            { n: '01', title: 'Pick a template or upload an image', body: 'Browse the library, or start from your own photo.' },
            { n: '02', title: 'Add captions, stickers, layers', body: 'Drag, resize, and tweak until it slaps.' },
            { n: '03', title: 'Post to the gallery or a challenge', body: 'Get likes, climb the leaderboard, build a following.' },
        ];
        return (
            <Box sx={{ background: theme.palette.brand?.bgAlt, borderTop: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`, borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`, py: 6 }}>
                <Container maxWidth="lg">
                    <Section title="From blank canvas to posted banger" subtitle="Three steps. A couple of minutes. Maximum nonsense." dense>
                        <Grid container spacing={3}>
                            {steps.map((s) => (
                                <Grid key={s.n} item xs={12} md={4}>
                                    <Stack spacing={1.5}>
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 2,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `2px solid ${theme.palette.brand?.border}`,
                                                background: theme.palette.background.paper,
                                                fontWeight: 900,
                                                letterSpacing: '0.05em',
                                                fontSize: 18,
                                                color: theme.palette.primary.main,
                                                boxShadow: theme.tokens?.shadow?.sm,
                                            }}
                                        >
                                            {s.n}
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            {s.title}
                                        </Typography>
                                        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                                            {s.body}
                                        </Typography>
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                    </Section>
                </Container>
            </Box>
        );
    };

    const renderFinalCTA = () => (
        <Container maxWidth="lg" sx={{ my: { xs: 6, md: 10 } }}>
            <Box
                sx={{
                    position: 'relative',
                    borderRadius: 4,
                    border: `2px solid ${theme.palette.brand?.border}`,
                    background: theme.palette.brand?.gradient,
                    color: '#fff',
                    p: { xs: 4, md: 6 },
                    overflow: 'hidden',
                    boxShadow: theme.tokens?.shadow?.lg,
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Typography
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 900, letterSpacing: '-0.03em', mb: 1.5 }}
                        >
                            Ready to stack some memes?
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 540 }}>
                            Create a free account, drop your first meme, and start a streak.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                            <Button
                                size="large"
                                variant="contained"
                                onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
                                sx={{
                                    background: '#fff',
                                    color: theme.palette.primary.main,
                                    '&:hover': { background: '#fff', filter: 'brightness(0.95)' },
                                    fontWeight: 900,
                                }}
                            >
                                {isAuthenticated ? 'Create now' : 'Sign up free'}
                            </Button>
                            {!isAuthenticated && (
                                <Button
                                    size="large"
                                    variant="outlined"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        borderColor: '#fff',
                                        color: '#fff',
                                        '&:hover': {
                                            borderColor: '#fff',
                                            background: 'rgba(255,255,255,0.1)',
                                        },
                                        fontWeight: 800,
                                    }}
                                >
                                    I have an account
                                </Button>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );

    return (
        <Box>
            {renderHero()}
            {renderTrending()}
            {renderFeatures()}
            {renderHowItWorks()}
            {renderFinalCTA()}
        </Box>
    );
};

export default Home;
