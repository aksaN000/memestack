// ============================================================================
// EditProfile — change display name, bio, avatar, and preferences.
// ----------------------------------------------------------------------------
// Left: big avatar tile with upload-in-place. Right: form fields. Keeps the
// account + security bits on AccountSettings so this page stays focused on
// public identity.
// ============================================================================

import React, { useRef, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    TextField,
    Typography,
    Avatar,
    Alert,
    LinearProgress,
    FormControlLabel,
    Switch,
    Stack,
    CircularProgress,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    PhotoCamera as CameraIcon,
    Save as SaveIcon,
    Close as CancelIcon,
    DeleteOutline as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { uploadAPI } from '../services/api';
import { PageHeader } from '../components/common';

const EditProfile = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        username: user?.username || '',
        displayName: user?.profile?.displayName || '',
        bio: user?.profile?.bio || '',
        avatar: user?.profile?.avatar || '',
        notifications: user?.preferences?.notifications ?? true,
    });
    const [preview, setPreview] = useState(form.avatar);

    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setError('');
        setSuccess('');
    };

    const handleAvatarPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Pick an image file (JPG, PNG, GIF, WebP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Avatar must be under 5MB.');
            return;
        }
        setAvatarUploading(true);
        setUploadProgress(0);
        setError('');
        try {
            const resp = await uploadAPI.uploadAvatar(file, (p) => setUploadProgress(p));
            if (!resp?.success) throw new Error(resp?.message || 'Avatar upload failed');
            const url = resp.data.url;
            setForm((prev) => ({ ...prev, avatar: url }));
            setPreview(url);
            setSuccess('Avatar updated — hit Save to publish it.');
        } catch (err) {
            setError(err.message || 'Avatar upload failed');
        } finally {
            setAvatarUploading(false);
            setUploadProgress(0);
        }
    };

    const clearAvatar = () => {
        setForm((prev) => ({ ...prev, avatar: '' }));
        setPreview('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const result = await updateProfile(form);
            if (result?.success) {
                setSuccess('Profile saved.');
                setTimeout(() => navigate('/profile'), 1000);
            } else {
                throw new Error(result?.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <PageHeader
                eyebrow="EDIT PROFILE"
                title="Make it yours"
                subtitle="Your display name, photo, and bio are what other people see on MemeStack."
                actions={
                    <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => navigate('/profile')}
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
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 3,
                        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        boxShadow: theme.tokens?.shadow?.md,
                    }}
                >
                    <Grid container spacing={4}>
                        {/* Avatar side */}
                        <Grid item xs={12} md={4}>
                            <Stack alignItems="center" spacing={2}>
                                <Avatar
                                    src={preview}
                                    sx={{
                                        width: 140,
                                        height: 140,
                                        fontSize: '3.5rem',
                                        fontWeight: 900,
                                        background: theme.palette.brand?.gradient,
                                        border: `3px solid ${theme.palette.brand?.border}`,
                                        boxShadow: theme.tokens?.shadow?.md,
                                    }}
                                >
                                    {(form.displayName || form.username || '?')
                                        .charAt(0)
                                        .toUpperCase()}
                                </Avatar>
                                <Button
                                    variant="contained"
                                    startIcon={
                                        avatarUploading ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <CameraIcon />
                                        )
                                    }
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    sx={{ width: '100%' }}
                                >
                                    {avatarUploading
                                        ? `Uploading ${uploadProgress}%`
                                        : 'Change avatar'}
                                </Button>
                                {preview && (
                                    <Button
                                        variant="text"
                                        size="small"
                                        color="error"
                                        startIcon={<ClearIcon />}
                                        onClick={clearAvatar}
                                    >
                                        Remove avatar
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarPick}
                                />
                                {avatarUploading && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{ width: '100%' }}
                                    />
                                )}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        textAlign: 'center',
                                    }}
                                >
                                    JPG, PNG, or GIF. Up to 5MB. Square images look best.
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Fields side */}
                        <Grid item xs={12} md={8}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    helperText="Unique handle — appears in URLs like /users/yourname."
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Display name"
                                    name="displayName"
                                    value={form.displayName}
                                    onChange={handleChange}
                                    helperText="Shown on your profile and next to your memes."
                                    inputProps={{ maxLength: 60 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Bio"
                                    name="bio"
                                    value={form.bio}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    inputProps={{ maxLength: 280 }}
                                    helperText={`${form.bio.length}/280`}
                                    placeholder="Tell people what kind of memes they'll get from you."
                                />

                                <Divider sx={{ my: 1 }} />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.notifications}
                                            onChange={handleChange}
                                            name="notifications"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography sx={{ fontWeight: 700 }}>
                                                Email notifications
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: theme.palette.text.secondary }}
                                            >
                                                Get a note when someone interacts with your stuff.
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ alignItems: 'flex-start', ml: 0 }}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/profile')}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={
                                saving ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <SaveIcon />
                                )
                            }
                            disabled={saving}
                            sx={{ minWidth: 140, fontWeight: 800 }}
                        >
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default EditProfile;
