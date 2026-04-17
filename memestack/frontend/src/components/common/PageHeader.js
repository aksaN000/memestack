// ============================================================================
// PageHeader — consistent title block for every page.
// ----------------------------------------------------------------------------
// Every page should open with <PageHeader ... /> below the navbar so titles,
// spacing, and the right-aligned action button look identical everywhere.
//
// Props:
//   eyebrow   — short uppercase label above title (e.g. "GALLERY", "PROFILE")
//   title     — main heading text (string or node)
//   subtitle  — supporting copy below the title
//   actions   — React node rendered top-right (buttons, menus, etc.)
//   icon      — small icon rendered left of the title
//   dense     — tighter vertical padding for auxiliary pages
//   gradient  — when true, the title text is filled with the brand gradient
// ============================================================================

import React from 'react';
import { Box, Container, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const PageHeader = ({
    eyebrow,
    title,
    subtitle,
    actions,
    icon,
    dense = false,
    gradient = false,
    maxWidth = 'lg',
}) => {
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down('sm'));

    const titleSx = {
        fontWeight: 900,
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
        fontSize: isSm ? '2rem' : '2.75rem',
        ...(gradient && {
            background: theme.palette.brand?.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        }),
    };

    return (
        <Box
            component="header"
            sx={{
                pt: dense ? 4 : 6,
                pb: dense ? 3 : 5,
                borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.brand?.bgAlt || theme.palette.background.default,
            }}
        >
            <Container maxWidth={maxWidth}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={3}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    justifyContent="space-between"
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {eyebrow && (
                            <Typography
                                variant="overline"
                                sx={{
                                    color: theme.palette.primary.main,
                                    fontWeight: 800,
                                    letterSpacing: '0.15em',
                                    display: 'inline-block',
                                    mb: 1.5,
                                    px: 1.25,
                                    py: 0.25,
                                    borderRadius: 999,
                                    border: `2px solid ${theme.palette.primary.main}`,
                                    lineHeight: 1.6,
                                }}
                            >
                                {eyebrow}
                            </Typography>
                        )}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            {icon && (
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        background: theme.palette.brand?.gradientSoft,
                                        color: theme.palette.primary.main,
                                        '& svg': { fontSize: 28 },
                                    }}
                                >
                                    {icon}
                                </Box>
                            )}
                            <Typography component="h1" sx={titleSx}>
                                {title}
                            </Typography>
                        </Stack>
                        {subtitle && (
                            <Typography
                                variant="body1"
                                sx={{
                                    mt: 1.5,
                                    maxWidth: 640,
                                    color: theme.palette.text.secondary,
                                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {actions && (
                        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                            {actions}
                        </Stack>
                    )}
                </Stack>
            </Container>
        </Box>
    );
};

export default PageHeader;
