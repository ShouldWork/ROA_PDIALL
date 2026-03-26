import { Box, Typography, Card, CardContent } from '@mui/material';

// Phase 3 implementation — scaffold only
export default function TemplatePage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>PDI Template</Typography>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Template editor — Phase 3.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
