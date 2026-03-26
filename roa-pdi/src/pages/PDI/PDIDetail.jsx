import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, Button, Alert,
  CircularProgress, Stack, Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usePDI }    from '../../hooks/usePDI';
import { useAuth }   from '../../contexts/AuthContext';
import {
  startPDI, pausePDI, resumePDI, completePDI,
  markUnableToComplete, updateItemStats,
} from '../../services/pdi';
import PDIHeader           from './components/PDIHeader';
import ItemCard            from './components/ItemCard';
import AccessoryChecklist  from './components/AccessoryChecklist';
import SuggestItemDrawer   from './components/SuggestItemDrawer';

// Determines if the current user can edit this PDI
function canEdit(pdi, userProfile) {
  if (!pdi || !userProfile) return false;
  if (['completed', 'unable_to_complete'].includes(pdi.status)) return false;
  if (userProfile.role === 'admin' || userProfile.role === 'service_writer') return true;
  return pdi.assignedTo === userProfile.uid;
}

export default function PDIDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const { pdi, items, categories, accessories, loading, error } = usePDI(id);

  const [activeTab,    setActiveTab]    = useState(0);
  const [transitioning,setTransitioning]= useState(false);
  const [transError,   setTransError]   = useState('');

  const editable = canEdit(pdi, userProfile);

  async function handleTransition(newStatus, currentElapsed) {
    setTransitioning(true);
    setTransError('');
    try {
      switch (newStatus) {
        case 'in_progress':
          if (pdi.status === 'not_started') await startPDI(id, user.uid);
          else                              await resumePDI(id, user.uid);
          break;
        case 'paused':
          await pausePDI(id, user.uid, currentElapsed);
          break;
        case 'completed':
          await completePDI(id, user.uid, currentElapsed);
          await updateItemStats(items, pdi.manufacturer).catch(() => {}); // non-blocking
          break;
        case 'unable_to_complete':
          await markUnableToComplete(id, user.uid, currentElapsed);
          break;
      }
    } catch (err) {
      setTransError(err.message || 'Status update failed. Please try again.');
    } finally {
      setTransitioning(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} variant="rectangular" height={110} sx={{ borderRadius: 2, mb: 1.5 }} />
        ))}
      </Box>
    );
  }

  if (error || !pdi) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message ?? 'PDI not found.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Build tab list: one per category + Accessories tab at the end
  const tabs = [
    ...categories.map((c) => c.name),
    ...(accessories.length ? ['Accessories'] : []),
  ];

  const isAccessoryTab = activeTab === categories.length && accessories.length > 0;
  const activeCategory = !isAccessoryTab ? categories[activeTab] : null;

  return (
    <Box sx={{ pb: 2 }}>
      {/* Back nav */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ color: 'text.secondary', mb: 1.5, pl: 0 }}
      >
        Dashboard
      </Button>

      {/* PDI header — status, timer, progress */}
      <PDIHeader
        pdi={pdi}
        items={items}
        onTransition={handleTransition}
        transitioning={transitioning}
      />

      {transError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTransError('')}>
          {transError}
        </Alert>
      )}

      {/* Paused / not started notice */}
      {pdi.status === 'not_started' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This PDI hasn't been started yet. Press <strong>Change Status → Start PDI</strong> to begin.
        </Alert>
      )}
      {pdi.status === 'paused' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          PDI is paused. Resume to continue recording time and making changes.
        </Alert>
      )}
      {['completed', 'unable_to_complete'].includes(pdi.status) && (
        <Alert severity="success" sx={{ mb: 2 }}>
          This PDI is {pdi.status === 'completed' ? 'complete' : 'marked unable to complete'}.
          Items are read-only.
        </Alert>
      )}

      {/* Category tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1,
          '& .MuiTab-root': { minWidth: 'unset', fontSize: 13, px: 1.5 },
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab} label={tab} />
        ))}
      </Tabs>

      {/* Checklist items */}
      {!isAccessoryTab && activeCategory && (
        <Box>
          {activeCategory.items.map((item) => (
            <ItemCard
              key={item.id}
              pdiId={id}
              item={item}
              uid={user.uid}
              disabled={!editable}
            />
          ))}
        </Box>
      )}

      {/* Accessories tab */}
      {isAccessoryTab && (
        <AccessoryChecklist
          pdiId={id}
          accessories={accessories}
          uid={user.uid}
          disabled={!editable}
        />
      )}

      {/* Suggest new item FAB — visible when PDI is active */}
      {editable && pdi.status === 'in_progress' && (
        <SuggestItemDrawer manufacturer={pdi.manufacturer} />
      )}
    </Box>
  );
}
