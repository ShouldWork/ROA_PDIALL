import { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, TextField, Button, Stack,
  IconButton, Fab, Alert, CircularProgress,
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CloseIcon      from '@mui/icons-material/Close';
import { submitSuggestion } from '../../../services/suggestions';
import { useAuth } from '../../../contexts/AuthContext';

export default function SuggestItemDrawer({ manufacturer }) {
  const { user } = useAuth();
  const [open,       setOpen]       = useState(false);
  const [category,   setCategory]   = useState('');
  const [subcategory,setSubcategory]= useState('');
  const [itemText,   setItemText]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  // M4: useEffect with cleanup replaces the bare setTimeout in handleClose,
  // ensuring the timer is cancelled if the component unmounts before it fires.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      setCategory('');
      setSubcategory('');
      setItemText('');
      setSuccess(false);
      setError('');
    }, 300); // matches MUI drawer close transition
    return () => clearTimeout(id);
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!itemText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await submitSuggestion({
        manufacturer,
        category:    category.trim() || 'Uncategorized',
        subcategory: subcategory.trim(),
        itemText:    itemText.trim(),
        suggestedBy: user.uid,
      });
      setSuccess(true);
    } catch {
      setError('Failed to submit suggestion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating action button */}
      <Fab
        size="medium"
        color="secondary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 24 },   // above bottom nav on mobile
          right: 16,
          zIndex: 1200,
        }}
      >
        <AddCommentIcon />
      </Fab>

      {/* Bottom drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh' } }}
      >
        <Box sx={{ p: 3 }}>
          {/* Handle + header */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
          </Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>Suggest New Item</Typography>
            <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Suggest a new inspection item to be added to the {manufacturer} template.
            An admin will review your suggestion.
          </Typography>

          {success ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Suggestion submitted! An admin will review it.
              </Alert>
              <Button variant="outlined" onClick={() => setOpen(false)}>Close</Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}

                {/* M4: maxLength prevents arbitrarily large submissions */}
                <TextField
                  label="Category"
                  placeholder="e.g. Electrical"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 100 }}
                />
                <TextField
                  label="Subcategory"
                  placeholder="e.g. Interior Lights"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 100 }}
                />
                <TextField
                  label="Inspection Item"
                  placeholder="Describe what should be inspected…"
                  value={itemText}
                  onChange={(e) => setItemText(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  required
                  inputProps={{ maxLength: 500 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  disabled={submitting || !itemText.trim()}
                >
                  {submitting
                    ? <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={16} color="inherit" />
                        <span>Submitting…</span>
                      </Stack>
                    : 'Submit Suggestion'}
                </Button>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>
    </>
  );
}
