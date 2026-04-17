// ============================================================================
// FollowingFeed — chronological feed of memes from users you follow.
// ----------------------------------------------------------------------------
// Simple grid of MemeCards. When empty, nudges the user to browse the gallery
// and follow some creators. Login required — blocked at the top otherwise.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    Pagination,
    Stack,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    RssFeed as FeedIcon,
    PersonAdd as PersonAddIcon,
    Explore as ExploreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { followAPI, memeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader,
    EmptyState,
    MemeCard,
    SkeletonCard,
} from '../components/common';

const FollowingFeed = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [memes, setMemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
    });

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError('');
                const response = await followAPI.getFollowingFeed({ page, limit: 12 });
                if (cancelled) return;
                setMemes(response.data.memes || []);
                setPagination(response.data.pagination || { currentPage: 1, totalPages: 0, totalCount: 0 });
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Failed to load feed');
                    setMemes([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user, page]);

    const handleLike = async (memeId) => {
        try {
            await memeAPI.toggleLike(memeId);
            setMemes((prev) =>
                prev.map((m) =>
                    m.id === memeId
                        ? {
                              ...m,
                              isLiked: !m.isLiked,
                              stats: {
                                  ...m.stats,
                                  likesCount: m.isLiked
                                      ? Math.max(0, (m.stats?.likesCount || 0) - 1)
                                      : (m.stats?.likesCount || 0) + 1,
                              },
                          }
                        : m,
                ),
            );
        } catch {
            /* ignore */
        }
    };

    if (!user) {
        return (
            <Box>
                <PageHeader
                    eyebrow="FOLLOWING"
                    title="Your feed"
                    subtitle="A chronological stream of memes from the creators you follow."
                    icon={<FeedIcon />}
                />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Alert severity="info" sx={{ fontWeight: 600 }}>
                        You need to be logged in to see your following feed.
                    </Alert>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                        <Button variant="contained" onClick={() => navigate('/login')}>
                            Log in
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/register')}>
                            Create account
                        </Button>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                eyebrow="FOLLOWING"
                title="Your feed"
                subtitle="Fresh memes from the creators you follow. Oldest ones drift off the end as new ones land on top."
                icon={<FeedIcon />}
                actions={
                    <Button
                        variant="outlined"
                        startIcon={<ExploreIcon />}
                        onClick={() => navigate('/gallery')}
                    >
                        Browse gallery
                    </Button>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        onClose={() => setError('')}
                        action={
                            <Button color="inherit" size="small" onClick={() => setPage(page)}>
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : memes.length === 0 ? (
                    <EmptyState
                        icon={<PersonAddIcon sx={{ fontSize: 48 }} />}
                        title="Your feed is empty"
                        description="Follow a few creators and their latest memes will show up here."
                        action={
                            <Button
                                variant="contained"
                                startIcon={<ExploreIcon />}
                                onClick={() => navigate('/gallery')}
                            >
                                Browse gallery
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mb: 2,
                                color: theme.palette.text.secondary,
                                fontWeight: 700,
                                letterSpacing: 0.6,
                                textTransform: 'uppercase',
                            }}
                        >
                            Showing {memes.length} of {pagination.totalCount || memes.length}
                        </Typography>

                        <Grid container spacing={3}>
                            {memes.map((meme) => (
                                <Grid item xs={12} sm={6} md={4} key={meme.id || meme._id}>
                                    <MemeCard
                                        meme={meme}
                                        onLike={() => handleLike(meme.id || meme._id)}
                                        onClick={() => navigate(`/meme/${meme.id || meme._id}`)}
                                        showCreator
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {pagination.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={pagination.totalPages}
                                    page={pagination.currentPage}
                                    onChange={(_, p) => setPage(p)}
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

export default FollowingFeed;
