import { useState, useEffect, useMemo } from 'react';
import {
  Drawer, Box, Typography, TextField, Button, Stack,
  IconButton, Alert, CircularProgress, Switch, FormControlLabel,
  Checkbox, FormGroup, FormLabel, FormControl, Select, MenuItem,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ITEM_TYPES = ['Check', 'Measurement', 'Text'];

const EMPTY_FORM = {
  category:     '',
  subcategory:  '',
  itemText:     '',
  type:         'Check',
  manufacturers: ['PAUSE', 'MDC'],
  sort:         999,
  isAccessory:  false,
  defaultActive: true,
  location:     '',
  relatedLineItems: [],
  activePDIId:  '',
};

/**
 * Right-side drawer for adding or editing a template item.
 *
 * Props:
 *   open        — boolean
 *   onClose     — () => void
 *   onSave      — (formData) => Promise<void>
 *   item        — existing item to edit (null = new)
 *   allItems    — full item list (for category / subcategory Autocomplete options)
 */
export default function ItemFormDrawer({ open, onClose, onSave, item, allItems = [] }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Populate form when the drawer opens
  useEffect(() => {
    if (open) {
      setForm(item
        ? {
            category:      item.category      ?? '',
            subcategory:   item.subcategory    ?? '',
            itemText:      item.itemText       ?? '',
            type:          item.type           ?? 'Check',
            manufacturers: item.manufacturers  ?? ['PAUSE', 'MDC'],
            sort:          item.sort           ?? 999,
            isAccessory:   item.isAccessory    ?? false,
            defaultActive: item.defaultActive  ?? true,
            location:      item.location       ?? '',
            relatedLineItems: item.relatedLineItems ?? [],
            activePDIId:   item.activePDIId    ?? '',
          }
        : EMPTY_FORM,
      );
      setError('');
    }
  }, [open, item]);

  // Derive unique category / subcategory options from existing items
  const categoryOptions = useMemo(
    () => [...new Set(allItems.map((i) => i.category).filter(Boolean))].sort(),
    [allItems],
  );

  const subcategoryOptions = useMemo(() => {
    if (!form.category) return [];
    return [...new Set(
      allItems
        .filter((i) => i.category === form.category)
        .map((i) => i.subcategory)
        .filter(Boolean),
    )].sort();
  }, [allItems, form.category]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleMfr(mfr) {
    setForm((f) => {
      const next = f.manufacturers.includes(mfr)
        ? f.manufacturers.filter((m) => m !== mfr)
        : [...f.manufacturers, mfr];
      return { ...f, manufacturers: next };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.itemText.trim()) { setError('Item text is required.'); return; }
    if (!form.category.trim()) { setError('Category is required.'); return; }
    if (form.manufacturers.length === 0) { setError('At least one manufacturer is required.'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, itemText: form.itemText.trim(), category: form.category.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  const title = item ? 'Edit Template Item' : 'Add Template Item';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Stack>

      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Manufacturers */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontSize: 13, mb: 0.5 }}>Manufacturers *</FormLabel>
            <FormGroup row>
              {['PAUSE', 'MDC'].map((mfr) => (
                <FormControlLabel
                  key={mfr}
                  label={mfr}
                  control={
                    <Checkbox
                      checked={form.manufacturers.includes(mfr)}
                      onChange={() => toggleMfr(mfr)}
                      size="small"
                    />
                  }
                />
              ))}
            </FormGroup>
          </FormControl>

          {/* Category */}
          <Autocomplete
            freeSolo
            options={categoryOptions}
            value={form.category}
            onInputChange={(_, v) => set('category', v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category *"
                size="small"
                inputProps={{ ...params.inputProps, maxLength: 100 }}
              />
            )}
          />

          {/* Subcategory */}
          <Autocomplete
            freeSolo
            options={subcategoryOptions}
            value={form.subcategory}
            onInputChange={(_, v) => set('subcategory', v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Subcategory"
                size="small"
                inputProps={{ ...params.inputProps, maxLength: 100 }}
              />
            )}
          />

          {/* Item Text */}
          <TextField
            label="Inspection Item *"
            placeholder="Describe what should be inspected…"
            value={form.itemText}
            onChange={(e) => set('itemText', e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
            inputProps={{ maxLength: 500 }}
          />

          {/* Type */}
          <FormControl size="small" fullWidth>
            <FormLabel sx={{ fontSize: 13, mb: 0.5 }}>Type</FormLabel>
            <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
              {ITEM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Sort */}
          <TextField
            label="Sort Order"
            type="number"
            value={form.sort}
            onChange={(e) => set('sort', parseInt(e.target.value, 10) || 0)}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 9999 }}
          />

          {/* Location */}
          <TextField
            label="Location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            size="small"
            fullWidth
            inputProps={{ maxLength: 200 }}
          />

          {/* Toggles */}
          <Stack>
            <FormControlLabel
              label="Is Accessory"
              control={
                <Switch
                  checked={form.isAccessory}
                  onChange={(e) => set('isAccessory', e.target.checked)}
                  size="small"
                />
              }
            />
            <FormControlLabel
              label="Default Active"
              control={
                <Switch
                  checked={form.defaultActive}
                  onChange={(e) => set('defaultActive', e.target.checked)}
                  size="small"
                />
              }
            />
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} pt={1}>
            <Button variant="outlined" onClick={onClose} disabled={saving} fullWidth>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
              fullWidth
            >
              {saving ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Drawer>
  );
}
