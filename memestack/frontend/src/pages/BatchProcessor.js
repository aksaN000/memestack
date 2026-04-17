// ============================================================================
// BatchProcessor — run watermark/resize/compress/format ops on many images.
// ----------------------------------------------------------------------------
// Three numbered sections: pick files → configure operation → run & download.
// Presets pre-populate sensible settings. Results grid shows per-file success
// with preview/download actions. No backend calls — all client-side canvas.
// ============================================================================

import React, { useRef, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Slider,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    CheckCircle as SuccessIcon,
    Clear as ClearIcon,
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    DynamicFeed as BatchIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandMoreIcon,
    Image as ImageIcon,
    PlayArrow as StartIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';

import {
    BATCH_PRESETS,
    batchProcess,
    downloadBatchResults,
    validateBatchImages,
} from '../utils/batchProcessor';
import { WATERMARK_POSITIONS } from '../utils/watermark';
import { PageHeader } from '../components/common';

const hexToRgb = (hex) => {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return match
        ? `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}`
        : '255, 255, 255';
};

const BatchProcessor = () => {
    const theme = useTheme();
    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [operation, setOperation] = useState('watermark');
    const [preset, setPreset] = useState('');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [errors, setErrors] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedPreview, setSelectedPreview] = useState(null);

    const [watermarkSettings, setWatermarkSettings] = useState({
        type: 'text',
        text: 'MemeStack',
        position: 'bottom-right',
        fontSize: 24,
        color: '#ffffff',
        opacity: 0.8,
        backgroundColor: '#000000',
        backgroundOpacity: 0.3,
        useBackground: true,
    });

    const [resizeSettings, setResizeSettings] = useState({
        width: 1080,
        height: 1080,
        maintainAspectRatio: true,
        quality: 0.9,
    });

    const [compressSettings, setCompressSettings] = useState({
        quality: 0.7,
        maxWidth: 1920,
        maxHeight: 1080,
    });

    const [formatSettings, setFormatSettings] = useState({
        format: 'png',
        quality: 0.9,
    });

    // ---------------------------------------------------------------- helpers
    const surfaceSx = {
        p: { xs: 2, md: 3 },
        mb: 3,
        borderRadius: 3,
        border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: theme.tokens?.shadow?.sm,
    };

    const sectionHeader = (num, label) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: theme.palette.brand?.accent,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                }}
            >
                {num}
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>{label}</Typography>
        </Stack>
    );

    // ---------------------------------------------------------------- handlers
    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const validation = validateBatchImages(selectedFiles);
        if (!validation.valid) {
            setErrors(validation.errors);
            return;
        }
        setFiles(validation.validFiles);
        setErrors([]);
        setResults([]);
    };

    const removeFile = (index) =>
        setFiles((prev) => prev.filter((_, i) => i !== index));

    const clearFiles = () => {
        setFiles([]);
        setResults([]);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const applyPreset = (presetName) => {
        const presetConfig = BATCH_PRESETS[presetName];
        if (!presetConfig) return;
        setOperation(presetConfig.operation);
        switch (presetConfig.operation) {
            case 'watermark':
                setWatermarkSettings((p) => ({ ...p, ...presetConfig.options }));
                break;
            case 'resize':
                setResizeSettings((p) => ({ ...p, ...presetConfig.options }));
                break;
            case 'compress':
                setCompressSettings((p) => ({ ...p, ...presetConfig.options }));
                break;
            case 'format':
                setFormatSettings((p) => ({ ...p, ...presetConfig.options }));
                break;
            default:
                break;
        }
    };

    const getOperationOptions = () => {
        switch (operation) {
            case 'watermark':
                return {
                    type: watermarkSettings.type,
                    text: watermarkSettings.text,
                    position: watermarkSettings.position,
                    fontSize: watermarkSettings.fontSize,
                    color: `rgba(${hexToRgb(watermarkSettings.color)}, ${watermarkSettings.opacity})`,
                    backgroundColor: watermarkSettings.useBackground
                        ? `rgba(${hexToRgb(watermarkSettings.backgroundColor)}, ${watermarkSettings.backgroundOpacity})`
                        : 'transparent',
                };
            case 'resize':
                return resizeSettings;
            case 'compress':
                return compressSettings;
            case 'format':
                return formatSettings;
            default:
                return {};
        }
    };

    const startBatchProcessing = async () => {
        if (files.length === 0) {
            setErrors(['No files selected for processing']);
            return;
        }
        setProcessing(true);
        setProgress(0);
        setErrors([]);
        try {
            const options = getOperationOptions();
            const batchResults = await batchProcess(
                files,
                operation,
                options,
                (current, total) => setProgress((current / total) * 100),
                (err) => console.error('Batch processing error:', err)
            );
            setResults(batchResults);
            const errorCount = batchResults.filter((r) => !r.success).length;
            if (errorCount > 0) {
                setErrors([`${errorCount} file(s) failed to process.`]);
            }
        } catch (e) {
            setErrors([e.message || 'Batch processing failed']);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const downloadResults = async () => {
        try {
            await downloadBatchResults(results, `batch_${operation}_${Date.now()}.zip`);
        } catch (e) {
            setErrors([e.message || 'Failed to download results']);
        }
    };

    const successfulResults = results.filter((r) => r.success);

    // ---------------------------------------------------------------- render
    return (
        <Box>
            <PageHeader
                eyebrow="CREATOR TOOLS"
                title="Batch image processor"
                subtitle="Apply watermarks, resize, compress, or convert a pile of images in one go — all client-side."
                icon={<BatchIcon />}
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Section 1 — Upload */}
                <Box sx={surfaceSx}>
                    {sectionHeader(1, 'Select images')}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<UploadIcon />}
                            sx={{ fontWeight: 800 }}
                        >
                            Choose files
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                onChange={handleFileSelect}
                            />
                        </Button>
                        {files.length > 0 && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<ClearIcon />}
                                onClick={clearFiles}
                            >
                                Clear all
                            </Button>
                        )}
                    </Stack>
                    {files.length > 0 && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 700,
                                    display: 'block',
                                    mb: 1,
                                }}
                            >
                                {files.length} file{files.length === 1 ? '' : 's'} selected
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ maxHeight: 200, overflow: 'auto' }}
                            >
                                {files.map((file, index) => (
                                    <Chip
                                        key={`${file.name}-${index}`}
                                        icon={<ImageIcon />}
                                        label={file.name}
                                        size="small"
                                        onDelete={() => removeFile(index)}
                                        sx={{ fontWeight: 700 }}
                                    />
                                ))}
                            </Stack>
                        </>
                    )}
                </Box>

                {/* Section 2 — Configure */}
                <Box sx={surfaceSx}>
                    {sectionHeader(2, 'Configure operation')}

                    <Typography
                        variant="caption"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            display: 'block',
                            mb: 1,
                        }}
                    >
                        Quick presets
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                        {Object.keys(BATCH_PRESETS).map((name) => (
                            <Chip
                                key={name}
                                label={name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                onClick={() => {
                                    setPreset(name);
                                    applyPreset(name);
                                }}
                                variant={preset === name ? 'filled' : 'outlined'}
                                color={preset === name ? 'primary' : 'default'}
                                sx={{ fontWeight: 700 }}
                            />
                        ))}
                    </Stack>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Operation</InputLabel>
                        <Select
                            value={operation}
                            label="Operation"
                            onChange={(e) => setOperation(e.target.value)}
                        >
                            <MenuItem value="watermark">Add watermark</MenuItem>
                            <MenuItem value="resize">Resize images</MenuItem>
                            <MenuItem value="compress">Compress images</MenuItem>
                            <MenuItem value="format">Convert format</MenuItem>
                        </Select>
                    </FormControl>

                    {operation === 'watermark' && (
                        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 800 }}>Watermark settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Watermark text"
                                            value={watermarkSettings.text}
                                            onChange={(e) =>
                                                setWatermarkSettings((p) => ({
                                                    ...p,
                                                    text: e.target.value,
                                                }))
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Position</InputLabel>
                                            <Select
                                                value={watermarkSettings.position}
                                                label="Position"
                                                onChange={(e) =>
                                                    setWatermarkSettings((p) => ({
                                                        ...p,
                                                        position: e.target.value,
                                                    }))
                                                }
                                            >
                                                {WATERMARK_POSITIONS.map((pos) => (
                                                    <MenuItem key={pos.value} value={pos.value}>
                                                        {pos.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                            Font size: {watermarkSettings.fontSize}px
                                        </Typography>
                                        <Slider
                                            value={watermarkSettings.fontSize}
                                            onChange={(_, v) =>
                                                setWatermarkSettings((p) => ({
                                                    ...p,
                                                    fontSize: v,
                                                }))
                                            }
                                            min={10}
                                            max={72}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                            Opacity: {Math.round(watermarkSettings.opacity * 100)}%
                                        </Typography>
                                        <Slider
                                            value={watermarkSettings.opacity}
                                            onChange={(_, v) =>
                                                setWatermarkSettings((p) => ({
                                                    ...p,
                                                    opacity: v,
                                                }))
                                            }
                                            min={0.1}
                                            max={1}
                                            step={0.1}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {operation === 'resize' && (
                        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 800 }}>Resize settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Width (px)"
                                            value={resizeSettings.width}
                                            onChange={(e) =>
                                                setResizeSettings((p) => ({
                                                    ...p,
                                                    width: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Height (px)"
                                            value={resizeSettings.height}
                                            onChange={(e) =>
                                                setResizeSettings((p) => ({
                                                    ...p,
                                                    height: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={resizeSettings.maintainAspectRatio}
                                                    onChange={(e) =>
                                                        setResizeSettings((p) => ({
                                                            ...p,
                                                            maintainAspectRatio: e.target.checked,
                                                        }))
                                                    }
                                                />
                                            }
                                            label="Maintain aspect ratio"
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {operation === 'compress' && (
                        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 800 }}>Compression settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                            Quality: {Math.round(compressSettings.quality * 100)}%
                                        </Typography>
                                        <Slider
                                            value={compressSettings.quality}
                                            onChange={(_, v) =>
                                                setCompressSettings((p) => ({ ...p, quality: v }))
                                            }
                                            min={0.1}
                                            max={1}
                                            step={0.1}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Max width (px)"
                                            value={compressSettings.maxWidth}
                                            onChange={(e) =>
                                                setCompressSettings((p) => ({
                                                    ...p,
                                                    maxWidth: parseInt(e.target.value) || null,
                                                }))
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Max height (px)"
                                            value={compressSettings.maxHeight}
                                            onChange={(e) =>
                                                setCompressSettings((p) => ({
                                                    ...p,
                                                    maxHeight: parseInt(e.target.value) || null,
                                                }))
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    {operation === 'format' && (
                        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 800 }}>Format settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Output format</InputLabel>
                                            <Select
                                                value={formatSettings.format}
                                                label="Output format"
                                                onChange={(e) =>
                                                    setFormatSettings((p) => ({
                                                        ...p,
                                                        format: e.target.value,
                                                    }))
                                                }
                                            >
                                                <MenuItem value="png">PNG</MenuItem>
                                                <MenuItem value="jpeg">JPEG</MenuItem>
                                                <MenuItem value="webp">WebP</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                            Quality: {Math.round(formatSettings.quality * 100)}%
                                        </Typography>
                                        <Slider
                                            value={formatSettings.quality}
                                            onChange={(_, v) =>
                                                setFormatSettings((p) => ({ ...p, quality: v }))
                                            }
                                            min={0.1}
                                            max={1}
                                            step={0.1}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Box>

                {/* Section 3 — Process */}
                <Box sx={surfaceSx}>
                    {sectionHeader(3, 'Process')}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<StartIcon />}
                        onClick={startBatchProcessing}
                        disabled={files.length === 0 || processing}
                        sx={{ mb: 2, fontWeight: 900 }}
                    >
                        {processing
                            ? 'Processing…'
                            : `Process ${files.length || 0} image${files.length === 1 ? '' : 's'}`}
                    </Button>
                    {processing && (
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 10, borderRadius: 2 }}
                            />
                            <Typography
                                variant="body2"
                                sx={{ color: theme.palette.text.secondary, mt: 1 }}
                            >
                                {Math.round(progress)}% complete
                            </Typography>
                        </Box>
                    )}
                </Box>

                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Errors</Typography>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                {results.length > 0 && (
                    <Box sx={surfaceSx}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 2 }}
                        >
                            <Typography sx={{ fontWeight: 900 }}>
                                Results ({successfulResults.length}/{results.length} successful)
                            </Typography>
                            {successfulResults.length > 0 && (
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadResults}
                                    sx={{ fontWeight: 800 }}
                                >
                                    Download all
                                </Button>
                            )}
                        </Stack>

                        <Grid container spacing={2}>
                            {results.map((result, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                            background: theme.palette.background.paper,
                                            boxShadow: theme.tokens?.shadow?.sm,
                                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                            '&:hover': result.success
                                                ? {
                                                      transform: 'translate(-2px, -2px)',
                                                      boxShadow: theme.tokens?.shadow?.md,
                                                  }
                                                : {},
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            sx={{ mb: 1 }}
                                        >
                                            {result.success ? (
                                                <SuccessIcon color="success" fontSize="small" />
                                            ) : (
                                                <ErrorIcon color="error" fontSize="small" />
                                            )}
                                            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                                {result.original.name}
                                            </Typography>
                                        </Stack>
                                        {result.success ? (
                                            <>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        display: 'block',
                                                    }}
                                                    noWrap
                                                >
                                                    {result.result.filename}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedPreview(result);
                                                        setPreviewOpen(true);
                                                    }}
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    <PreviewIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <Typography variant="caption" color="error">
                                                {result.error}
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedPreview && (
                    <>
                        <DialogTitle sx={{ fontWeight: 900 }}>
                            Preview: {selectedPreview.result.filename}
                        </DialogTitle>
                        <DialogContent>
                            <Box
                                component="img"
                                src={selectedPreview.result.url}
                                alt="Preview"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '70vh',
                                    objectFit: 'contain',
                                    borderRadius: 2,
                                    border: `2px solid ${theme.palette.brand?.border || theme.palette.divider}`,
                                }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = selectedPreview.result.url;
                                    a.download = selectedPreview.result.filename;
                                    a.click();
                                }}
                                sx={{ fontWeight: 800 }}
                            >
                                Download
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default BatchProcessor;
