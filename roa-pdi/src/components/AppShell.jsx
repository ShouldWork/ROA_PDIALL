import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Menu, MenuItem, Typography, Avatar, BottomNavigation,
  BottomNavigationAction, Paper, AppBar, Toolbar, useMediaQuery, useTheme,
} from '@mui/material';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import ListAltIcon       from '@mui/icons-material/ListAlt';
import PeopleIcon        from '@mui/icons-material/People';
import BarChartIcon      from '@mui/icons-material/BarChart';
import WifiOffIcon       from '@mui/icons-material/WifiOff';
import LightModeIcon     from '@mui/icons-material/LightMode';
import DarkModeIcon      from '@mui/icons-material/DarkMode';
import LogoutIcon        from '@mui/icons-material/Logout';
import { useAuth }       from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { useThemeMode }  from '../contexts/ThemeContext';
import {
  NAV_BG, NAV_BORDER, NAV_TEXT, NAV_TEXT_ACTIVE,
  NAV_ACTIVE_BG, NAV_ACCENT,
} from '../theme';

const DRAWER_WIDTH = 220;

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', Icon: DashboardIcon,    path: '/',                roles: ['admin', 'service_writer', 'technician'] },
  { label: 'New PDI',   Icon: AssignmentAddIcon, path: '/pdi/new',         roles: ['admin', 'service_writer'] },
  { label: 'Template',  Icon: ListAltIcon,       path: '/template',        roles: ['admin', 'service_writer'] },
  { label: 'Users',     Icon: PeopleIcon,        path: '/admin/users',     roles: ['admin'] },
  { label: 'Analytics', Icon: BarChartIcon,      path: '/admin/analytics', roles: ['admin'] },
];

function isActive(itemPath, currentPath) {
  return itemPath === '/' ? currentPath === '/' : currentPath.startsWith(itemPath);
}

// ── Desktop side nav ──────────────────────────────────────────────────────────
function SideNav({ items, currentPath, navigate, userProfile, logout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { online }              = useConnection();
  const { mode, toggleMode }    = useThemeMode();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: NAV_BG,
          borderRight: `1px solid ${NAV_BORDER}`,
        },
      }}
    >
      {/* Logo + wordmark */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/icons/i-ROA_icon_192x192.png"
          alt="ROA"
          sx={{ width: 36, height: 36, borderRadius: 0, flexShrink: 0 }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
            ROA PDI
          </Typography>
          <Typography variant="caption" sx={{ color: NAV_TEXT, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 10 }}>
            Shop Manager
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: NAV_BORDER }} />

      {/* Offline banner */}
      {!online && (
        <Box sx={{ px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(245,158,11,0.08)', borderBottom: `1px solid ${NAV_BORDER}` }}>
          <WifiOffIcon sx={{ fontSize: 13, color: NAV_ACCENT }} />
          <Typography variant="caption" sx={{ color: NAV_ACCENT, fontWeight: 500, fontSize: 11 }}>
            Offline — changes will sync
          </Typography>
        </Box>
      )}

      {/* Nav items */}
      <List sx={{ pt: 1.5, flex: 1, px: 0 }}>
        {items.map(({ label, Icon, path }) => {
          const active = isActive(path, currentPath);
          return (
            <ListItem key={path} disablePadding>
              <ListItemButton
                onClick={() => navigate(path)}
                sx={{
                  pl: 2.5, pr: 2, py: 0.875,
                  borderLeft: `3px solid ${active ? NAV_ACCENT : 'transparent'}`,
                  bgcolor: active ? NAV_ACTIVE_BG : 'transparent',
                  borderRadius: 0,
                  '&:hover': {
                    bgcolor: active
                      ? 'rgba(245,158,11,0.14)'
                      : 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? NAV_ACCENT : NAV_TEXT }}>
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? NAV_TEXT_ACTIVE : NAV_TEXT,
                    letterSpacing: 0.1,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: NAV_BORDER }} />

      {/* User row */}
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        <Avatar src={userProfile?.photoURL} sx={{ width: 30, height: 30, fontSize: 12, borderRadius: 1 }}>
          {userProfile?.displayName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{
            color: '#fff', fontWeight: 500, fontSize: 13, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {userProfile?.displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: NAV_TEXT, textTransform: 'capitalize', fontSize: 11 }}>
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
        <MenuItem onClick={() => { setAnchorEl(null); toggleMode(); }} dense>
          {mode === 'dark'
            ? <><LightModeIcon fontSize="small" sx={{ mr: 1.5 }} />Light mode</>
            : <><DarkModeIcon  fontSize="small" sx={{ mr: 1.5 }} />Dark mode</>}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }} dense>
          <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />Sign out
        </MenuItem>
      </Menu>
    </Drawer>
  );
}

// ── Mobile top bar + bottom nav ───────────────────────────────────────────────
function MobileShell({ items, currentPath, navigate, userProfile, logout, children }) {
  const { online }           = useConnection();
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const activePath = items.find((i) => isActive(i.path, currentPath))?.path ?? false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}` }}
      >
        <Toolbar sx={{ minHeight: 52 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/icons/i-ROA_icon_192x192.png"
              alt="ROA"
              sx={{ width: 28, height: 28, borderRadius: 0, flexShrink: 0 }}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                ROA PDI
              </Typography>
              {!online && (
                <Typography variant="caption" sx={{ color: NAV_ACCENT, fontSize: 10 }}>
                  Offline — syncing when connected
                </Typography>
              )}
            </Box>
          </Box>

          <Avatar
            src={userProfile?.photoURL}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ width: 30, height: 30, fontSize: 12, cursor: 'pointer', borderRadius: 1 }}
          >
            {userProfile?.displayName?.[0]}
          </Avatar>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top',    horizontal: 'right' }}
          >
            <MenuItem dense disabled>
              <Typography variant="caption" color="text.secondary">{userProfile?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); toggleMode(); }} dense>
              {mode === 'dark'
                ? <><LightModeIcon fontSize="small" sx={{ mr: 1.5 }} />Light mode</>
                : <><DarkModeIcon  fontSize="small" sx={{ mr: 1.5 }} />Dark mode</>}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }} dense>
              <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, p: 2, pb: 'calc(72px + env(safe-area-inset-bottom))', overflowY: 'auto' }}>
        {children}
      </Box>

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

  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { defaultMatches: true });

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
