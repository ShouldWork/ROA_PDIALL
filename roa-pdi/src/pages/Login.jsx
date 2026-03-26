import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Alert, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, userProfile, loading, authError, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userProfile?.active) {
      navigate('/', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              ROA PDI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pre-Delivery Inspection System
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in with your <strong>rvsofamerica.com</strong> Google account to continue.
          </Typography>

          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
