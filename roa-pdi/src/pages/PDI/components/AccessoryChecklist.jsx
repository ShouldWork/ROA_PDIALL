import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, Divider,
} from '@mui/material';
import { ACCESSORY_RESULT_CONFIG } from '../../../utils/pdiStatus';
import { updateItemResult } from '../../../services/pdi';

const ACCESSORY_RESULTS = ['present', 'not_present', 'not_applicable'];

function AccessoryItem({ pdiId, item, uid, disabled }) {
  const [saving, setSaving] = useState(false);

  async function handleResult(result) {
    if (disabled || saving || item.result === result) return;
    setSaving(true);
    try {
      await updateItemResult(pdiId, item.id, result, uid);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ py: 1.5 }}>
      {item.subcategory && (
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          {item.subcategory}
        </Typography>
      )}
      <Typography variant="body2" sx={{ mt: 0.25, mb: 1.5, fontSize: { xs: 14, sm: 15 } }}>
        {item.itemText}
      </Typography>
      <Stack direction="row" spacing={1}>
        {ACCESSORY_RESULTS.map((result) => {
          const cfg    = ACCESSORY_RESULT_CONFIG[result];
          const active = item.result === result;
          return (
            <Button
              key={result}
              size="small"
              variant={active ? 'contained' : 'outlined'}
              disabled={disabled || saving}
              onClick={() => handleResult(result)}
              sx={{
                flex: 1, minHeight: 40, fontWeight: 600, fontSize: { xs: 11, sm: 12 },
                ...(active && {
                  bgcolor: cfg.bg,
                  borderColor: cfg.bg,
                  color: cfg.text,
                  '&:hover': { bgcolor: cfg.bg, opacity: 0.9 },
                  '&.Mui-disabled': { bgcolor: cfg.bg, color: cfg.text, opacity: 0.7 },
                }),
                ...(!active && { borderColor: 'divider', color: 'text.secondary' }),
              }}
            >
              {cfg.label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function AccessoryChecklist({ pdiId, accessories, uid, disabled }) {
  if (!accessories?.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No accessories defined for this manufacturer.
        </Typography>
      </Box>
    );
  }

  // Group by subcategory
  const groups = accessories.reduce((acc, item) => {
    const key = item.subcategory || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Box>
      {Object.entries(groups).map(([group, items], gi) => (
        <Card key={group} sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={0.5}>
              {group}
            </Typography>
            {items.map((item, idx) => (
              <Box key={item.id}>
                <AccessoryItem
                  pdiId={pdiId}
                  item={item}
                  uid={uid}
                  disabled={disabled}
                />
                {idx < items.length - 1 && <Divider />}
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
