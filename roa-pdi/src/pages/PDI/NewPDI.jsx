import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  MenuItem, Select, FormControl, InputLabel, FormHelperText,
  Stack, Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import ArrowBackIcon   from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth }     from '../../contexts/AuthContext';
import { useTechnicians } from '../../hooks/useActiveUsers';
import { isRONumberUnique, createPDI } from '../../services/pdi';
import { fetchTemplateItems }          from '../../services/template';

const MANUFACTURERS = [
  { value: 'PAUSE', label: 'PAUSE', desc: 'Pause Trailers' },
  { value: 'MDC',   label: 'MDC',   desc: 'MDC Trailers' },
];

export default function NewPDI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { technicians, loading: techLoading } = useTechnicians();

  const [roNumber,     setRONumber]     = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [assignedTo,   setAssignedTo]   = useState('');
  const [errors,       setErrors]       = useState({});
  const [roChecking,   setROChecking]   = useState(false);
  const [roValid,      setROValid]      = useState(null); // null | true | false
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');

  // Debounced RO# uniqueness check
  useEffect(() => {
    if (!roNumber.trim()) {
      setROValid(null);
      return;
    }
    setROChecking(true);
    setROValid(null);
    const timer = setTimeout(async () => {
      const unique = await isRONumberUnique(roNumber.trim());
      setROValid(unique);
      setROChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [roNumber]);

  function validate() {
    const e = {};
    if (!roNumber.trim())  e.roNumber     = 'Repair Order number is required.';
    if (roValid === false) e.roNumber     = 'This RO number already exists.';
    if (!manufacturer)     e.manufacturer = 'Select a manufacturer.';
    if (!assignedTo)       e.assignedTo   = 'Assign to a technician.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const items = await fetchTemplateItems(manufacturer);
      const pdiId = await createPDI(
        {
          repairOrderNumber: roNumber.trim(),
          manufacturer,
          assignedTo,
          createdBy: user.uid,
        },
        items,
      );
      navigate(`/pdi/${pdiId}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create PDI. Please try again.');
      setSubmitting(false);
    }
  }

  const roHelperText = () => {
    if (roChecking) return 'Checking…';
    if (roValid === true)  return 'RO number is available.';
    if (roValid === false) return 'This RO number already exists.';
    return errors.roNumber || '';
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
      </Stack>

      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Create New PDI
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Enter the Repair Order number and assign a technician to begin.
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>
      )}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={3}>

              {/* RO Number */}
              <TextField
                label="Repair Order Number"
                placeholder="e.g. RO-12345"
                value={roNumber}
                onChange={(e) => setRONumber(e.target.value)}
                error={!!errors.roNumber || roValid === false}
                helperText={roHelperText()}
                InputProps={{
                  endAdornment: roChecking ? (
                    <CircularProgress size={16} />
                  ) : roValid === true ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : null,
                }}
                fullWidth
                required
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />

              {/* Manufacturer */}
              <FormControl fullWidth required error={!!errors.manufacturer}>
                <InputLabel>Manufacturer</InputLabel>
                <Select
                  value={manufacturer}
                  label="Manufacturer"
                  onChange={(e) => setManufacturer(e.target.value)}
                >
                  {MANUFACTURERS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={m.label}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: m.value === 'PAUSE' ? '#E3F2FD' : '#E8F5E9',
                            color:   m.value === 'PAUSE' ? '#1565C0' : '#2E7D32',
                          }}
                        />
                        <Typography variant="body2">{m.desc}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errors.manufacturer && (
                  <FormHelperText>{errors.manufacturer}</FormHelperText>
                )}
              </FormControl>

              <Divider />

              {/* Technician */}
              <FormControl fullWidth required error={!!errors.assignedTo}>
                <InputLabel>Assign Technician</InputLabel>
                <Select
                  value={assignedTo}
                  label="Assign Technician"
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={techLoading}
                >
                  {technicians.length === 0 && !techLoading && (
                    <MenuItem disabled>No active technicians</MenuItem>
                  )}
                  {technicians.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.displayName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignedTo && (
                  <FormHelperText>{errors.assignedTo}</FormHelperText>
                )}
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting || roChecking || roValid === false}
              >
                {submitting ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} color="inherit" />
                    <span>Creating PDI…</span>
                  </Stack>
                ) : 'Create PDI'}
              </Button>

            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
