// ============================================================================
// BrowseUsers — discover and follow other creators.
// ----------------------------------------------------------------------------
// Search/sort bar at the top + responsive grid of user cards. Each card shows
// avatar, display name, bio snippet, memes/likes stats, join year, and a
// FollowButton (if logged in and looking at someone else).
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
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
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    PhotoLibrary as MemeIcon,
    Favorite as LikeIcon,
    CalendarToday as CalendarIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader,
    EmptyState,
    SkeletonCard,
    FollowButton,
} from '../components/common';

const BrowseUsers = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
    });
    const [filters, setFilters] = useState({
        page: 1,
        limit: 12,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const response = await userAPI.getUsers(filters);
                if (cancelled) return;
                setUsers(response.data.users || []);
                setPagination(response.data.pagination || { currentPage: 1, totalPages: 0, totalUsers: 0 });
            } catch {
                if (!cancelled) setUsers([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [filters]);

    const setFilter = (field, value) =>
        setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            setFilter('search', e.target.value);
        }
    };

    return (
        <Box>
            <PageHeader
                eyebrow="DISCOVER"
                title="Meet the makers"
                subtitle="Search the community, follow your favorites, and keep the feed fresh."
                icon={<PeopleIcon />}
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
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
                                placeholder="Search by username…"
                                defaultValue={filters.search}
                                onKeyDown={handleSearch}
                                onBlur={handleSearch}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Sort by</InputLabel>
                                <Select
                                    value={filters.sortBy}
                                    label="Sort by"
                                    onChange={(e) => setFilter('sortBy', e.target.value)}
                                >
                                    <MenuItem value="createdAt">Join date</MenuItem>
                                    <MenuItem value="stats.memesCreated">Memes created</MenuItem>
                                    <MenuItem value="stats.totalLikes">Total likes</MenuItem>
                                    <MenuItem value="username">Username</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Order</InputLabel>
                                <Select
                                    value={filters.sortOrder}
                                    label="Order"
                                    onChange={(e) => setFilter('sortOrder', e.target.value)}
                                >
                                    <MenuItem value="desc">Newest first</MenuItem>
                                    <MenuItem value="asc">Oldest first</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {loading ? (
                    <Grid container spacing={3}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={<PersonIcon sx={{ fontSize: 48 }} />}
                        title="No creators found"
                        description="Try a different search term or reset your filters."
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
                            {pagination.totalUsers || users.length} creator{(pagination.totalUsers || users.length) === 1 ? '' : 's'}
                        </Typography>

                        <Grid container spacing={3}>
                            {users.map((u) => (
                                <Grid item xs={12} sm={6} md={4} key={u.id}>
                                    <Box
                                        onClick={() => navigate(`/user/${u.id}`)}
                                        sx={{
                                            cursor: 'pointer',
                                            height: '100%',
                                            textAlign: 'center',
                                            p: 3,
                                            borderRadius: 3,
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
                                        <Avatar
                                            src={u.avatar}
                                            sx={{
                                                width: 88,
                                                height: 88,
                                                mx: 'auto',
                                                mb: 2,
                                                fontSize: '2.25rem',
                                                fontWeight: 900,
                                                background: theme.palette.brand?.gradient,
                                                border: `3px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                                boxShadow: theme.tokens?.shadow?.sm,
                                            }}
                                        >
                                            {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                                        </Avatar>

                                        <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }} noWrap>
                                            {u.displayName || u.username}
                                        </Typography>
                                        {u.displayName && (
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.text.secondary, mb: 1 }}
                                                noWrap
                                            >
                                                @{u.username}
                                            </Typography>
                                        )}

                                        {u.bio && (
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
                                                {u.bio}
                                            </Typography>
                                        )}

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            justifyContent="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                            sx={{ mb: 2 }}
                                        >
                                            <Chip
                                                icon={<MemeIcon />}
                                                label={u.stats?.memesCreated || 0}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                                title="Memes created"
                                            />
                                            <Chip
                                                icon={<LikeIcon />}
                                                label={u.stats?.totalLikes || 0}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                                title="Total likes"
                                            />
                                            <Chip
                                                icon={<CalendarIcon />}
                                                label={`Joined ${new Date(u.joinDate || u.createdAt || Date.now()).getFullYear()}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Stack>

                                        {currentUser && currentUser._id !== u.id && (
                                            <Box onClick={(e) => e.stopPropagation()}>
                                                <FollowButton
                                                    userId={u.id}
                                                    username={u.username}
                                                    variant="button"
                                                    size="small"
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        {pagination.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={pagination.totalPages}
                                    page={pagination.currentPage}
                                    onChange={(_, p) => setFilters((prev) => ({ ...prev, page: p }))}
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

export default BrowseUsers;
