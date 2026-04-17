// ============================================================================
// ErrorState — consistent failure UI.
// ----------------------------------------------------------------------------
// Whenever an API call fails, a page can't render, or something goes wrong,
// use this component instead of an ad-hoc <Typography color="error" />.
// Keeps the message + "try again" action in the same shape across the app.
//
// Props:
//   title       — headline (default: "Something went sideways")
//   description — details / the caught error's message
//   onRetry     — if provided, shows a "Try again" button that calls it
//   action      — custom action button (replaces onRetry if provided)
//   compact     — reduces vertical padding for panels
// ============================================================================

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';

const ErrorState = ({
    title = 'Something went sideways',
    description,
    onRetry,
    action,
    compact = false,
    icon = '💥',
}) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                textAlign: 'center',
                py: compact ? 5 : 8,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Stack spacing={2} alignItems="center" sx={{ maxWidth: 460 }}>
                <Box sx={{ fontSize: compact ? 48 : 72, lineHeight: 1 }}>{icon}</Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {title}
                </Typography>
                {description && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                        }}
                    >
                        {typeof description === 'string' ? description : 'An unexpected error occurred.'}
                    </Typography>
                )}
                {action
                    ? action
                    : onRetry && (
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={onRetry}
                            sx={{ mt: 1 }}
                        >
                            Try again
                        </Button>
                    )}
            </Stack>
        </Box>
    );
};

export default ErrorState;
