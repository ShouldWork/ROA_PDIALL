import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Toolbar, Typography, IconButton, Avatar,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Menu, MenuItem, Chip, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';

const DRAWER_WIDTH = 220;

function navItems(role) {
  const items = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['admin', 'service_writer', 'technician'] },
    { label: 'New PDI', icon: <AssignmentIcon />, path: '/pdi/new', roles: ['admin', 'service_writer'] },
    { label: 'Template', icon: <ListAltIcon />, path: '/template', roles: ['admin', 'service_writer'] },
    { label: 'Users', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
    { label: 'Analytics', icon: <BarChartIcon />, path: '/admin/analytics', roles: ['admin'] },
  ];
  return items.filter((i) => i.roles.includes(role));
}

export default function AppShell() {
  const { userProfile, logout } = useAuth();
  const { online } = useConnection();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const items = navItems(userProfile?.role);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Side Nav ──────────────────────────────────────────────── */}
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
        {/* Logo area */}
        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
            ROA
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Delivery PDI
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        <List sx={{ pt: 1, flex: 1 }}>
          {items.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: active ? '#fff' : 'rgba(255,255,255,0.65)' }}>
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

        {/* Offline indicator */}
        {!online && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Chip
              icon={<WifiOffIcon sx={{ fontSize: 14 }} />}
              label="Offline"
              size="small"
              sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 600, fontSize: 11 }}
            />
          </Box>
        )}

        {/* User footer */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
        <Box
          sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Avatar
            src={userProfile?.photoURL}
            sx={{ width: 32, height: 32, fontSize: 13 }}
          >
            {userProfile?.displayName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userProfile?.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>
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
          <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
            Sign out
          </MenuItem>
        </Menu>
      </Drawer>

      {/* ── Main content ──────────────────────────────────────────── */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
