// ============================================================================
// Footer — global bottom navigation + copyright.
// ----------------------------------------------------------------------------
// Kept intentionally simple: brand blurb on the left, two columns of links on
// the right, social row, thin legal strip at the bottom. Matches the Navbar
// styling so the app feels bookended.
// ============================================================================

import React from 'react';
import {
    Box,
    Container,
    Typography,
    IconButton,
    Divider,
    Stack,
    Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    GitHub as GitHubIcon,
    LinkedIn as LinkedInIcon,
    Twitter as TwitterIcon,
    Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const footerColumns = [
    {
        title: 'Explore',
        links: [
            { label: 'Gallery',         to: '/gallery' },
            { label: 'Challenges',      to: '/challenges' },
            { label: 'Groups',          to: '/groups' },
            { label: 'Templates',       to: '/templates' },
            { label: 'Collaborations',  to: '/collaborations' },
        ],
    },
    {
        title: 'Create',
        links: [
            { label: 'New meme',        to: '/create' },
            { label: 'Batch processor', to: '/batch' },
            { label: 'My folders',      to: '/folders' },
            { label: 'Analytics',       to: '/analytics' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About',   to: '/' },
            { label: 'Support', to: '/support' },
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms',   to: '/terms' },
        ],
    },
];

const Footer = () => {
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    const linkSx = {
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'color 120ms ease, transform 120ms ease',
        '&:hover': {
            color: theme.palette.primary.main,
            transform: 'translateX(2px)',
        },
    };

    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                pt: { xs: 6, md: 8 },
                pb: 3,
                borderTop: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                backgroundColor: theme.palette.brand?.bgAlt || theme.palette.background.default,
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' },
                        gap: { xs: 4, md: 6 },
                        mb: 5,
                    }}
                >
                    {/* Brand */}
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `2px solid ${theme.palette.brand?.border}`,
                                    background: theme.palette.brand?.gradient,
                                    fontSize: 24,
                                    boxShadow: theme.tokens?.shadow?.sm,
                                }}
                            >
                                🎭
                            </Box>
                            <Typography
                                variant="h5"
                                component="span"
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: '-0.02em',
                                    background: theme.palette.brand?.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                MemeStack
                            </Typography>
                        </Stack>
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.text.secondary,
                                lineHeight: 1.65,
                                maxWidth: 360,
                                mb: 2.5,
                            }}
                        >
                            The social home for meme makers — create, remix, share, and compete
                            with a vibrant community of creators.
                        </Typography>

                        <Stack direction="row" spacing={0.5}>
                            {[
                                { icon: <GitHubIcon />,   href: 'https://github.com/aksaN000/470_project', label: 'GitHub' },
                                { icon: <TwitterIcon />,  href: 'https://twitter.com/',                   label: 'Twitter' },
                                { icon: <LinkedInIcon />, href: 'https://linkedin.com/',                  label: 'LinkedIn' },
                            ].map((s) => (
                                <IconButton
                                    key={s.label}
                                    component="a"
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    sx={{
                                        color: theme.palette.text.primary,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                        borderRadius: 2,
                                        width: 40,
                                        height: 40,
                                        '&:hover': {
                                            background: theme.palette.brand?.gradientSoft,
                                            transform: 'translate(-1px, -1px)',
                                            boxShadow: theme.tokens?.shadow?.sm,
                                        },
                                        transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
                                    }}
                                >
                                    {s.icon}
                                </IconButton>
                            ))}
                        </Stack>
                    </Box>

                    {/* Link columns */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                            gap: 4,
                        }}
                    >
                        {footerColumns.map((col) => (
                            <Box key={col.title}>
                                <Typography
                                    variant="overline"
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '0.12em',
                                        color: theme.palette.text.primary,
                                        display: 'block',
                                        mb: 1.5,
                                    }}
                                >
                                    {col.title}
                                </Typography>
                                <Stack spacing={1}>
                                    {col.links.map((link) => (
                                        <MuiLink
                                            key={link.label}
                                            component={RouterLink}
                                            to={link.to}
                                            sx={linkSx}
                                        >
                                            {link.label}
                                        </MuiLink>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Divider sx={{ borderColor: theme.palette.divider }} />

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: 'center', sm: 'center' }}
                    sx={{ pt: 2.5 }}
                >
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        © {currentYear} MemeStack. All rights reserved.
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Made with
                        </Typography>
                        <FavoriteIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            for the meme community
                        </Typography>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
