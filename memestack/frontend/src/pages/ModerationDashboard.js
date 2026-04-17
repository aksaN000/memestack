// ============================================================================
// ModerationDashboard — admin-only queue for handling user reports.
// ----------------------------------------------------------------------------
// StatCards summary + tabbed report table with inline actions (warn/suspend/
// ban/resolve/dismiss). Each action opens a confirmation dialog that captures
// a reason and, for suspensions, a duration.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Block as BlockIcon,
    Cancel as DismissIcon,
    CheckCircle as ResolveIcon,
    Gavel as BanIcon,
    Shield as ShieldIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

import {
    banUser,
    dismissReport,
    getModerationDashboard,
    getReports,
    reviewReport,
    suspendUser,
    warnUser,
} from '../services/moderationAPI';
import { useAuth } from '../contexts/AuthContext';
import {
    EmptyState,
    ErrorState,
    LoadingSpinner,
    PageHeader,
    StatCard,
} from '../components/common';

const STATUSES = ['', 'pending', 'under_review', 'resolved'];

const STATUS_COLORS = {
    pending: 'warning',
    under_review: 'info',
    resolved: 'success',
    dismissed: 'default',
};

const PRIORITY_COLORS = {
    high: 'error',
    medium: 'warning',
    low: 'success',
};

const ACTION_TITLES = {
    warn: 'Issue warning',
    suspend: 'Suspend user',
    ban: 'Ban user',
    resolve: 'Resolve report',
    dismiss: 'Dismiss report',
};

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const ModerationDashboard = () => {
    const theme = useTheme();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState(0);
    const [reports, setReports] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionDialog, setActionDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [suspensionDays, setSuspensionDays] = useState(7);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // -------------------------------------------------------------- loaders
    const loadDashboardData = async () => {
        try {
            const stats = await getModerationDashboard();
            setDashboardStats(stats);
        } catch {
            setError('Failed to load dashboard stats');
        }
    };

    const loadReports = async (status = '') => {
        try {
            setLoading(true);
            const filters = status ? { status } : {};
            const data = await getReports(filters);
            setReports(data.reports || []);
        } catch {
            setError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadDashboardData();
            loadReports();
        }
    }, [user]);

    // -------------------------------------------------------------- admin guard
    if (!user || user.role !== 'admin') {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <ErrorState
                    title="Access denied"
                    description="You need admin privileges to view the moderation dashboard."
                />
            </Container>
        );
    }

    // --------------------------------------------------------------- handlers
    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        loadReports(STATUSES[newValue]);
    };

    const handleActionClick = (report, action) => {
        setSelectedReport(report);
        setActionType(action);
        setActionDialog(true);
        setActionReason('');
    };

    const handleActionSubmit = async () => {
        if (!selectedReport || !actionType) return;
        try {
            setError('');
            let result;
            switch (actionType) {
                case 'warn':
                    result = await warnUser(
                        selectedReport.reportedUser._id,
                        actionReason,
                        selectedReport._id
                    );
                    break;
                case 'suspend':
                    result = await suspendUser(
                        selectedReport.reportedUser._id,
                        actionReason,
                        suspensionDays,
                        selectedReport._id
                    );
                    break;
                case 'ban':
                    result = await banUser(
                        selectedReport.reportedUser._id,
                        actionReason,
                        selectedReport._id
                    );
                    break;
                case 'resolve':
                    result = await reviewReport(selectedReport._id, 'resolved', actionReason);
                    break;
                case 'dismiss':
                    result = await dismissReport(selectedReport._id, actionReason);
                    break;
                default:
                    throw new Error('Invalid action');
            }
            setSuccess(`Action completed: ${result.message}`);
            setActionDialog(false);
            loadReports(STATUSES[activeTab]);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to perform action');
        }
    };

    // --------------------------------------------------------------- rendering
    return (
        <Box>
            <PageHeader
                eyebrow="ADMIN"
                title="Moderation dashboard"
                subtitle="Triage reports, enforce community guidelines, and keep the feed healthy."
                icon={<ShieldIcon />}
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {dashboardStats && (
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total reports"
                                value={dashboardStats.totalReports}
                                color="primary"
                                variant="compact"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Pending"
                                value={dashboardStats.pendingReports}
                                color="warning"
                                variant="compact"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Resolved today"
                                value={dashboardStats.resolvedToday}
                                color="success"
                                variant="compact"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Active moderators"
                                value={dashboardStats.activeModerators}
                                color="info"
                                variant="compact"
                            />
                        </Grid>
                    </Grid>
                )}

                <Box
                    sx={{
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.sm,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            borderBottom: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                            px: 2,
                        }}
                    >
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab label="All reports" sx={{ fontWeight: 800 }} />
                            <Tab label="Pending" sx={{ fontWeight: 800 }} />
                            <Tab label="Under review" sx={{ fontWeight: 800 }} />
                            <Tab label="Resolved" sx={{ fontWeight: 800 }} />
                        </Tabs>
                    </Box>

                    {loading ? (
                        <LoadingSpinner message="Loading reports…" />
                    ) : reports.length === 0 ? (
                        <EmptyState
                            icon={<ShieldIcon sx={{ fontSize: 48 }} />}
                            title="All clear!"
                            description="There are no reports matching this filter."
                        />
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Content</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reporter</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reported user</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report._id} hover>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 700 }}>
                                                    {report.contentType}
                                                </Typography>
                                                {report.contentId && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: theme.palette.text.secondary }}
                                                    >
                                                        ID: {report.contentId.slice(-8)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{report.reporter?.username || 'Anonymous'}</TableCell>
                                            <TableCell>{report.reportedUser?.username || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{report.reason}</Typography>
                                                {report.description && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: theme.palette.text.secondary }}
                                                    >
                                                        {report.description}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={report.priority}
                                                    size="small"
                                                    color={PRIORITY_COLORS[report.priority] || 'default'}
                                                    sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={report.status.replace('_', ' ')}
                                                    size="small"
                                                    color={STATUS_COLORS[report.status] || 'default'}
                                                    sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    {formatDate(report.createdAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {(report.status === 'pending' ||
                                                    report.status === 'under_review') ? (
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="Issue warning">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={() => handleActionClick(report, 'warn')}
                                                            >
                                                                <WarningIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Suspend">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() =>
                                                                    handleActionClick(report, 'suspend')
                                                                }
                                                            >
                                                                <BlockIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Ban">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleActionClick(report, 'ban')}
                                                            >
                                                                <BanIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Resolve">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() =>
                                                                    handleActionClick(report, 'resolve')
                                                                }
                                                            >
                                                                <ResolveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Dismiss">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleActionClick(report, 'dismiss')
                                                                }
                                                            >
                                                                <DismissIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: theme.palette.text.secondary }}
                                                    >
                                                        {report.status === 'resolved'
                                                            ? 'Resolved'
                                                            : 'Dismissed'}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Container>

            <Dialog
                open={actionDialog}
                onClose={() => setActionDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 900 }}>
                    {ACTION_TITLES[actionType] || 'Moderation action'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Reason"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            required
                        />
                        {actionType === 'suspend' && (
                            <FormControl fullWidth>
                                <InputLabel>Suspension duration</InputLabel>
                                <Select
                                    value={suspensionDays}
                                    label="Suspension duration"
                                    onChange={(e) => setSuspensionDays(e.target.value)}
                                >
                                    <MenuItem value={1}>1 day</MenuItem>
                                    <MenuItem value={3}>3 days</MenuItem>
                                    <MenuItem value={7}>7 days</MenuItem>
                                    <MenuItem value={14}>14 days</MenuItem>
                                    <MenuItem value={30}>30 days</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setActionDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleActionSubmit}
                        variant="contained"
                        color={actionType === 'ban' ? 'error' : 'primary'}
                        disabled={!actionReason.trim()}
                        sx={{ fontWeight: 800 }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ModerationDashboard;
