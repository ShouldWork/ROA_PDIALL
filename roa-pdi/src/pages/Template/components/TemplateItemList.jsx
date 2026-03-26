import { useState } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Stack, Switch, IconButton, Tooltip, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon       from '@mui/icons-material/Edit';
import DeleteIcon     from '@mui/icons-material/Delete';
import { toggleTemplateItemActive, deleteTemplateItem } from '../../../services/template';
import { useAuth } from '../../../contexts/AuthContext';

function DeleteDialog({ item, open, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteTemplateItem(item.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Template Item?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>{item?.itemText}</strong>
          <br />
          This will remove the item from the template. Existing PDI records are unaffected.
        </DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemRow({ item, onEdit }) {
  const { user } = useAuth();
  const [toggling,    setToggling]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleTemplateItemActive(item.id, !item.active, user.uid);
    } catch {
      // silently ignore — the listener will revert the optimistic UI
    } finally {
      setToggling(false);
    }
  }

  return (
    <>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{
          py: 1,
          px: 1.5,
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
          opacity: item.active ? 1 : 0.45,
        }}
      >
        {/* Left: text + chips */}
        <Box sx={{ flex: 1, mr: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {item.itemText}
          </Typography>
          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
            {item.subcategory && (
              <Chip label={item.subcategory} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
            )}
            {item.type && item.type !== 'Check' && (
              <Chip label={item.type} size="small" sx={{ fontSize: 10, height: 18 }} />
            )}
            {item.isAccessory && (
              <Chip label="Accessory" size="small" color="secondary" sx={{ fontSize: 10, height: 18 }} />
            )}
            {(item.manufacturers ?? []).map((m) => (
              <Chip
                key={m}
                label={m}
                size="small"
                sx={{
                  fontSize: 10, height: 18,
                  bgcolor: m === 'PAUSE' ? '#E3F2FD' : '#E8F5E9',
                  color:   m === 'PAUSE' ? '#1565C0' : '#2E7D32',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Right: toggle + actions */}
        <Stack direction="row" alignItems="center" spacing={0} flexShrink={0}>
          {toggling ? (
            <CircularProgress size={16} sx={{ mx: 1 }} />
          ) : (
            <Tooltip title={item.active ? 'Deactivate' : 'Activate'}>
              <Switch
                checked={item.active}
                onChange={handleToggle}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(item)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {deleteTarget && (
        <DeleteDialog
          item={deleteTarget}
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

/**
 * Accordion list of template items grouped by category.
 *
 * Props:
 *   items    — array of template item objects (already filtered for a manufacturer)
 *   onEdit   — (item) => void — opens the ItemFormDrawer for editing
 *   loading  — boolean
 */
export default function TemplateItemList({ items, onEdit, loading }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) return null; // parent shows skeleton

  // Group by category
  const categoryMap = new Map();
  for (const item of items) {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category).push(item);
  }

  if (categoryMap.size === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No items found.
      </Typography>
    );
  }

  return (
    <Box>
      {Array.from(categoryMap.entries()).map(([category, catItems]) => {
        const activeCount   = catItems.filter((i) => i.active).length;
        const inactiveCount = catItems.length - activeCount;

        return (
          <Accordion
            key={category}
            expanded={expanded === category}
            onChange={(_, isOpen) => setExpanded(isOpen ? category : false)}
            disableGutters
            sx={{ mb: 0.5, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', mr: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                  {category}
                </Typography>
                <Chip label={`${activeCount} active`} size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
                {inactiveCount > 0 && (
                  <Chip label={`${inactiveCount} inactive`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pb: 0.5 }}>
              {catItems.map((item) => (
                <ItemRow key={item.id} item={item} onEdit={onEdit} />
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
