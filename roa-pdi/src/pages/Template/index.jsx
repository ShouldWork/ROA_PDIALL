import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Badge, Button, Skeleton,
  Alert, Stack, Card, Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeAllTemplateItems, subscribeSuggestions,
  createTemplateItem, updateTemplateItem,
} from '../../services/template';
import TemplateItemList from './components/TemplateItemList';
import SuggestionQueue  from './components/SuggestionQueue';
import ItemFormDrawer   from './components/ItemFormDrawer';

const MFR_TABS = ['PAUSE', 'MDC'];

export default function TemplatePage() {
  const { user } = useAuth();

  const [items,       setItems]       = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [itemsLoading,      setItemsLoading]      = useState(true);
  const [suggestionsLoading,setSuggestionsLoading]= useState(true);
  const [itemsError,        setItemsError]        = useState('');
  const [suggestionsError,  setSuggestionsError]  = useState('');

  const [activeTab,    setActiveTab]    = useState(0); // 0=PAUSE, 1=MDC, 2=Suggestions
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editingItem,  setEditingItem]  = useState(null); // null = new

  // Live listeners
  useEffect(() => {
    const unsub = subscribeAllTemplateItems(
      (list) => { setItems(list); setItemsLoading(false); },
      (err)  => { setItemsError(err.message || 'Failed to load template items.'); setItemsLoading(false); },
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeSuggestions(
      (list) => { setSuggestions(list); setSuggestionsLoading(false); },
      (err)  => { setSuggestionsError(err.message || 'Failed to load suggestions.'); setSuggestionsLoading(false); },
    );
    return unsub;
  }, []);

  // Filter items for the active manufacturer tab
  const mfr = MFR_TABS[activeTab] ?? null; // null when Suggestions tab
  const filteredItems = useMemo(
    () => (mfr ? items.filter((i) => (i.manufacturers ?? []).includes(mfr)) : []),
    [items, mfr],
  );

  const openNew  = useCallback(() => { setEditingItem(null); setDrawerOpen(true); }, []);
  const openEdit = useCallback((item) => { setEditingItem(item); setDrawerOpen(true); }, []);

  const handleSave = useCallback(async (formData) => {
    if (editingItem) {
      await updateTemplateItem(editingItem.id, formData, user.uid);
    } else {
      await createTemplateItem(formData, user.uid);
    }
  }, [editingItem, user.uid]);

  const isSuggestionsTab = activeTab === MFR_TABS.length;

  return (
    <Box sx={{ pb: 2 }}>
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>PDI Template</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage checklist items and review suggestions.
          </Typography>
        </Box>
        {!isSuggestionsTab && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} size="large">
            Add Item
          </Button>
        )}
      </Stack>

      {itemsError && (
        <Alert severity="error" sx={{ mb: 2 }}>{itemsError}</Alert>
      )}

      {/* Tabs: PAUSE | MDC | Suggestions (with badge) */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 1,
            '& .MuiTab-root': { minWidth: 'unset', fontSize: 13, px: 2 },
          }}
        >
          {MFR_TABS.map((label) => {
            const count = items.filter((i) => (i.manufacturers ?? []).includes(label)).length;
            return (
              <Tab
                key={label}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>{label}</span>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: 'action.selected',
                        borderRadius: 10,
                        px: 0.75,
                        lineHeight: '18px',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {count}
                    </Typography>
                  </Stack>
                }
              />
            );
          })}
          <Tab
            label={
              <Badge badgeContent={suggestions.length} color="error" max={99}>
                <Typography variant="body2" sx={{ fontSize: 13 }}>Suggestions</Typography>
              </Badge>
            }
          />
        </Tabs>
      </Card>

      {/* Loading skeletons — each tab tracks its own data source */}
      {!isSuggestionsTab && itemsLoading && (
        <Box>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 0.5 }} />
          ))}
        </Box>
      )}
      {isSuggestionsTab && suggestionsLoading && (
        <Box>
          {[1, 2].map((n) => (
            <Skeleton key={n} variant="rectangular" height={80} sx={{ borderRadius: 1, mb: 1 }} />
          ))}
        </Box>
      )}

      {/* Manufacturer item lists */}
      {!isSuggestionsTab && !itemsLoading && (
        <TemplateItemList
          items={filteredItems}
          onEdit={openEdit}
          loading={false}
        />
      )}

      {/* Suggestions queue */}
      {isSuggestionsTab && !suggestionsLoading && (
        <SuggestionQueue
          suggestions={suggestions}
          loading={false}
          error={suggestionsError}
        />
      )}

      {/* Add item FAB (mobile convenience, only on PAUSE / MDC tabs) */}
      {!isSuggestionsTab && (
        <Fab
          color="primary"
          onClick={openNew}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 24 },
            right: 16,
            zIndex: 1200,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Add / edit drawer */}
      <ItemFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        item={editingItem}
        allItems={items}
      />
    </Box>
  );
}
