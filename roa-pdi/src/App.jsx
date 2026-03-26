import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import AuthGuard from './components/AuthGuard';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Pending from './pages/Pending';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import NewPDI from './pages/PDI/NewPDI';
import TemplatePage from './pages/Template';
import UsersPage from './pages/Admin/Users';
import AnalyticsPage from './pages/Admin/Analytics';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/pending" element={<Pending />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected — all active roles */}
              <Route
                element={
                  <AuthGuard>
                    <AppShell />
                  </AuthGuard>
                }
              >
                <Route index element={<Dashboard />} />

                {/* Service Writer + Admin only */}
                <Route
                  path="pdi/new"
                  element={
                    <AuthGuard allowedRoles={['admin', 'service_writer']}>
                      <NewPDI />
                    </AuthGuard>
                  }
                />
                <Route
                  path="template"
                  element={
                    <AuthGuard allowedRoles={['admin', 'service_writer']}>
                      <TemplatePage />
                    </AuthGuard>
                  }
                />

                {/* Admin only */}
                <Route
                  path="admin/users"
                  element={
                    <AuthGuard allowedRoles={['admin']}>
                      <UsersPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="admin/analytics"
                  element={
                    <AuthGuard allowedRoles={['admin']}>
                      <AnalyticsPage />
                    </AuthGuard>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
