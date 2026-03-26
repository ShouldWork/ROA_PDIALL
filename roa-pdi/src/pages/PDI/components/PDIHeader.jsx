import { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Stack, LinearProgress, Button,
  Menu, MenuItem, Divider, CircularProgress,
} from '@mui/material';
import TimerIcon      from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  STATUS_CONFIG, ALLOWED_TRANSITIONS, TRANSITION_LABELS, getProgressStats,
} from '../../../utils/pdiStatus';
import { computeElapsed, formatElapsed } from '../../../utils/time';

export default function PDIHeader({ pdi, items, onTransition, transitioning }) {
  const [elapsed,   setElapsed]   = useState(0);
  const [anchorEl,  setAnchorEl]  = useState(null);

  // Live timer — ticks every second while in_progress
  useEffect(() => {
    setElapsed(computeElapsed(pdi));
    if (pdi?.status !== 'in_progress') return;
    const id = setInterval(() => setElapsed(computeElapsed(pdi)), 1000);
    return () => clearInterval(id);
  }, [pdi]);

  const cfg         = STATUS_CONFIG[pdi?.status] ?? STATUS_CONFIG.not_started;
  const transitions = ALLOWED_TRANSITIONS[pdi?.status] ?? [];
  const stats       = getProgressStats(items);

  const handleTransition = (newStatus) => {
    setAnchorEl(null);
    onTransition(newStatus, elapsed);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 2, sm: 2.5 },
        mb: 2,
      }}
    >
      {/* Top row: RO# + manufacturer + status */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb={1.5}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {pdi?.repairOrderNumber}
          </Typography>
          <Stack direction="row" spacing={0.75} mt={0.5} flexWrap="wrap">
            <Chip
              label={pdi?.manufacturer}
              size="small"
              sx={{
                fontWeight: 600, fontSize: 11,
                bgcolor: pdi?.manufacturer === 'PAUSE' ? '#E3F2FD' : '#E8F5E9',
                color:   pdi?.manufacturer === 'PAUSE' ? '#1565C0' : '#2E7D32',
              }}
            />
            <Chip
              label={cfg.label}
              size="small"
              color={cfg.chipColor}
              sx={{ fontWeight: 500 }}
            />
          </Stack>
        </Box>

        {/* Timer */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="h6" fontWeight={700} fontFamily="monospace" color="text.secondary">
            {formatElapsed(elapsed)}
          </Typography>
        </Stack>
      </Stack>

      {/* Progress bar */}
      <Box mb={1.5}>
        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            {stats.evaluated} of {stats.total} items evaluated
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Typography variant="caption" fontWeight={600} color="success.main">
              {stats.passed} pass
            </Typography>
            <Typography variant="caption" fontWeight={600} color="error.main">
              {stats.failed} fail
            </Typography>
          </Stack>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={stats.progressPct}
          sx={{ borderRadius: 3 }}
          color={stats.failed > 0 ? 'warning' : 'primary'}
        />
      </Box>

      {/* Status action button */}
      {transitions.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Button
            variant="outlined"
            size="small"
            endIcon={transitioning ? <CircularProgress size={14} /> : <ExpandMoreIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={transitioning}
          >
            Change Status
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {transitions.map((s) => (
              <MenuItem key={s} onClick={() => handleTransition(s)}>
                <Chip
                  label={STATUS_CONFIG[s]?.label}
                  size="small"
                  color={STATUS_CONFIG[s]?.chipColor}
                  sx={{ mr: 1, fontWeight: 500 }}
                />
                {TRANSITION_LABELS[s]}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}
