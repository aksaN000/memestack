// ============================================================================
// LoadingSpinner — a consistent loading indicator.
// ----------------------------------------------------------------------------
// Use this for any async operation where the user has to wait more than a
// moment. For skeleton-style loading of a meme grid, prefer <SkeletonCard />
// instead — it keeps the layout from jumping.
//
// Props:
//   message    — optional status text rendered below the spinner
//   size       — spinner diameter in px
//   fullScreen — when true, covers the viewport with a blurred backdrop
// ============================================================================

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const LoadingSpinner = ({
    message = 'Loading...',
    size = 40,
    fullScreen = false,
}) => {
    const theme = useTheme();

    const content = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                p: 3,
            }}
        >
            <CircularProgress size={size} thickness={5} />
            {message && (
                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (fullScreen) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                    backdropFilter: 'blur(4px)',
                    zIndex: theme.zIndex.modal + 1,
                }}
            >
                {content}
            </Box>
        );
    }

    return content;
};

export default LoadingSpinner;
