import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardActionArea, CardContent,
  Chip, Grid, TextField, InputAdornment, Skeleton, Alert,
  LinearProgress, Stack, useTheme,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import SearchIcon      from '@mui/icons-material/Search';
import AccessTimeIcon  from '@mui/icons-material/AccessTime';
import PersonIcon      from '@mui/icons-material/Person';
import { usePDIList }  from '../../hooks/usePDIList';
import { useAuth }     from '../../contexts/AuthContext';
import { STATUS_CONFIG } from '../../utils/pdiStatus';
import { formatDate }  from '../../utils/time';
import { getMfrChipSx } from '../../utils/manufacturers';

const STATUS_FILTERS = [
  { value: 'all',                label: 'All' },
  { value: 'not_started',        label: 'Not Started' },
  { value: 'in_progress',        label: 'In Progress' },
  { value: 'paused',             label: 'Paused' },
  { value: 'completed',          label: 'Completed' },
  { value: 'unable_to_complete', label: 'Unable' },
];

const MFR_FILTERS = [
  { value: 'all',   label: 'All' },
  { value: 'PAUSE', label: 'PAUSE' },
  { value: 'MDC',   label: 'MDC' },
];

// L5: extracted from inline IIFE so JSX stays readable
function PDIProgress({ summary: s }) {
  if (!s || s.total === 0) return null;
  const evaluated   = (s.pass ?? 0) + (s.fail ?? 0) + (s.not_applicable ?? 0);
  const progressPct = Math.round((evaluated / s.total) * 100);
  const passRate    = evaluated > 0 ? Math.round((s.pass / evaluated) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" color="text.secondary">
          {evaluated} / {s.total} evaluated
        </Typography>
        <Typography variant="caption" fontWeight={600} color="success.main">
          {passRate}% pass
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function PDICard({ pdi, onClick, isDark }) {
  const cfg     = STATUS_CONFIG[pdi.status] ?? STATUS_CONFIG.not_started;
  const isCombo = pdi.status !== 'not_started';

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent>
          {/* Top row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {pdi.repairOrderNumber}
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Chip
                label={pdi.manufacturer}
                size="small"
                sx={{ fontWeight: 600, fontSize: 11, ...getMfrChipSx(pdi.manufacturer, isDark) }}
              />
              <Chip
                label={cfg.label}
                size="small"
                color={cfg.chipColor}
                sx={{ fontWeight: 500, fontSize: 11 }}
              />
            </Stack>
          </Stack>

          {/* Meta row */}
          <Stack direction="row" spacing={2} mb={isCombo ? 1.5 : 0}>
            {pdi.technicianName && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {pdi.technicianName}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(pdi.createdAt)}
              </Typography>
            </Stack>
          </Stack>

          {/* Progress — only once items have been evaluated */}
          <PDIProgress summary={pdi.progressSummary} />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Dashboard() {
  const { userProfile, isAdmin, isServiceWriter } = useAuth();
  const { pdis, loading, error } = usePDIList();
  const navigate = useNavigate();
  const isDark   = useTheme().palette.mode === 'dark';

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mfrFilter,    setMfrFilter]    = useState('all');

  const canCreate = isAdmin || isServiceWriter;

  const filtered = useMemo(() => {
    return pdis.filter((p) => {
      if (search && !p.repairOrderNumber?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (mfrFilter    !== 'all' && p.manufacturer !== mfrFilter) return false;
      return true;
    });
  }, [pdis, search, statusFilter, mfrFilter]);

  // Stat counts
  const stats = useMemo(() => ({
    total:      pdis.length,
    inProgress: pdis.filter((p) => p.status === 'in_progress').length,
    paused:     pdis.filter((p) => p.status === 'paused').length,
    completed:  pdis.filter((p) => p.status === 'completed').length,
  }), [pdis]);

  return (
    <Box>
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {userProfile?.displayName?.split(' ')[0]}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/pdi/new')}
            size="large"
          >
            New PDI
          </Button>
        )}
      </Stack>

      {/* Stat cards — admin/SW only */}
      {canCreate && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total PDIs"  value={stats.total}      />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="In Progress" value={stats.inProgress} color="primary.main" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Paused"      value={stats.paused}     color="warning.main" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Completed"   value={stats.completed}  color="success.main" />
          </Grid>
        </Grid>
      )}

      {/* Search + filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by RO number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />

          {/* Status filter chips */}
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {STATUS_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                clickable
                variant={statusFilter === f.value ? 'filled' : 'outlined'}
                color={statusFilter === f.value ? 'primary' : 'default'}
                onClick={() => setStatusFilter(f.value)}
              />
            ))}
          </Box>

          {/* Manufacturer filter */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {MFR_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                clickable
                variant={mfrFilter === f.value ? 'filled' : 'outlined'}
                color={mfrFilter === f.value ? 'secondary' : 'default'}
                onClick={() => setMfrFilter(f.value)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load PDIs. Check your connection.
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <Box>
          {[1, 2, 3].map((n) => (
            <Card key={n} sx={{ mb: 1.5 }}>
              <CardContent>
                <Skeleton width="40%" height={24} />
                <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                <Skeleton width="100%" height={8} sx={{ mt: 1.5, borderRadius: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* PDI list */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {pdis.length === 0
                ? canCreate
                  ? 'No PDIs yet. Create one to get started.'
                  : 'No PDIs assigned to you yet.'
                : 'No PDIs match the current filters.'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.map((pdi) => (
        <PDICard
          key={pdi.id}
          pdi={pdi}
          isDark={isDark}
          onClick={() => navigate(`/pdi/${pdi.id}`)}
        />
      ))}
    </Box>
  );
}
