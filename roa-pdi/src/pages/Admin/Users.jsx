import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  FormControl, IconButton, Tooltip, TextField, InputAdornment,
  Stack, Alert, Avatar, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Button,
} from '@mui/material';
import SearchIcon    from '@mui/icons-material/Search';
import CheckIcon     from '@mui/icons-material/Check';
import BlockIcon     from '@mui/icons-material/Block';
import EditIcon      from '@mui/icons-material/Edit';
import { subscribeAllUsers, updateUserRole, updateUserActive, activateUser } from '../../services/users';
import { formatDate } from '../../utils/time';

const ROLES = [
  { value: 'admin',          label: 'Admin' },
  { value: 'service_writer', label: 'Service Writer' },
  { value: 'technician',     label: 'Technician' },
];

const ROLE_COLORS = {
  admin:          { bg: '#EDE7F6', color: '#4527A0' },
  service_writer: { bg: '#E3F2FD', color: '#1565C0' },
  technician:     { bg: '#E8F5E9', color: '#2E7D32' },
};

function RoleChip({ role }) {
  if (!role) return <Chip label="Pending" size="small" variant="outlined" sx={{ fontSize: 11 }} />;
  const c = ROLE_COLORS[role] ?? {};
  return (
    <Chip
      label={ROLES.find((r) => r.value === role)?.label ?? role}
      size="small"
      sx={{ fontWeight: 600, fontSize: 11, bgcolor: c.bg, color: c.color }}
    />
  );
}

function StatusChip({ active }) {
  return active
    ? <Chip label="Active"   size="small" color="success" sx={{ fontWeight: 500, fontSize: 11 }} />
    : <Chip label="Inactive" size="small" color="default" variant="outlined" sx={{ fontSize: 11 }} />;
}

// Dialog for activating a pending user (set role + activate in one action)
function ActivateDialog({ user, open, onClose, onSaved }) {
  const [role, setRole]       = useState('technician');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (open) { setRole('technician'); setError(''); }
  }, [open]);

  async function handleActivate() {
    setSaving(true);
    setError('');
    try {
      await activateUser(user.id, role);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to activate user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Activate User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar src={user?.photoURL} sx={{ width: 40, height: 40 }}>
              {user?.displayName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{user?.displayName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Stack>

          <FormControl fullWidth size="small">
            <Typography variant="body2" mb={0.5}>Assign Role</Typography>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleActivate}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
        >
          Activate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all'); // all | pending | active | inactive
  const [saving,  setSaving]  = useState({}); // uid → true while update in-flight
  const [activateTarget, setActivateTarget] = useState(null);

  useEffect(() => {
    const unsub = subscribeAllUsers(
      (list) => { setUsers(list); setLoading(false); },
      (err)  => { setError(err.message || 'Failed to load users.'); setLoading(false); },
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search && !u.displayName?.toLowerCase().includes(search.toLowerCase()) &&
                   !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'pending')  return !u.active && !u.role;
      if (filter === 'active')   return u.active === true;
      if (filter === 'inactive') return u.active !== true;
      return true;
    });
  }, [users, search, filter]);

  const counts = useMemo(() => ({
    total:    users.length,
    pending:  users.filter((u) => !u.active && !u.role).length,
    active:   users.filter((u) => u.active).length,
  }), [users]);

  async function handleRoleChange(uid, newRole) {
    setSaving((s) => ({ ...s, [uid]: true }));
    try {
      await updateUserRole(uid, newRole);
    } catch {
      setError('Failed to update role.');
    } finally {
      setSaving((s) => ({ ...s, [uid]: false }));
    }
  }

  async function handleToggleActive(uid, currentActive) {
    setSaving((s) => ({ ...s, [uid]: true }));
    try {
      await updateUserActive(uid, !currentActive);
    } catch {
      setError('Failed to update user status.');
    } finally {
      setSaving((s) => ({ ...s, [uid]: false }));
    }
  }

  const FILTER_CHIPS = [
    { value: 'all',      label: `All (${counts.total})` },
    { value: 'pending',  label: `Pending (${counts.pending})` },
    { value: 'active',   label: `Active (${counts.active})` },
    { value: 'inactive', label: `Inactive` },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>User Management</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Activate new users and manage roles.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {FILTER_CHIPS.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                size="small"
                clickable
                variant={filter === c.value ? 'filled' : 'outlined'}
                color={filter === c.value ? 'primary' : 'default'}
                onClick={() => setFilter(c.value)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No users found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((u) => {
                  const isPending = !u.active && !u.role;
                  const isBusy    = !!saving[u.id];
                  // H6: prevent admin from deactivating or demoting their own account
                  const isSelf    = u.id === currentUser?.uid;

                  return (
                    <TableRow
                      key={u.id}
                      sx={{
                        '&:last-child td': { border: 0 },
                        bgcolor: isPending ? '#FFFDE7' : undefined, // H7: warning.50 is not a valid MUI token
                      }}
                    >
                      {/* User */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={u.photoURL} sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {u.displayName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                              {u.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {isPending ? (
                          <RoleChip role={null} />
                        ) : (
                          <FormControl size="small" variant="standard" disabled={isBusy || isSelf}>
                            <Select
                              value={u.role ?? ''}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disableUnderline
                              sx={{ fontSize: 13 }}
                            >
                              {ROLES.map((r) => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell><StatusChip active={u.active} /></TableCell>

                      {/* Joined */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(u.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          {isBusy ? (
                            <CircularProgress size={18} sx={{ mx: 1 }} />
                          ) : isSelf ? (
                            // H6: admins cannot deactivate their own account
                            <Typography variant="caption" color="text.disabled">You</Typography>
                          ) : isPending ? (
                            <Tooltip title="Activate user">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setActivateTarget(u)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={u.active ? 'Deactivate user' : 'Reactivate user'}>
                              <IconButton
                                size="small"
                                color={u.active ? 'error' : 'success'}
                                onClick={() => handleToggleActive(u.id, u.active)}
                              >
                                {u.active ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activateTarget && (
        <ActivateDialog
          user={activateTarget}
          open={!!activateTarget}
          onClose={() => setActivateTarget(null)}
          onSaved={() => {}} // real-time listener auto-updates
        />
      )}
    </Box>
  );
}
