import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { approveSuggestion, rejectSuggestion } from '../../../services/template';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../utils/time';

function RejectDialog({ suggestion, open, onClose }) {
  const { user } = useAuth();
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleReject() {
    setSaving(true);
    setError('');
    try {
      await rejectSuggestion(suggestion.id, user.uid, notes.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reject suggestion.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reject Suggestion</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} pt={0.5}>
          <Typography variant="body2" color="text.secondary">
            <em>"{suggestion?.itemText}"</em>
          </Typography>
          <TextField
            label="Reason (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            fullWidth
            inputProps={{ maxLength: 300 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleReject}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CloseIcon />}
        >
          {saving ? 'Rejecting…' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ApproveDialog({ suggestion, open, onClose }) {
  const { user } = useAuth();
  const [sort,   setSort]   = useState(999);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleApprove() {
    setSaving(true);
    setError('');
    try {
      await approveSuggestion(suggestion.id, { ...suggestion, sort }, user.uid);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to approve suggestion.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Approve Suggestion</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} pt={0.5}>
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>{suggestion?.itemText}</Typography>
            <Typography variant="caption" color="text.secondary">
              {suggestion?.category}{suggestion?.subcategory ? ` › ${suggestion.subcategory}` : ''} · {suggestion?.manufacturer}
            </Typography>
          </Stack>
          <TextField
            label="Sort Order"
            type="number"
            value={sort}
            onChange={(e) => setSort(parseInt(e.target.value, 10) || 999)}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 9999 }}
            helperText="Position within its category (lower = first)"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          color="success"
          variant="contained"
          onClick={handleApprove}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
        >
          {saving ? 'Approving…' : 'Approve & Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * List of pending suggestions with approve / reject actions.
 *
 * Props:
 *   suggestions — array from subscribeSuggestions()
 *   loading     — boolean
 *   error       — string | null
 */
export default function SuggestionQueue({ suggestions, loading, error }) {
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);

  if (loading) return null;

  if (error) {
    return <Alert severity="error">Failed to load suggestions: {error}</Alert>;
  }

  if (suggestions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No pending suggestions.
      </Typography>
    );
  }

  return (
    <>
      <Stack spacing={1.5}>
        {suggestions.map((s) => (
          <Card key={s.id} variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                {/* Left: content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                    {s.itemText}
                  </Typography>
                  <Stack direction="row" spacing={0.75} mt={0.5} flexWrap="wrap">
                    <Chip
                      label={s.manufacturer}
                      size="small"
                      sx={{
                        fontSize: 10, height: 18,
                        bgcolor: s.manufacturer === 'PAUSE' ? '#E3F2FD' : '#E8F5E9',
                        color:   s.manufacturer === 'PAUSE' ? '#1565C0' : '#2E7D32',
                      }}
                    />
                    <Chip label={s.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                    {s.subcategory && (
                      <Chip label={s.subcategory} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Submitted {formatDate(s.createdAt)}
                  </Typography>
                </Box>

                {/* Right: actions */}
                <Stack direction="row" spacing={0.5} flexShrink={0}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => setApproveTarget(s)}
                    sx={{ minWidth: 'unset', px: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => setRejectTarget(s)}
                    sx={{ minWidth: 'unset', px: 1 }}
                  >
                    Reject
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {approveTarget && (
        <ApproveDialog
          suggestion={approveTarget}
          open={!!approveTarget}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          suggestion={rejectTarget}
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}
