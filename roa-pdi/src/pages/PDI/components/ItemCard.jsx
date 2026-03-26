import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Divider, Alert } from '@mui/material';
import { RESULT_CONFIG } from '../../../utils/pdiStatus';
import { updateItemResult } from '../../../services/pdi';
import ImageUploadStrip from './ImageUploadStrip';

const RESULTS = ['pass', 'fail', 'not_applicable', 'untested'];

export default function ItemCard({ pdiId, item, uid, disabled }) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleResult(result) {
    if (disabled || saving || item.result === result) return;
    setSaving(true);
    setError('');
    try {
      await updateItemResult(pdiId, item.id, result, uid);
    } catch {
      // H5: surface write failures so the technician knows to retry
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      sx={{
        mb: 1.5,
        borderLeft: '4px solid',
        borderLeftColor:
          item.result === 'pass'             ? 'success.main'
          : item.result === 'fail'           ? 'error.main'
          : item.result === 'not_applicable' ? 'grey.400'
          : 'transparent',
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Subcategory label */}
        {item.subcategory && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
          >
            {item.subcategory}
          </Typography>
        )}

        {/* Item text */}
        <Typography variant="body1" sx={{ mt: 0.25, mb: 2, lineHeight: 1.5, fontSize: { xs: 15, sm: 16 } }}>
          {item.itemText}
        </Typography>

        {/* Result buttons */}
        <Stack direction="row" spacing={1}>
          {RESULTS.map((result) => {
            const cfg    = RESULT_CONFIG[result];
            const active = item.result === result;
            return (
              <Button
                key={result}
                variant={active ? 'contained' : 'outlined'}
                size="small"
                disabled={disabled || saving}
                onClick={() => handleResult(result)}
                sx={{
                  flex: 1,
                  minHeight: 44,
                  fontSize: { xs: 12, sm: 13 },
                  fontWeight: 600,
                  ...(active && {
                    bgcolor: cfg.bg,
                    borderColor: cfg.bg,
                    color: cfg.text,
                    '&:hover': { bgcolor: cfg.bg, opacity: 0.9 },
                    '&.Mui-disabled': { bgcolor: cfg.bg, color: cfg.text, opacity: 0.7 },
                  }),
                  ...(!active && {
                    borderColor: 'divider',
                    color: 'text.secondary',
                  }),
                }}
              >
                {cfg.label}
              </Button>
            );
          })}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: 12 }}>{error}</Alert>
        )}

        {/* Image upload — shown when in progress (not disabled) or images exist */}
        {(!disabled || item.images?.length > 0) && (
          <>
            <Divider sx={{ mt: 1.5, mb: 0 }} />
            <ImageUploadStrip
              pdiId={pdiId}
              itemId={item.id}
              images={item.images ?? []}
              uid={uid}
              disabled={disabled}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
