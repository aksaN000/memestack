// ============================================================================
// MemeCard — the canonical display card for a meme.
// ----------------------------------------------------------------------------
// Used anywhere a grid of memes is shown (Gallery, Profile, Folder, Following
// feed, etc.). Takes a single `meme` object in the shape returned by the API
// and renders a consistent card with:
//   • the image (clickable → /meme/:id)
//   • title + creator
//   • category chip
//   • like button + like count + comment count
//   • optional "more" menu (passed via `menu`)
//
// Props:
//   meme         — meme object (required)
//   onLike       — (memeId, event) => void   (optional)
//   onClick      — (memeId) => void, overrides default navigation
//   showCreator  — show creator row (default: true)
//   menu         — React node rendered top-right (e.g. folder "remove" menu)
//   elevation    — use soft shadow instead of offset shadow
// ============================================================================

import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardMedia,
    Chip,
    IconButton,
    Stack,
    Typography,
    Avatar,
    Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LockIcon from '@mui/icons-material/Lock';
import { useTheme } from '@mui/material/styles';

const formatCount = (n) => {
    if (!n || n < 0) return 0;
    if (n < 1000) return n;
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
};

const MemeCard = ({
    meme,
    onLike,
    onClick,
    showCreator = true,
    menu,
    elevation = false,
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    if (!meme) return null;

    const memeId = meme.id || meme._id;
    const likeCount = meme.stats?.likesCount ?? meme.likesCount ?? 0;
    const commentCount = meme.stats?.commentsCount ?? meme.commentsCount ?? 0;
    const creator = meme.creator;
    const isPrivate = meme.isPublic === false;

    const handleCardClick = () => {
        if (onClick) return onClick(memeId);
        navigate(`/meme/${memeId}`);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        if (onLike) onLike(memeId, e);
    };

    return (
        <Card
            onClick={handleCardClick}
            sx={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxShadow: elevation
                    ? theme.tokens?.shadow?.soft
                    : theme.tokens?.shadow?.md,
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: elevation
                        ? theme.tokens?.shadow?.softLg
                        : theme.tokens?.shadow?.lg,
                },
                '&:active': {
                    transform: 'translate(1px, 1px)',
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    // Fixed 1:1 box using padding-bottom — works reliably in
                    // every browser and is stable *before* the image loads,
                    // so feed cards don't jump around on first paint.
                    pt: '100%',
                    backgroundColor: theme.palette.brand?.surfaceSubtle,
                    overflow: 'hidden',
                }}
            >
                <CardMedia
                    component="img"
                    image={meme.imageUrl}
                    alt={meme.title || 'Meme'}
                    loading="lazy"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
                {/* Badges overlayed on the image */}
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        right: 10,
                        justifyContent: 'space-between',
                        pointerEvents: 'none',
                    }}
                >
                    {meme.category && (
                        <Chip
                            size="small"
                            label={meme.category}
                            sx={{
                                pointerEvents: 'auto',
                                backgroundColor: theme.palette.background.paper,
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            }}
                        />
                    )}
                    <Box sx={{ display: 'flex', gap: 1, pointerEvents: 'auto' }}>
                        {isPrivate && (
                            <Tooltip title="Private — only you can see this">
                                <Chip
                                    size="small"
                                    icon={<LockIcon sx={{ fontSize: 14 }} />}
                                    label="Private"
                                    sx={{
                                        backgroundColor: theme.palette.background.paper,
                                        fontWeight: 700,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    }}
                                />
                            </Tooltip>
                        )}
                        {menu}
                    </Box>
                </Stack>
            </Box>

            {/* Info row */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                    flexGrow: 1,
                    borderTop: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {meme.title || 'Untitled meme'}
                </Typography>

                {showCreator && creator && (
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            width: 'fit-content',
                        }}
                        component={RouterLink}
                        to={`/users/${creator._id || creator.id}`}
                    >
                        <Avatar
                            src={creator.profile?.avatar}
                            alt={creator.username}
                            sx={{ width: 24, height: 24, fontSize: 12 }}
                        >
                            {(creator.username || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontWeight: 600,
                                '&:hover': { color: theme.palette.primary.main },
                            }}
                        >
                            @{creator.username}
                        </Typography>
                    </Stack>
                )}

                {/* Stats row (stays anchored at the bottom) */}
                <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ mt: 'auto', pt: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip title={meme.isLiked ? 'Unlike' : 'Like'}>
                        <IconButton
                            size="small"
                            onClick={handleLike}
                            sx={{
                                color: meme.isLiked ? theme.palette.error.main : theme.palette.text.secondary,
                            }}
                        >
                            {meme.isLiked
                                ? <FavoriteIcon fontSize="small" />
                                : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 20 }}>
                        {formatCount(likeCount)}
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={handleCardClick}
                        sx={{ color: theme.palette.text.secondary, ml: 1 }}
                    >
                        <ChatBubbleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 20 }}>
                        {formatCount(commentCount)}
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    {meme.createdAt && (
                        <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary, fontSize: 11 }}
                        >
                            {new Date(meme.createdAt).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric',
                            })}
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Card>
    );
};

export default MemeCard;
