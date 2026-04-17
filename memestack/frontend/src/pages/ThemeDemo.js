// ============================================================================
// ThemeDemo — playground showing surfaces, chips, avatars, and the color
// scheme picker. Uses the shared neo-brutalist tokens so it looks like every
// other page in the app.
// ============================================================================

import React, { useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    Fab,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Add as AddIcon,
    Favorite as FavoriteIcon,
    Palette as PaletteIcon,
    Share as ShareIcon,
    Star as StarIcon,
} from '@mui/icons-material';

import { useThemeMode } from '../contexts/ThemeContext';
import ColorSchemeSelector from '../components/common/ColorSchemeSelector';
import { PageHeader } from '../components/common';

const demoCards = [
    {
        title: 'Bold surfaces',
        subtitle: 'Chunky borders & offset shadows',
        content:
            'Cards sit on solid surfaces with 2px borders and offset shadows — no blur, no mystery, just contrast.',
    },
    {
        title: 'Theme colors',
        subtitle: 'Primary, accent, and brand tones',
        content:
            'Colors adapt to the selected scheme and light/dark mode. Brand accents stay punchy in either.',
    },
    {
        title: 'Interactive elements',
        subtitle: 'Buttons, chips, avatars',
        content:
            'Every interactive element lives in the same style system so the app feels cohesive end-to-end.',
    },
];

const ThemeDemo = () => {
    const theme = useTheme();
    const { mode, colorScheme, colorSchemes } = useThemeMode();
    const [colorSchemeOpen, setColorSchemeOpen] = useState(false);

    const surfaceSx = {
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: theme.tokens?.shadow?.sm,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: theme.tokens?.shadow?.md,
        },
    };

    return (
        <Box>
            <PageHeader
                eyebrow="THEME"
                title="Theme playground"
                subtitle="Preview surfaces, colors, and components the app uses everywhere."
                icon={<PaletteIcon />}
                actions={
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip
                            label={`Scheme: ${colorSchemes?.[colorScheme]?.name || 'Default'}`}
                            sx={{ fontWeight: 800, background: theme.palette.background.paper }}
                        />
                        <Chip
                            label={`Mode: ${mode}`}
                            sx={{ fontWeight: 800, background: theme.palette.background.paper }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<PaletteIcon />}
                            onClick={() => setColorSchemeOpen(true)}
                            sx={{ fontWeight: 800 }}
                        >
                            Change scheme
                        </Button>
                    </Stack>
                }
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {demoCards.map((card) => (
                        <Grid item xs={12} md={4} key={card.title}>
                            <Box sx={{ ...surfaceSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 2,
                                        background: theme.palette.brand?.gradient || theme.palette.primary.main,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        mb: 2,
                                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    }}
                                >
                                    <StarIcon />
                                </Box>

                                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{card.title}</Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 1.5 }}
                                >
                                    {card.subtitle}
                                </Typography>
                                <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
                                    {card.content}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                    <IconButton size="small" color="primary">
                                        <FavoriteIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="primary">
                                        <ShareIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ ...surfaceSx, mb: 4 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', mb: 2 }}>
                        Interactive elements
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Buttons</Typography>
                            <Stack spacing={1.5}>
                                <Button variant="contained" size="large" sx={{ fontWeight: 800 }}>
                                    Primary button
                                </Button>
                                <Button variant="outlined" size="large" sx={{ fontWeight: 800 }}>
                                    Outlined button
                                </Button>
                                <Button variant="text" size="large" sx={{ fontWeight: 800 }}>
                                    Text button
                                </Button>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Chips & avatars</Typography>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip label="Primary" color="primary" sx={{ fontWeight: 700 }} />
                                    <Chip label="Secondary" color="secondary" sx={{ fontWeight: 700 }} />
                                    <Chip label="Success" color="success" sx={{ fontWeight: 700 }} />
                                    <Chip label="Warning" color="warning" sx={{ fontWeight: 700 }} />
                                    <Chip label="Error" color="error" sx={{ fontWeight: 700 }} />
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                            fontWeight: 900,
                                        }}
                                    >
                                        U
                                    </Avatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: theme.palette.secondary.main,
                                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                            fontWeight: 900,
                                        }}
                                    >
                                        S
                                    </Avatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: theme.palette.brand?.accent || theme.palette.primary.main,
                                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                            fontWeight: 900,
                                        }}
                                    >
                                        E
                                    </Avatar>
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={surfaceSx}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', mb: 2 }}>
                        Typography scale
                    </Typography>
                    <Stack spacing={1.25}>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>
                            H3 · Big headline
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            H5 · Section title
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Subtitle · supporting text
                        </Typography>
                        <Typography variant="body1">
                            Body · the quick brown fox jumps over the lazy dog.
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Body secondary · metadata, timestamps, and hints live here.
                        </Typography>
                    </Stack>
                </Box>
            </Container>

            <Fab
                color="primary"
                onClick={() => setColorSchemeOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                    boxShadow: theme.tokens?.shadow?.md,
                }}
            >
                <AddIcon />
            </Fab>

            <ColorSchemeSelector
                open={colorSchemeOpen}
                onClose={() => setColorSchemeOpen(false)}
            />
        </Box>
    );
};

export default ThemeDemo;
