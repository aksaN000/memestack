// ============================================================================
// NotFound — 404 fallback for unknown routes.
// ----------------------------------------------------------------------------
// Big dumb emoji, friendly message, a couple of clear exits. Plus a search
// hint so people with slightly-wrong URLs know what to do next.
// ============================================================================

import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Home as HomeIcon,
    PhotoLibrary as GalleryIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 72px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.brand?.bgAlt || theme.palette.background.default,
                py: { xs: 6, md: 10 },
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={{
                        textAlign: 'center',
                        p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.lg,
                    }}
                >
                    <Box
                        sx={{
                            fontSize: { xs: '5rem', md: '7rem' },
                            lineHeight: 1,
                            mb: 2,
                        }}
                        aria-hidden
                    >
                        🤔
                    </Box>

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            background: theme.palette.brand?.surfaceSubtle,
                            border: `2px solid ${theme.palette.brand?.border}`,
                            mb: 2,
                        }}
                    >
                        404
                    </Typography>

                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: '-0.02em',
                            mb: 1.5,
                            fontSize: { xs: '2rem', md: '2.75rem' },
                        }}
                    >
                        That page took the day off.
                    </Typography>

                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '1rem',
                            maxWidth: 440,
                            mx: 'auto',
                            mb: 4,
                        }}
                    >
                        We couldn't find what you were looking for. It may have been moved,
                        deleted, or just never existed. Check the URL for typos, or head
                        somewhere solid.
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        justifyContent="center"
                    >
                        <Button
                            variant="outlined"
                            startIcon={<BackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{ fontWeight: 700 }}
                        >
                            Go back
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<HomeIcon />}
                            onClick={() => navigate('/')}
                            sx={{ fontWeight: 700 }}
                        >
                            Home
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<GalleryIcon />}
                            onClick={() => navigate('/memes')}
                            sx={{ fontWeight: 700 }}
                        >
                            Browse memes
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default NotFound;
