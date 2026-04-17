// ============================================================================
// MemeGallery — browse all public memes.
// ----------------------------------------------------------------------------
// Filter bar (search, category, sort) → grid of MemeCard → pagination.
// Drives state through MemeContext so pagination and filters persist across
// navigation (the back button from /meme/:id returns you to the same page).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Container,
    Grid,
    TextField,
    MenuItem,
    Button,
    Pagination,
    InputAdornment,
    IconButton,
    Stack,
    Chip,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    PhotoLibrary as GalleryIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useMemes } from '../contexts/MemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader,
    MemeCard,
    EmptyState,
    ErrorState,
    SkeletonCard,
} from '../components/common';

const CATEGORIES = [
    { value: 'all', label: 'All categories' },
    { value: 'funny', label: 'Funny' },
    { value: 'reaction', label: 'Reaction' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'sports', label: 'Sports' },
    { value: 'political', label: 'Political' },
    { value: 'wholesome', label: 'Wholesome' },
    { value: 'dark', label: 'Dark' },
    { value: 'trending', label: 'Trending' },
    { value: 'custom', label: 'Custom' },
];

const SORTS = [
    { value: 'createdAt',          label: 'Newest first' },
    { value: 'stats.likesCount',   label: 'Most liked' },
    { value: 'stats.views',        label: 'Most viewed' },
    { value: 'title',              label: 'A–Z' },
];

const MemeGallery = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const {
        memes,
        pagination,
        filters,
        loading,
        error,
        fetchMemes,
        setFilters,
        toggleLike,
    } = useMemes();

    // Local mirror of the search input so typing doesn't refire the API
    // on every keystroke.
    const [searchDraft, setSearchDraft] = useState(filters?.search || '');

    // Initial load + refetch on real filter changes.
    useEffect(() => {
        fetchMemes(filters);
    }, [filters, fetchMemes]);

    useEffect(() => {
        setSearchDraft(filters?.search || '');
    }, [filters?.search]);

    const hasActiveFilters = useMemo(() => {
        return (
            (filters?.search && filters.search.length > 0) ||
            (filters?.category && filters.category !== 'all')
        );
    }, [filters]);

    const applyFilter = (patch) => {
        setFilters({ ...filters, ...patch, page: 1 });
    };

    const commitSearch = () => applyFilter({ search: searchDraft.trim() });
    const clearFilters = () => {
        setSearchDraft('');
        setFilters({ ...filters, search: '', category: 'all', page: 1 });
    };

    const handlePageChange = (_, page) => {
        setFilters({ ...filters, page });
        // Scroll back to the top of the grid after paging.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLike = async (memeId, event) => {
        event?.stopPropagation();
        try {
            await toggleLike(memeId);
        } catch (err) {
            // The API layer surfaces errors as toasts elsewhere; avoid crashing.
            console.error('Failed to toggle like:', err);
        }
    };

    // ------------------------------------------------------------------- render
    const renderFilterBar = () => (
        <Box
            sx={{
                mb: 4,
                p: 2.5,
                borderRadius: 3,
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.sm,
            }}
        >
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                    <TextField
                        fullWidth
                        placeholder="Search memes by title, description, or tag"
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchDraft ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSearchDraft('');
                                            applyFilter({ search: '' });
                                        }}
                                        aria-label="clear search"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField
                        fullWidth
                        select
                        label="Category"
                        value={filters?.category || 'all'}
                        onChange={(e) => applyFilter({ category: e.target.value })}
                    >
                        {CATEGORIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField
                        fullWidth
                        select
                        label="Sort by"
                        value={filters?.sortBy || 'createdAt'}
                        onChange={(e) => applyFilter({ sortBy: e.target.value })}
                    >
                        {SORTS.map((s) => (
                            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={1}>
                    <Button fullWidth variant="contained" onClick={commitSearch}>
                        Search
                    </Button>
                </Grid>
            </Grid>

            {hasActiveFilters && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                        ACTIVE:
                    </Typography>
                    {filters?.search && (
                        <Chip
                            size="small"
                            label={`"${filters.search}"`}
                            onDelete={() => {
                                setSearchDraft('');
                                applyFilter({ search: '' });
                            }}
                        />
                    )}
                    {filters?.category && filters.category !== 'all' && (
                        <Chip
                            size="small"
                            label={filters.category}
                            onDelete={() => applyFilter({ category: 'all' })}
                            sx={{ textTransform: 'capitalize' }}
                        />
                    )}
                    <Button size="small" onClick={clearFilters} sx={{ ml: 'auto', fontWeight: 700 }}>
                        Clear all
                    </Button>
                </Stack>
            )}
        </Box>
    );

    const renderGrid = () => {
        if (error && (!memes || memes.length === 0)) {
            return (
                <ErrorState
                    title="Couldn't load the gallery"
                    description={typeof error === 'string' ? error : error?.message}
                    onRetry={() => fetchMemes(filters)}
                />
            );
        }
        if (loading && (!memes || memes.length === 0)) {
            return (
                <Grid container spacing={2.5}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Grid key={i} item xs={12} sm={6} md={4}>
                            <SkeletonCard />
                        </Grid>
                    ))}
                </Grid>
            );
        }
        if (!memes || memes.length === 0) {
            return (
                <EmptyState
                    icon="🔍"
                    title={hasActiveFilters ? 'No memes match those filters' : 'No memes posted yet'}
                    description={
                        hasActiveFilters
                            ? 'Try clearing your filters or searching for something looser.'
                            : 'Be the first to drop a meme into the gallery.'
                    }
                    action={
                        hasActiveFilters ? (
                            <Button variant="contained" onClick={clearFilters}>Clear filters</Button>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
                            >
                                Create a meme
                            </Button>
                        )
                    }
                />
            );
        }

        return (
            <Grid container spacing={2.5}>
                {memes.map((meme) => (
                    <Grid key={meme.id || meme._id} item xs={12} sm={6} md={4}>
                        <MemeCard meme={meme} onLike={handleLike} />
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box>
            <PageHeader
                eyebrow="GALLERY"
                title="Browse the meme-verse"
                subtitle="Every public meme on MemeStack, filterable and sortable so you can find the right chuckle fast."
                icon={<GalleryIcon />}
                actions={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
                    >
                        {isAuthenticated ? 'Create' : 'Sign up to post'}
                    </Button>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {renderFilterBar()}
                {renderGrid()}

                {pagination?.totalPages > 1 && (
                    <Stack alignItems="center" sx={{ mt: 5 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.currentPage || 1}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    fontWeight: 700,
                                    borderRadius: 1.5,
                                },
                            }}
                        />
                        {pagination.totalMemes !== undefined && (
                            <Typography
                                variant="caption"
                                sx={{ mt: 1.5, color: theme.palette.text.secondary }}
                            >
                                Showing page {pagination.currentPage} of {pagination.totalPages}
                                {' · '}
                                {pagination.totalMemes} meme{pagination.totalMemes === 1 ? '' : 's'}
                            </Typography>
                        )}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default MemeGallery;
