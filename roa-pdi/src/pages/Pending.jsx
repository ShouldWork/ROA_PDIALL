import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useAuth } from '../contexts/AuthContext';

export default function Pending() {
  const { logout, userProfile } = useAuth();

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
      <Card sx={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <HourglassEmptyIcon sx={{ fontSize: 56, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Account Pending Approval
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your account (<strong>{userProfile?.email}</strong>) has been created and is
            awaiting role assignment by an administrator.
            <br /><br />
            You'll be able to log in once your access has been approved.
          </Typography>
          <Button variant="outlined" onClick={logout}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
