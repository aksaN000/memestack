// ============================================================================
// Navbar — global top navigation.
// ----------------------------------------------------------------------------
// Responsive, theme-aware app bar with:
//   • Logo that routes home
//   • Primary nav items (desktop)
//   • Overflow menu for secondary items (desktop)
//   • Create button as the primary CTA
//   • User avatar → account menu / Login+Register when logged out
//   • Theme toggle
//   • Hamburger drawer on mobile
//
// All colors come from the MUI theme defined in contexts/ThemeContext.js.
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Container,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Stack,
    Tooltip,
    ListSubheader,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    Close as CloseIcon,
    Home as HomeIcon,
    PhotoLibrary as GalleryIcon,
    Add as AddIcon,
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    Login as LoginIcon,
    PersonAdd as RegisterIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    EmojiEvents,
    Groups as GroupsIcon,
    Handshake,
    Brightness4,
    Brightness7,
    Analytics as AnalyticsIcon,
    FolderOpen as FolderIcon,
    ViewModule as TemplatesIcon,
    BatchPrediction as BatchIcon,
    Shield as ShieldIcon,
    ExpandMore,
    AutoAwesome,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import ThemeSettingsButton from '../common/ThemeSettingsButton';

// --------------------------------------------------------------------------
// Navigation configuration — single source of truth so desktop + mobile stay
// in sync. Each item lists the minimum auth level it requires.
// --------------------------------------------------------------------------
const navConfig = {
    primaryPublic: [
        { label: 'Home',       path: '/',              icon: <HomeIcon /> },
        { label: 'Gallery',    path: '/gallery',       icon: <GalleryIcon /> },
        { label: 'Challenges', path: '/challenges',    icon: <EmojiEvents /> },
        { label: 'Groups',     path: '/groups',        icon: <GroupsIcon /> },
    ],
    primaryAuth: [
        { label: 'Feed',       path: '/feed',          icon: <AutoAwesome /> },
        { label: 'Dashboard',  path: '/dashboard',     icon: <DashboardIcon /> },
    ],
    moreMenu: [
        { label: 'Collaborations', path: '/collaborations', icon: <Handshake />,     requiresAuth: false },
        { label: 'Browse Users',   path: '/browse-users',   icon: <PeopleIcon />,    requiresAuth: false },
        { label: 'Templates',      path: '/templates',      icon: <TemplatesIcon />, requiresAuth: true },
        { label: 'Folders',        path: '/folders',        icon: <FolderIcon />,    requiresAuth: true },
        { label: 'Batch Process',  path: '/batch',          icon: <BatchIcon />,     requiresAuth: true },
        { label: 'Analytics',      path: '/analytics',      icon: <AnalyticsIcon />, requiresAuth: true },
    ],
    admin: [
        { label: 'Moderation', path: '/moderation', icon: <ShieldIcon /> },
    ],
};

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall  = useMediaQuery(theme.breakpoints.down('lg'));

    const { user, isAuthenticated, logout } = useAuth();
    const { mode, toggleTheme } = useThemeMode();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

    const closeAll = () => {
        setUserMenuAnchor(null);
        setMoreMenuAnchor(null);
        setMobileOpen(false);
    };

    const isActive = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const handleNavigate = (path) => {
        closeAll();
        navigate(path);
    };

    const handleLogout = async () => {
        closeAll();
        await logout();
        navigate('/');
    };

    // Filter primary nav items for the desktop bar based on available width.
    const desktopNavItems = useMemo(() => {
        const items = [
            ...navConfig.primaryPublic,
            ...(isAuthenticated ? navConfig.primaryAuth : []),
        ];
        // On medium screens, drop the secondary-but-still-primary items to the
        // "More" menu to avoid overflow.
        return isSmall ? items.slice(0, 3) : items;
    }, [isAuthenticated, isSmall]);

    const moreItems = useMemo(() => {
        const base = navConfig.moreMenu.filter((it) => !it.requiresAuth || isAuthenticated);
        const overflow = isSmall
            ? [...navConfig.primaryPublic, ...(isAuthenticated ? navConfig.primaryAuth : [])].slice(3)
            : [];
        return [...overflow, ...base];
    }, [isAuthenticated, isSmall]);

    // ------------------------------------------------------------------ render
    const renderLogo = () => (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={() => handleNavigate('/')}
            sx={{
                cursor: 'pointer',
                userSelect: 'none',
                mr: { xs: 0, md: 3 },
                '&:hover .logo-mark': { transform: 'rotate(-6deg) scale(1.08)' },
            }}
        >
            <Box
                className="logo-mark"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.brand?.border}`,
                    background: theme.palette.brand?.gradient,
                    color: '#fff',
                    fontSize: 22,
                    boxShadow: theme.tokens?.shadow?.sm,
                    transition: 'transform 160ms ease',
                }}
            >
                🎭
            </Box>
            <Typography
                component="span"
                sx={{
                    fontWeight: 900,
                    fontSize: '1.25rem',
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
    );

    const renderDesktopNavButton = (item) => {
        const active = isActive(item.path);
        return (
            <Button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                startIcon={item.icon}
                sx={{
                    color: active ? theme.palette.primary.main : theme.palette.text.primary,
                    backgroundColor: active ? theme.palette.brand?.gradientSoft : 'transparent',
                    border: active
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                    borderRadius: 2,
                    px: 1.75,
                    py: 0.75,
                    fontWeight: active ? 800 : 700,
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: theme.palette.brand?.gradientSoft,
                        boxShadow: 'none',
                    },
                }}
            >
                {item.label}
            </Button>
        );
    };

    const renderDesktopNav = () => (
        <Stack direction="row" spacing={0.75} sx={{ flexGrow: 1, alignItems: 'center' }}>
            {desktopNavItems.map(renderDesktopNavButton)}
            {moreItems.length > 0 && (
                <>
                    <Button
                        onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                        endIcon={<ExpandMore />}
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            border: '2px solid transparent',
                            borderRadius: 2,
                            px: 1.75,
                            py: 0.75,
                        }}
                    >
                        More
                    </Button>
                    <Menu
                        anchorEl={moreMenuAnchor}
                        open={Boolean(moreMenuAnchor)}
                        onClose={() => setMoreMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        PaperProps={{ sx: { mt: 1, minWidth: 220 } }}
                    >
                        {moreItems.map((it) => (
                            <MenuItem key={it.path} onClick={() => handleNavigate(it.path)}>
                                <ListItemIcon sx={{ color: theme.palette.primary.main }}>{it.icon}</ListItemIcon>
                                <ListItemText primary={it.label} />
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            )}
        </Stack>
    );

    const renderCreateCTA = () => (
        <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleNavigate(isAuthenticated ? '/create' : '/login')}
            sx={{
                fontWeight: 800,
                px: 2.5,
                ml: 1,
                whiteSpace: 'nowrap',
            }}
        >
            Create
        </Button>
    );

    const renderThemeToggle = () => (
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} aria-label="toggle theme">
                {mode === 'light'
                    ? <Brightness4 sx={{ color: theme.palette.text.primary }} />
                    : <Brightness7 sx={{ color: theme.palette.brand?.accent }} />}
            </IconButton>
        </Tooltip>
    );

    const renderAccount = () => {
        if (!isAuthenticated) {
            return (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button onClick={() => handleNavigate('/login')} sx={{ fontWeight: 700 }}>
                        Log in
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleNavigate('/register')}
                        sx={{ fontWeight: 800 }}
                    >
                        Sign up
                    </Button>
                </Stack>
            );
        }

        return (
            <>
                <Tooltip title={user?.profile?.displayName || user?.username || 'Account'}>
                    <IconButton
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        aria-label="account menu"
                    >
                        <Avatar
                            src={user?.profile?.avatar}
                            alt={user?.profile?.displayName || user?.username}
                            sx={{
                                width: 36,
                                height: 36,
                                fontWeight: 800,
                                border: `2px solid ${theme.palette.brand?.border}`,
                            }}
                        >
                            {(user?.profile?.displayName || user?.username || '?')
                                .charAt(0)
                                .toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { mt: 1, minWidth: 220 } }}
                >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: `2px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {user?.profile?.displayName || user?.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            @{user?.username}
                        </Typography>
                    </Box>
                    <MenuItem onClick={() => handleNavigate('/profile')}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="My profile" />
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigate('/dashboard')}>
                        <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigate('/settings')}>
                        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Settings" />
                    </MenuItem>
                    {user?.role === 'admin' && (
                        <MenuItem onClick={() => handleNavigate('/moderation')}>
                            <ListItemIcon sx={{ color: theme.palette.error.main }}>
                                <ShieldIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Moderation" />
                        </MenuItem>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon sx={{ color: theme.palette.error.main }}>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Log out" />
                    </MenuItem>
                </Menu>
            </>
        );
    };

    const renderMobileDrawer = () => (
        <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            PaperProps={{ sx: { width: 300 } }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                {renderLogo()}
                <IconButton onClick={() => setMobileOpen(false)} aria-label="close navigation">
                    <CloseIcon />
                </IconButton>
            </Stack>
            <Divider />
            <List dense>
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, letterSpacing: '0.1em' }}>
                    EXPLORE
                </ListSubheader>
                {navConfig.primaryPublic.map((item) => (
                    <ListItemButton
                        key={item.path}
                        selected={isActive(item.path)}
                        onClick={() => handleNavigate(item.path)}
                    >
                        <ListItemIcon sx={{ color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
                {isAuthenticated && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, letterSpacing: '0.1em' }}>
                            YOUR STACK
                        </ListSubheader>
                        {navConfig.primaryAuth.map((item) => (
                            <ListItemButton
                                key={item.path}
                                selected={isActive(item.path)}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <ListItemIcon sx={{ color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                        {navConfig.moreMenu.filter((it) => it.requiresAuth).map((item) => (
                            <ListItemButton
                                key={item.path}
                                selected={isActive(item.path)}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <ListItemIcon sx={{ color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                        {user?.role === 'admin' && navConfig.admin.map((item) => (
                            <ListItemButton
                                key={item.path}
                                selected={isActive(item.path)}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <ListItemIcon sx={{ color: theme.palette.error.main }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                    </>
                )}

                <Divider sx={{ my: 1 }} />
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, letterSpacing: '0.1em' }}>
                    DISCOVER
                </ListSubheader>
                {navConfig.moreMenu.filter((it) => !it.requiresAuth).map((item) => (
                    <ListItemButton
                        key={item.path}
                        selected={isActive(item.path)}
                        onClick={() => handleNavigate(item.path)}
                    >
                        <ListItemIcon sx={{ color: theme.palette.primary.main }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}

                <Divider sx={{ my: 1 }} />
                {isAuthenticated ? (
                    <>
                        <ListItemButton onClick={() => handleNavigate('/profile')}>
                            <ListItemIcon sx={{ color: theme.palette.primary.main }}><PersonIcon /></ListItemIcon>
                            <ListItemText primary="Profile" />
                        </ListItemButton>
                        <ListItemButton onClick={() => handleNavigate('/settings')}>
                            <ListItemIcon sx={{ color: theme.palette.primary.main }}><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItemButton>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon sx={{ color: theme.palette.error.main }}><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Log out" />
                        </ListItemButton>
                    </>
                ) : (
                    <>
                        <ListItemButton onClick={() => handleNavigate('/login')}>
                            <ListItemIcon sx={{ color: theme.palette.primary.main }}><LoginIcon /></ListItemIcon>
                            <ListItemText primary="Log in" />
                        </ListItemButton>
                        <ListItemButton onClick={() => handleNavigate('/register')}>
                            <ListItemIcon sx={{ color: theme.palette.primary.main }}><RegisterIcon /></ListItemIcon>
                            <ListItemText primary="Sign up" />
                        </ListItemButton>
                    </>
                )}
                <ListItemButton onClick={toggleTheme}>
                    <ListItemIcon sx={{ color: theme.palette.brand?.accent || theme.palette.primary.main }}>
                        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                    </ListItemIcon>
                    <ListItemText primary={`${mode === 'light' ? 'Dark' : 'Light'} mode`} />
                </ListItemButton>
            </List>
        </Drawer>
    );

    return (
        <>
            <AppBar position="sticky" color="default">
                <Container maxWidth="xl" disableGutters>
                    <Toolbar sx={{ gap: 1 }}>
                        {isMobile && (
                            <IconButton
                                aria-label="open navigation"
                                onClick={() => setMobileOpen(true)}
                                edge="start"
                                sx={{ mr: 0.5 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        {renderLogo()}

                        {!isMobile && renderDesktopNav()}
                        {isMobile && <Box sx={{ flexGrow: 1 }} />}

                        {!isMobile && renderCreateCTA()}
                        <ThemeSettingsButton />
                        {renderThemeToggle()}
                        {!isMobile && renderAccount()}
                        {isMobile && isAuthenticated && (
                            <Avatar
                                src={user?.profile?.avatar}
                                alt={user?.username}
                                onClick={() => handleNavigate('/profile')}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    border: `2px solid ${theme.palette.brand?.border}`,
                                }}
                            >
                                {(user?.username || '?').charAt(0).toUpperCase()}
                            </Avatar>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {renderMobileDrawer()}
        </>
    );
};

export default Navbar;
