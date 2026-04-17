// ============================================================================
// SkeletonCard — loading placeholder shaped like a MemeCard.
// ----------------------------------------------------------------------------
// Use this while a grid of memes is loading. Renders with the same dimensions
// and structure as MemeCard so the layout doesn't jump when real data
// arrives.
//
// Props:
//   count — number of skeleton cards to render (returned inside a fragment)
//   aspect — image aspect ratio (default: '1 / 1')
// ============================================================================

import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const OneSkeleton = ({ aspect }) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.md,
            }}
        >
            <Skeleton
                variant="rectangular"
                sx={{
                    width: '100%',
                    aspectRatio: aspect,
                    borderRadius: 0,
                }}
            />
            <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={20} />
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width={60} height={26} />
                    <Skeleton variant="rounded" width={48} height={26} />
                    <Skeleton variant="rounded" width={54} height={26} />
                </Stack>
            </Box>
        </Box>
    );
};

const SkeletonCard = ({ count = 1, aspect = '1 / 1' }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <OneSkeleton key={i} aspect={aspect} />
            ))}
        </>
    );
};

export default SkeletonCard;
