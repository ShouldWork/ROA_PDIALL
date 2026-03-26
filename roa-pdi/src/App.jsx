import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { AppThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import AuthGuard from './components/AuthGuard';
import AppShell from './components/AppShell';

// Eagerly loaded — small, needed before auth resolves
import Login from './pages/Login';
import Pending from './pages/Pending';
import Unauthorized from './pages/Unauthorized';

// Lazy loaded — only fetched when the route is visited (fix: issue #4)
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const NewPDI        = lazy(() => import('./pages/PDI/NewPDI'));
const PDIDetail     = lazy(() => import('./pages/PDI/PDIDetail'));
const TemplatePage  = lazy(() => import('./pages/Template'));
const UsersPage     = lazy(() => import('./pages/Admin/Users'));
const AnalyticsPage = lazy(() => import('./pages/Admin/Analytics'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <CssBaseline />
      <ConnectionProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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

                  {/* PDI detail — all active roles (guard inside page) */}
                <Route path="pdi/:id" element={<PDIDetail />} />

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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ConnectionProvider>
    </AppThemeProvider>
  );
}
