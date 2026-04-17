// ============================================================================
// Register — create a new account.
// ----------------------------------------------------------------------------
// Mirrors the Login layout on desktop. Validates username/email/password
// client-side before posting so users don't spend API calls on typos.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    Stack,
    Grid,
    Link as MuiLink,
    CircularProgress,
    LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

// --- password strength -------------------------------------------------------
// Very simple heuristic — matches the backend's minimum of 6 characters, then
// gives the user a nudge to go longer + add variety.
const scorePassword = (pw) => {
    if (!pw) return { score: 0, label: '' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    const label = ['Too short', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'][score];
    return { score, label };
};

const Register = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { register, isAuthenticated, isLoading, error, clearError } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [validation, setValidation] = useState({});

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        clearError();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validation[name]) setValidation((prev) => ({ ...prev, [name]: '' }));
    };

    const pwStrength = useMemo(() => scorePassword(formData.password), [formData.password]);

    const validate = () => {
        const errors = {};
        if (!formData.username) errors.username = 'Pick a username';
        else if (formData.username.length < 3) errors.username = 'At least 3 characters';
        else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errors.username = 'Letters, numbers, and underscores only';

        if (!formData.email) errors.email = 'Enter your email';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'That doesn\'t look like a valid email';

        if (!formData.password) errors.password = 'Create a password';
        else if (formData.password.length < 6) errors.password = 'At least 6 characters';

        if (!formData.confirmPassword) errors.confirmPassword = 'Confirm your password';
        else if (formData.password !== formData.confirmPassword)
            errors.confirmPassword = 'Passwords don\'t match';

        setValidation(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const { confirmPassword, ...payload } = formData;
        const result = await register(payload);
        if (result?.success) navigate('/dashboard', { replace: true });
    };

    const strengthColor = ['#CBD5E1', '#EF4444', '#F59E0B', '#F59E0B', '#16A34A', '#16A34A'][pwStrength.score];

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 72px)',
                background: theme.palette.brand?.bgAlt || theme.palette.background.default,
                py: { xs: 6, md: 10 },
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={6} alignItems="center">
                    {/* Form */}
                    <Grid item xs={12} md={7}>
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                p: { xs: 3, sm: 5 },
                                borderRadius: 4,
                                border: `2px solid ${theme.palette.brand?.border}`,
                                background: theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.lg,
                                maxWidth: 560,
                                mx: { xs: 'auto', md: 0 },
                            }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                                Create your account
                            </Typography>
                            <Typography sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                                Already have one?{' '}
                                <MuiLink
                                    component={RouterLink}
                                    to="/login"
                                    sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                                >
                                    Log in
                                </MuiLink>
                            </Typography>

                            {error && (
                                <Alert severity="error" onClose={clearError} sx={{ mb: 2.5 }}>
                                    {typeof error === 'string' ? error : 'Registration failed. Try again.'}
                                </Alert>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="username"
                                        label="Username"
                                        autoComplete="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        error={!!validation.username}
                                        helperText={validation.username || 'Letters, numbers, or underscores'}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon sx={{ color: theme.palette.text.secondary }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        label="Email"
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={!!validation.email}
                                        helperText={validation.email}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon sx={{ color: theme.palette.text.secondary }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={!!validation.password}
                                        helperText={validation.password}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon sx={{ color: theme.palette.text.secondary }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={() => setShowPassword((s) => !s)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="confirmPassword"
                                        label="Confirm password"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        error={!!validation.confirmPassword}
                                        helperText={validation.confirmPassword}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon sx={{ color: theme.palette.text.secondary }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle confirm visibility"
                                                        onClick={() => setShowConfirm((s) => !s)}
                                                        edge="end"
                                                    >
                                                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {formData.password && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                            Password strength
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: strengthColor }}>
                                            {pwStrength.label}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(pwStrength.score / 5) * 100}
                                        sx={{
                                            '& .MuiLinearProgress-bar': {
                                                background: strengthColor,
                                            },
                                        }}
                                    />
                                </Box>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                size="large"
                                variant="contained"
                                disabled={isLoading}
                                sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 800 }}
                            >
                                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
                            </Button>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    mt: 2,
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                By creating an account you agree to our{' '}
                                <MuiLink component={RouterLink} to="/terms" sx={{ fontWeight: 600 }}>
                                    Terms
                                </MuiLink>
                                {' '}and{' '}
                                <MuiLink component={RouterLink} to="/privacy" sx={{ fontWeight: 600 }}>
                                    Privacy Policy
                                </MuiLink>
                                .
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Marketing side */}
                    <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 64,
                                height: 64,
                                borderRadius: 2,
                                border: `2px solid ${theme.palette.brand?.border}`,
                                background: theme.palette.brand?.gradient,
                                boxShadow: theme.tokens?.shadow?.md,
                                fontSize: 36,
                                color: '#fff',
                                mb: 3,
                            }}
                        >
                            ⚡
                        </Box>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.03em',
                                mb: 2,
                                fontSize: { md: '2.75rem' },
                            }}
                        >
                            Join the stack.
                        </Typography>
                        <Typography
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '1.125rem',
                                lineHeight: 1.6,
                                maxWidth: 440,
                                mb: 4,
                            }}
                        >
                            Free, forever for your first stack of memes. No credit card.
                            No fake premium tiers. Just an account.
                        </Typography>
                        <Stack spacing={1.5}>
                            {[
                                'Unlimited public memes',
                                'Weekly challenges + leaderboards',
                                'Folders, groups, and collaborations',
                                'Follow creators whose style you love',
                            ].map((line) => (
                                <Stack key={line} direction="row" spacing={1.5} alignItems="center">
                                    <CheckCircleOutline sx={{ color: theme.palette.primary.main }} />
                                    <Typography sx={{ fontWeight: 600 }}>{line}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Register;
