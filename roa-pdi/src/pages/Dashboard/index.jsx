import { Box, Typography, Card, CardContent, Chip, Grid } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useAuth } from '../../contexts/AuthContext';

// Phase 2 will fill this out with real data. This is the structural scaffold.
export default function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome back, {userProfile?.displayName?.split(' ')[0]}.
      </Typography>

      <Grid container spacing={2}>
        {/* Placeholder stat cards — replaced with real data in Phase 2 */}
        {[
          { label: 'Total PDIs', value: '—' },
          { label: 'In Progress', value: '—' },
          { label: 'Completed Today', value: '—' },
        ].map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>My PDIs</Typography>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No PDIs yet. A service writer will assign one to you.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
