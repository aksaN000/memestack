// ============================================================================
// Section — a titled content block inside a page.
// ----------------------------------------------------------------------------
// Use Section to group related content on a page (e.g. "Recent memes",
// "Your folders"). Renders a consistent title + optional subtitle +
// optional right-aligned action, then your children below.
//
// Props:
//   title      — section heading
//   subtitle   — optional supporting copy
//   action     — optional right-aligned node (usually a Button)
//   icon       — optional icon rendered left of the title
//   dense      — tighter margins
//   noPadding  — drops horizontal padding if the section is full-bleed
// ============================================================================

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Section = ({ title, subtitle, action, icon, dense = false, noPadding = false, children, sx = {} }) => {
    const theme = useTheme();

    return (
        <Box
            component="section"
            sx={{
                mt: dense ? 3 : 5,
                mb: dense ? 3 : 5,
                ...sx,
            }}
        >
            {(title || action) && (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    sx={{ mb: dense ? 2 : 3, px: noPadding ? 0 : 0 }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {icon && (
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1.5,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    background: theme.palette.brand?.gradientSoft,
                                    color: theme.palette.primary.main,
                                    '& svg': { fontSize: 22 },
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                        <Box>
                            {title && (
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '-0.02em',
                                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                                    }}
                                >
                                    {title}
                                </Typography>
                            )}
                            {subtitle && (
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                                >
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
                </Stack>
            )}
            {children}
        </Box>
    );
};

export default Section;
