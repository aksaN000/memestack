// ============================================================================
// CreateCollaboration — start a new collab (remix / joint project / etc.).
// ----------------------------------------------------------------------------
// Single-page form with sectioned fields:
//   • Type (segmented picker) + title + description + tags
//   • Context fields that only appear when relevant (original meme for remix,
//     challenge for challenge response, group for group-scoped collabs)
//   • Settings (public, max collaborators, allow forks, require approval,
//     allow anonymous, deadline)
// Fetches user's memes, active challenges, and user's groups on mount so the
// context pickers have something to choose from.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Handshake as CollabIcon,
    Save as SaveIcon,
    Close as CancelIcon,
    Shuffle,
    Palette,
    Star,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
    collaborationsAPI,
    memeAPI,
    challengesAPI,
    groupsAPI,
} from '../services/api';
import { PageHeader, Section } from '../components/common';

const TYPE_OPTIONS = [
    { value: 'collaboration', label: 'General collab', icon: <CollabIcon /> },
    { value: 'remix', label: 'Remix', icon: <Shuffle /> },
    { value: 'template_creation', label: 'Template creation', icon: <Palette /> },
    { value: 'challenge_response', label: 'Challenge response', icon: <Star /> },
];

const SUGGESTED_TAGS = [
    'funny', 'creative', 'educational', 'artistic', 'meme', 'remix',
    'challenge', 'community', 'trending', 'original',
];

const CreateCollaboration = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [form, setForm] = useState({
        title: '',
        description: '',
        type: searchParams.get('type') || 'collaboration',
        originalMeme: '',
        challenge: '',
        group: '',
        tags: [],
        settings: {
            isPublic: true,
            allowForks: true,
            requireApproval: false,
            maxCollaborators: 10,
            allowAnonymous: false,
            deadline: '',
        },
    });

    const [memes, setMemes] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [groups, setGroups] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoadingOptions(true);
                const [memesResp, chResp, grResp] = await Promise.allSettled([
                    memeAPI.getMyMemes(),
                    challengesAPI.getChallenges({ status: 'active' }),
                    groupsAPI.getUserGroups(),
                ]);
                if (cancelled) return;

                if (memesResp.status === 'fulfilled') {
                    const list =
                        memesResp.value?.data?.memes ||
                        memesResp.value?.memes ||
                        memesResp.value?.data ||
                        [];
                    const normalized = (Array.isArray(list) ? list : [])
                        .map((m) => {
                            const id = m._id || m.id;
                            if (!id) return null;
                            return { _id: id, title: m.title || 'Untitled', imageUrl: m.imageUrl };
                        })
                        .filter(Boolean);
                    setMemes(normalized);
                }
                if (chResp.status === 'fulfilled') {
                    setChallenges(
                        chResp.value?.data?.challenges ||
                            chResp.value?.challenges ||
                            chResp.value?.data ||
                            [],
                    );
                }
                if (grResp.status === 'fulfilled') {
                    setGroups(
                        grResp.value?.data ||
                            grResp.value?.groups ||
                            [],
                    );
                }
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const setField = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const setSetting = (field, value) =>
        setForm((prev) => ({ ...prev, settings: { ...prev.settings, [field]: value } }));

    const canSubmit =
        form.title.trim().length >= 3 &&
        form.title.trim().length <= 200 &&
        (form.type !== 'remix' || form.originalMeme) &&
        (form.type !== 'challenge_response' || form.challenge);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            setLoading(true);
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                type: form.type,
                tags: form.tags,
                settings: form.settings,
                originalMeme: form.originalMeme || undefined,
                challenge: form.challenge || undefined,
                group: form.group || undefined,
            };
            if (payload.originalMeme && !/^[0-9a-fA-F]{24}$/.test(payload.originalMeme)) {
                throw new Error('Selected meme has an invalid ID. Try re-selecting it.');
            }
            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            const created = await collaborationsAPI.createCollaboration(payload);
            setSuccess('Collaboration created. Redirecting…');
            setTimeout(() => {
                const id = created?._id || created?.data?._id;
                navigate(id ? `/collaborations/${id}` : '/collaborations');
            }, 1000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to create collaboration.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <PageHeader
                eyebrow="NEW COLLAB"
                title="Start a collaboration"
                subtitle="Pick a type, give it a name, and invite the community to build with you."
                icon={<CollabIcon />}
                actions={
                    <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => navigate('/collaborations')}
                    >
                        Cancel
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
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Type + basics */}
                    <Section title="Basics" dense>
                        <Box
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: 3,
                                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                background: theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.sm,
                            }}
                        >
                            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Type</Typography>
                            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                                {TYPE_OPTIONS.map((t) => {
                                    const active = form.type === t.value;
                                    return (
                                        <Grid item xs={6} sm={3} key={t.value}>
                                            <Button
                                                fullWidth
                                                variant={active ? 'contained' : 'outlined'}
                                                startIcon={t.icon}
                                                onClick={() => setField('type', t.value)}
                                                sx={{
                                                    py: 1.25,
                                                    fontWeight: 800,
                                                    borderWidth: 2,
                                                    textTransform: 'none',
                                                    '&:hover': { borderWidth: 2 },
                                                }}
                                            >
                                                {t.label}
                                            </Button>
                                        </Grid>
                                    );
                                })}
                            </Grid>

                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    value={form.title}
                                    onChange={(e) => setField('title', e.target.value)}
                                    required
                                    helperText={`${form.title.length}/200 (min 3)`}
                                    inputProps={{ maxLength: 200 }}
                                    error={form.title.length > 0 && form.title.length < 3}
                                />
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={form.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                    multiline
                                    rows={4}
                                    placeholder="What's this collab about? What are you hoping for?"
                                />
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    options={SUGGESTED_TAGS}
                                    value={form.tags}
                                    onChange={(_, v) => setField('tags', v)}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...rest } = getTagProps({ index });
                                            return <Chip key={key} label={option} {...rest} />;
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tags" placeholder="Type and hit enter" />
                                    )}
                                />
                            </Stack>
                        </Box>
                    </Section>

                    {/* Context pickers */}
                    {(form.type === 'remix' || form.type === 'challenge_response' || groups.length > 0) && (
                        <Section title="Context" dense>
                            <Box
                                sx={{
                                    p: { xs: 2.5, md: 3 },
                                    borderRadius: 3,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                    background: theme.palette.background.paper,
                                    boxShadow: theme.tokens?.shadow?.sm,
                                }}
                            >
                                <Stack spacing={2.5}>
                                    {form.type === 'remix' && (
                                        <FormControl fullWidth required>
                                            <InputLabel>Original meme</InputLabel>
                                            <Select
                                                value={form.originalMeme}
                                                label="Original meme"
                                                onChange={(e) => setField('originalMeme', e.target.value)}
                                                disabled={loadingOptions}
                                            >
                                                {memes.length === 0 && (
                                                    <MenuItem value="" disabled>
                                                        {loadingOptions
                                                            ? 'Loading your memes…'
                                                            : 'No memes available. Create one first.'}
                                                    </MenuItem>
                                                )}
                                                {memes.map((m) => (
                                                    <MenuItem key={m._id} value={m._id}>
                                                        {m.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {form.type === 'challenge_response' && (
                                        <FormControl fullWidth required>
                                            <InputLabel>Challenge</InputLabel>
                                            <Select
                                                value={form.challenge}
                                                label="Challenge"
                                                onChange={(e) => setField('challenge', e.target.value)}
                                                disabled={loadingOptions}
                                            >
                                                {challenges.length === 0 && (
                                                    <MenuItem value="" disabled>
                                                        {loadingOptions ? 'Loading…' : 'No active challenges'}
                                                    </MenuItem>
                                                )}
                                                {challenges.map((c) => (
                                                    <MenuItem key={c._id} value={c._id}>
                                                        {c.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {groups.length > 0 && (
                                        <FormControl fullWidth>
                                            <InputLabel>Group (optional)</InputLabel>
                                            <Select
                                                value={form.group}
                                                label="Group (optional)"
                                                onChange={(e) => setField('group', e.target.value)}
                                            >
                                                <MenuItem value="">None</MenuItem>
                                                {groups.map((g) => (
                                                    <MenuItem key={g._id} value={g._id}>
                                                        {g.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Stack>
                            </Box>
                        </Section>
                    )}

                    {/* Settings */}
                    <Section title="Settings" dense>
                        <Box
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: 3,
                                border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                background: theme.palette.background.paper,
                                boxShadow: theme.tokens?.shadow?.sm,
                            }}
                        >
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.settings.isPublic}
                                                onChange={(e) => setSetting('isPublic', e.target.checked)}
                                            />
                                        }
                                        label={<Typography sx={{ fontWeight: 700 }}>Public</Typography>}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.settings.allowForks}
                                                onChange={(e) => setSetting('allowForks', e.target.checked)}
                                            />
                                        }
                                        label={<Typography sx={{ fontWeight: 700 }}>Allow forks</Typography>}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.settings.requireApproval}
                                                onChange={(e) => setSetting('requireApproval', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontWeight: 700 }}>Approve new participants</Typography>
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={form.settings.allowAnonymous}
                                                onChange={(e) => setSetting('allowAnonymous', e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontWeight: 700 }}>Allow anonymous</Typography>
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Max collaborators"
                                        value={form.settings.maxCollaborators}
                                        onChange={(e) =>
                                            setSetting('maxCollaborators', Number(e.target.value) || 1)
                                        }
                                        inputProps={{ min: 2, max: 100 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="datetime-local"
                                        label="Deadline (optional)"
                                        InputLabelProps={{ shrink: true }}
                                        value={form.settings.deadline}
                                        onChange={(e) => setSetting('deadline', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Section>

                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 4, mb: 6 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/collaborations')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={
                                loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                            }
                            disabled={!canSubmit || loading}
                            sx={{ minWidth: 180, fontWeight: 800 }}
                        >
                            {loading ? 'Creating…' : 'Create collaboration'}
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default CreateCollaboration;
