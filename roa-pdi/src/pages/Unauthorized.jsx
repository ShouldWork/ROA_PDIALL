import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <BlockIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>Access Denied</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            You don't have permission to view that page.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
