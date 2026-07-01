import { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Stack, LinearProgress, Button,
  Menu, MenuItem, Divider, CircularProgress, useTheme,
} from '@mui/material';
import TimerIcon      from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  STATUS_CONFIG, TRANSITION_LABELS, getProgressStats,
} from '../../../utils/pdiStatus';
import { computeElapsed, formatElapsed } from '../../../utils/time';
import { getMfrChipSx } from '../../../utils/manufacturers';

export default function PDIHeader({ pdi, items, transitions = [], onTransition, transitioning, canDelete, onDelete }) {
  const [anchorEl,  setAnchorEl]  = useState(null);
  const [, setTick] = useState(0);

  // Live timer — derive elapsed on each render (so it updates immediately when
  // the PDI changes) and force a re-render every second while in_progress. The
  // interval only bumps a tick counter; no state is set in the effect body.
  useEffect(() => {
    if (pdi?.status !== 'in_progress') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [pdi?.status]);

  const elapsed = computeElapsed(pdi);

  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const cfg         = STATUS_CONFIG[pdi?.status] ?? STATUS_CONFIG.not_started;
  const stats       = getProgressStats(items);

  // From unable_to_complete, moving to in_progress is a reopen, not a fresh start.
  const transitionLabel = (s) =>
    pdi?.status === 'unable_to_complete' && s === 'in_progress'
      ? 'Reopen PDI'
      : TRANSITION_LABELS[s];

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
              sx={{ fontWeight: 600, fontSize: 11, ...getMfrChipSx(pdi?.manufacturer, isDark) }}
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

      {/* Action row — status transitions and, for admins, delete */}
      {(transitions.length > 0 || canDelete) && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            {transitions.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                endIcon={transitioning ? <CircularProgress size={14} /> : <ExpandMoreIcon />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={transitioning}
              >
                Change Status
              </Button>
            )}
            {canDelete && (
              <Button
                variant="text"
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={onDelete}
                disabled={transitioning}
                sx={{ ml: 'auto' }}
              >
                Delete PDI
              </Button>
            )}
          </Stack>
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
                {transitionLabel(s)}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}
