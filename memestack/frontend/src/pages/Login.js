// ============================================================================
// Login — sign in to an existing account.
// ----------------------------------------------------------------------------
// Two-column on desktop (marketing copy + form), single-column on mobile.
// Dispatches to the AuthContext.login() action and redirects back to the page
// the user was trying to reach when redirected here.
// ============================================================================

import React, { useEffect, useState } from 'react';
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
    Link as MuiLink,
    CircularProgress,
    Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
    Lock as LockIcon,
    CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [validation, setValidation] = useState({});

    const redirectTo = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        if (isAuthenticated) navigate(redirectTo, { replace: true });
    }, [isAuthenticated, navigate, redirectTo]);

    useEffect(() => {
        clearError();
        // Run only on mount — clearError is guaranteed stable via useCallback upstream.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validation[name]) setValidation((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.email) errors.email = 'Enter your email';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'That doesn\'t look like a valid email';
        if (!formData.password) errors.password = 'Enter your password';
        setValidation(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const result = await login(formData);
        if (result?.success) navigate(redirectTo, { replace: true });
    };

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
                    {/* Marketing side */}
                    <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
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
                            🎭
                        </Box>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.03em',
                                mb: 2,
                                fontSize: { md: '3rem' },
                            }}
                        >
                            Welcome back.
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
                            Pick up where you left off — your stack, your challenges, your people.
                        </Typography>
                        <Stack spacing={1.5}>
                            {[
                                'Your drafts and folders are waiting',
                                'Resume any challenges you joined',
                                'Keep up with the people you follow',
                            ].map((line) => (
                                <Stack key={line} direction="row" spacing={1.5} alignItems="center">
                                    <CheckCircleOutline sx={{ color: theme.palette.primary.main }} />
                                    <Typography sx={{ fontWeight: 600 }}>{line}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Form side */}
                    <Grid item xs={12} md={6}>
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                p: { xs: 3, sm: 5 },
                                borderRadius: 4,
                                border: `2px solid ${theme.palette.brand?.border}`,
                                background: theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.lg,
                                maxWidth: 480,
                                mx: { xs: 'auto', md: 0 },
                            }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                                Log in
                            </Typography>
                            <Typography
                                sx={{ color: theme.palette.text.secondary, mb: 3 }}
                            >
                                New here?{' '}
                                <MuiLink
                                    component={RouterLink}
                                    to="/register"
                                    sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                                >
                                    Create an account
                                </MuiLink>
                            </Typography>

                            {error && (
                                <Alert severity="error" onClose={clearError} sx={{ mb: 2.5 }}>
                                    {typeof error === 'string' ? error : 'Login failed. Try again.'}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                name="email"
                                label="Email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                value={formData.email}
                                onChange={handleChange}
                                error={!!validation.email}
                                helperText={validation.email}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon sx={{ color: theme.palette.text.secondary }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                error={!!validation.password}
                                helperText={validation.password}
                                margin="normal"
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

                            <Button
                                type="submit"
                                fullWidth
                                size="large"
                                variant="contained"
                                disabled={isLoading}
                                sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 800 }}
                            >
                                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Log in'}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                <MuiLink
                                    component={RouterLink}
                                    to="/forgot-password"
                                    sx={{
                                        fontSize: '0.875rem',
                                        color: theme.palette.text.secondary,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        '&:hover': { color: theme.palette.primary.main },
                                    }}
                                >
                                    Forgot your password?
                                </MuiLink>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Login;
