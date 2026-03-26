import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Menu, MenuItem, Chip, Typography, Avatar, BottomNavigation,
  BottomNavigationAction, Paper, AppBar, Toolbar, useMediaQuery, useTheme,
} from '@mui/material';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import ListAltIcon       from '@mui/icons-material/ListAlt';
import PeopleIcon        from '@mui/icons-material/People';
import BarChartIcon      from '@mui/icons-material/BarChart';
import WifiOffIcon       from '@mui/icons-material/WifiOff';
import { useAuth }       from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';

const DRAWER_WIDTH = 220;

// Icons stored as component references, not instantiated JSX (fix: issue #6)
const ALL_NAV_ITEMS = [
  { label: 'Dashboard', Icon: DashboardIcon,     path: '/',                roles: ['admin', 'service_writer', 'technician'] },
  { label: 'New PDI',   Icon: AssignmentAddIcon,  path: '/pdi/new',         roles: ['admin', 'service_writer'] },
  { label: 'Template',  Icon: ListAltIcon,        path: '/template',        roles: ['admin', 'service_writer'] },
  { label: 'Users',     Icon: PeopleIcon,         path: '/admin/users',     roles: ['admin'] },
  { label: 'Analytics', Icon: BarChartIcon,       path: '/admin/analytics', roles: ['admin'] },
];

function isActive(itemPath, currentPath) {
  return itemPath === '/' ? currentPath === '/' : currentPath.startsWith(itemPath);
}

// ── Desktop side nav ──────────────────────────────────────────────────────────
function SideNav({ items, currentPath, navigate, userProfile, logout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { online } = useConnection();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'primary.dark',
          color: '#fff',
          border: 'none',
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/icons/i-ROA_icon_192x192.png"
          alt="ROA"
          sx={{ width: 40, height: 40, borderRadius: 1.5, flexShrink: 0 }}
        />
        <Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
            ROA
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Shop Manager
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <List sx={{ pt: 1, flex: 1 }}>
        {items.map(({ label, Icon, path }) => {
          const active = isActive(path, currentPath);
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(path)}
                sx={{
                  mx: 1, borderRadius: 2,
                  bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {!online && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Chip
            icon={<WifiOffIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
            label="Offline — changes will sync"
            size="small"
            sx={{ bgcolor: 'warning.dark', color: '#fff', fontWeight: 500, fontSize: 11, height: 24 }}
          />
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        }}
      >
        <Avatar src={userProfile?.photoURL} sx={{ width: 32, height: 32, fontSize: 13 }}>
          {userProfile?.displayName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userProfile?.displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
            {userProfile?.role?.replace('_', ' ')}
          </Typography>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>Sign out</MenuItem>
      </Menu>
    </Drawer>
  );
}

// ── Mobile top bar + bottom nav ───────────────────────────────────────────────
function MobileShell({ items, currentPath, navigate, userProfile, logout, children }) {
  const { online } = useConnection();
  const [anchorEl, setAnchorEl] = useState(null);

  // Use path as value — safe with role-filtered arrays of varying length (fix: issue #13)
  const activePath = items.find((i) => isActive(i.path, currentPath))?.path ?? false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'primary.dark', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/icons/i-ROA_icon_192x192.png"
              alt="ROA"
              sx={{ width: 32, height: 32, borderRadius: 1, flexShrink: 0 }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                ROA PDI
              </Typography>
              {!online && (
                <Typography variant="caption" sx={{ color: 'warning.light', fontSize: 10 }}>
                  Offline — syncing when connected
                </Typography>
              )}
            </Box>
          </Box>

          <Avatar
            src={userProfile?.photoURL}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ width: 32, height: 32, fontSize: 13, cursor: 'pointer' }}
          >
            {userProfile?.displayName?.[0]}
          </Avatar>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem dense disabled>
              <Typography variant="caption" color="text.secondary">{userProfile?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Page content — bottom padding accounts for nav bar + iOS safe area (fix: issue #11) */}
      <Box sx={{ flex: 1, p: 2, pb: 'calc(72px + env(safe-area-inset-bottom))', overflowY: 'auto' }}>
        {children}
      </Box>

      {/* Bottom nav — height + safe area inset (fix: issue #11) */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid', borderColor: 'divider',
          zIndex: (t) => t.zIndex.appBar,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          value={activePath}
          onChange={(_, path) => navigate(path)}
          showLabels
          sx={{ height: 64 }}
        >
          {items.map(({ label, Icon, path }) => (
            <BottomNavigationAction
              key={path}
              label={label}
              value={path}
              icon={<Icon />}
              sx={{ '&.Mui-selected': { color: 'primary.main' }, minWidth: 0, fontSize: 11 }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

// ── Root shell ────────────────────────────────────────────────────────────────
export default function AppShell() {
  const { userProfile, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();

  // defaultMatches: true prevents the desktop-layout flash on first mobile render (fix: issue #12)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { defaultMatches: true });

  // Memoize so icon JSX is not recreated on every render (fix: issue #6)
  const items = useMemo(
    () => ALL_NAV_ITEMS.filter((i) => i.roles.includes(userProfile?.role)),
    [userProfile?.role],
  );

  if (isMobile) {
    return (
      <MobileShell
        items={items}
        currentPath={location.pathname}
        navigate={navigate}
        userProfile={userProfile}
        logout={logout}
      >
        <Outlet />
      </MobileShell>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <SideNav
        items={items}
        currentPath={location.pathname}
        navigate={navigate}
        userProfile={userProfile}
        logout={logout}
      />
      <Box component="main" sx={{ flex: 1, p: 3, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
