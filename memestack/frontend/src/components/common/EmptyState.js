// ============================================================================
// EmptyState — "there's nothing here yet" UI.
// ----------------------------------------------------------------------------
// Use this anywhere a list, grid, or section is empty. Gives the user a
// friendly nudge toward the primary action so empty screens don't feel like
// broken screens.
//
// Props:
//   icon       — React node rendered above the title (emoji or MUI icon)
//   title      — headline
//   description — subheading explaining the state
//   action     — primary <Button /> to take the user somewhere useful
//   secondaryAction — optional second button
//   compact    — reduces vertical padding (inside panels)
// ============================================================================

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const EmptyState = ({
    icon = '🤔',
    title = 'Nothing here yet',
    description,
    action,
    secondaryAction,
    compact = false,
}) => {
    const theme = useTheme();
    const iconNode = typeof icon === 'string' ? (
        <Box sx={{ fontSize: compact ? 48 : 72, lineHeight: 1 }}>{icon}</Box>
    ) : (
        <Box
            sx={{
                width: compact ? 56 : 80,
                height: compact ? 56 : 80,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.brand?.gradientSoft,
                color: theme.palette.primary.main,
                '& svg': { fontSize: compact ? 30 : 42 },
            }}
        >
            {icon}
        </Box>
    );

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
            <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420 }}>
                {iconNode}
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 1 }}
                >
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
                        {description}
                    </Typography>
                )}
                {(action || secondaryAction) && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                        {action}
                        {secondaryAction}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default EmptyState;
