// ============================================================================
// AccountSettings — preferences + account + danger-zone links.
// ----------------------------------------------------------------------------
// Sections:
//   1. Profile basics (username, displayName, email, bio) — quick inline edit.
//   2. Preferences (theme mode, color scheme, notifications, language).
//   3. Data & privacy (download data, danger zone).
// The email field is read-only today — it's the account's identity. Profile
// deletion routes to a future `/account/delete` flow if one is added later.
// ============================================================================

import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    Stack,
    Typography,
    Divider,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Tune as TuneIcon,
    Security as SecurityIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Notifications as NotificationsIcon,
    Language as LanguageIcon,
    Palette as PaletteIcon,
    DeleteOutline as DeleteIcon,
    DownloadForOffline as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { PageHeader, Section, ColorSchemeSelector } from '../components/common';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
];

const AccountSettings = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const { mode, toggleTheme } = useThemeMode();

    const [form, setForm] = useState({
        username: user?.username || '',
        displayName: user?.profile?.displayName || '',
        bio: user?.profile?.bio || '',
        notifications: user?.preferences?.notifications !== false,
        emailNotifications: user?.preferences?.emailNotifications !== false,
        language: user?.preferences?.language || 'en',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const change = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await updateProfile(form);
            if (!result?.success) throw new Error(result?.message || 'Failed to save');
            setSuccess('Settings saved.');
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const sectionCard = (children) => (
        <Box
            sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                background: theme.palette.background.paper,
                boxShadow: theme.tokens?.shadow?.sm,
            }}
        >
            {children}
        </Box>
    );

    return (
        <Box>
            <PageHeader
                eyebrow="SETTINGS"
                title="Account settings"
                subtitle="Preferences, notifications, and identity — all in one place."
                icon={<TuneIcon />}
                actions={
                    <Button variant="outlined" onClick={() => navigate('/profile')}>
                        Back to profile
                    </Button>
                }
            />

            <Container maxWidth="md" sx={{ py: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Profile basics */}
                    <Section title="Profile basics" icon={<PersonIcon />} dense>
                        {sectionCard(
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={form.username}
                                        onChange={change}
                                        required
                                        helperText="Appears in profile URLs."
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Display name"
                                        name="displayName"
                                        value={form.displayName}
                                        onChange={change}
                                        helperText="Optional — shown on your profile."
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={user?.email || ''}
                                        disabled
                                        helperText="Contact support to change your account email."
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Bio"
                                        name="bio"
                                        value={form.bio}
                                        onChange={change}
                                        multiline
                                        rows={3}
                                        inputProps={{ maxLength: 280 }}
                                        helperText={`${form.bio.length}/280`}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Section>

                    {/* Appearance */}
                    <Section title="Appearance" icon={<PaletteIcon />} dense>
                        {sectionCard(
                            <Stack spacing={2.5}>
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ sm: 'center' }}
                                    spacing={2}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>Theme mode</Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: theme.palette.text.secondary }}
                                        >
                                            Currently: {mode === 'dark' ? 'Dark' : 'Light'}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        startIcon={
                                            mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />
                                        }
                                        onClick={toggleTheme}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Switch to {mode === 'dark' ? 'light' : 'dark'}
                                    </Button>
                                </Stack>
                                <Divider />
                                <Box>
                                    <Typography sx={{ fontWeight: 700, mb: 1 }}>
                                        Color scheme
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            display: 'block',
                                            mb: 1.5,
                                        }}
                                    >
                                        Pick an accent palette. Affects gradients and highlights.
                                    </Typography>
                                    <ColorSchemeSelector />
                                </Box>
                            </Stack>
                        )}
                    </Section>

                    {/* Notifications */}
                    <Section
                        title="Notifications"
                        icon={<NotificationsIcon />}
                        dense
                    >
                        {sectionCard(
                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.notifications}
                                            onChange={change}
                                            name="notifications"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography sx={{ fontWeight: 700 }}>
                                                In-app notifications
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                Likes, follows, comments — anything happening to
                                                your memes.
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ alignItems: 'flex-start', ml: 0 }}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.emailNotifications}
                                            onChange={change}
                                            name="emailNotifications"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography sx={{ fontWeight: 700 }}>
                                                Email digest
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                A weekly summary — big moments only, no spam.
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ alignItems: 'flex-start', ml: 0 }}
                                />
                            </Stack>
                        )}
                    </Section>

                    {/* Language */}
                    <Section title="Language & region" icon={<LanguageIcon />} dense>
                        {sectionCard(
                            <TextField
                                select
                                fullWidth
                                label="Language"
                                name="language"
                                value={form.language}
                                onChange={change}
                                helperText="Affects the interface. Content is user-generated and multilingual."
                            >
                                {LANGUAGES.map((l) => (
                                    <MenuItem key={l.value} value={l.value}>
                                        {l.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Section>

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4, mb: 6 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={
                                loading ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <SaveIcon />
                                )
                            }
                            disabled={loading}
                            sx={{ fontWeight: 800, minWidth: 180 }}
                        >
                            {loading ? 'Saving…' : 'Save settings'}
                        </Button>
                    </Stack>
                </Box>

                {/* Data & privacy */}
                <Section title="Data & privacy" icon={<SecurityIcon />} dense>
                    <Box
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: 3,
                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            background: theme.palette.brand?.surfaceSubtle,
                        }}
                    >
                        <Stack spacing={2}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ sm: 'center' }}
                                spacing={2}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 800 }}>
                                        Download your data
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        Get a JSON export of your memes, comments, and account data.
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    disabled
                                >
                                    Coming soon
                                </Button>
                            </Stack>
                            <Divider />
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ sm: 'center' }}
                                spacing={2}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: theme.palette.error.main }}>
                                        Delete account
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        Remove everything — memes, comments, account. Permanent.
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    disabled
                                >
                                    Coming soon
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Section>
            </Container>
        </Box>
    );
};

export default AccountSettings;
