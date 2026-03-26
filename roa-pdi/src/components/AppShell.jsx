import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Menu, MenuItem, Chip, Typography, Avatar, BottomNavigation,
  BottomNavigationAction, Paper, AppBar, Toolbar, IconButton, useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';

const DRAWER_WIDTH = 220;

function getNavItems(role) {
  const all = [
    { label: 'Dashboard',  icon: <DashboardIcon />,    path: '/',               roles: ['admin', 'service_writer', 'technician'] },
    { label: 'New PDI',    icon: <AssignmentAddIcon />, path: '/pdi/new',        roles: ['admin', 'service_writer'] },
    { label: 'Template',   icon: <ListAltIcon />,       path: '/template',       roles: ['admin', 'service_writer'] },
    { label: 'Users',      icon: <PeopleIcon />,        path: '/admin/users',    roles: ['admin'] },
    { label: 'Analytics',  icon: <BarChartIcon />,      path: '/admin/analytics',roles: ['admin'] },
  ];
  return all.filter((i) => i.roles.includes(role));
}

function isActive(itemPath, currentPath) {
  return itemPath === '/'
    ? currentPath === '/'
    : currentPath.startsWith(itemPath);
}

// ── Desktop side nav ──────────────────────────────────────────────────────────
function SideNav({ items, location, navigate, userProfile, logout }) {
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
      {/* Logo */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
          ROA
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Shop Manager
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <List sx={{ pt: 1, flex: 1 }}>
        {items.map((item) => {
          const active = isActive(item.path, location.pathname);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1, borderRadius: 2,
                  bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
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

      {/* User footer */}
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
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
function MobileShell({ items, location, navigate, userProfile, logout, children }) {
  const { online } = useConnection();
  const [anchorEl, setAnchorEl] = useState(null);

  const currentIndex = items.findIndex((i) => isActive(i.path, location.pathname));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.dark', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
              ROA PDI
            </Typography>
            {!online && (
              <Typography variant="caption" sx={{ color: 'warning.light', fontSize: 10 }}>
                Offline — syncing when connected
              </Typography>
            )}
          </Box>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar src={userProfile?.photoURL} sx={{ width: 32, height: 32, fontSize: 13 }}>
              {userProfile?.displayName?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem dense disabled>
              <Typography variant="caption" color="text.secondary">
                {userProfile?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Page content — extra bottom padding for nav bar */}
      <Box sx={{ flex: 1, p: 2, pb: 9, overflowY: 'auto' }}>
        {children}
      </Box>

      {/* Bottom nav */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid', borderColor: 'divider',
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <BottomNavigation
          value={currentIndex === -1 ? false : currentIndex}
          onChange={(_, idx) => navigate(items[idx].path)}
          showLabels
          sx={{ height: 64 }}
        >
          {items.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              sx={{
                '&.Mui-selected': { color: 'primary.main' },
                minWidth: 0,
                fontSize: 11,
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

// ── Root shell — picks layout based on screen size ────────────────────────────
export default function AppShell() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const items = getNavItems(userProfile?.role);

  if (isMobile) {
    return (
      <MobileShell
        items={items}
        location={location}
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
        location={location}
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
