import { useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Button, Alert, CircularProgress,
} from '@mui/material';
import DescriptionIcon    from '@mui/icons-material/Description';
import PersonOutlineIcon  from '@mui/icons-material/PersonOutline';
import BuildIcon          from '@mui/icons-material/Build';
import AutorenewIcon      from '@mui/icons-material/Autorenew';
import { generatePDIReports } from '../../../services/reports';

/**
 * Report generation + access panel. Shown on completed PDIs.
 * - canGenerate users can create/regenerate the PDFs.
 * - Once generated, both reports open from Storage in a new tab.
 * The PDI's reportUrl/internalReportUrl arrive via the live usePDI listener,
 * so the buttons swap in automatically after generation finishes.
 */
export default function ReportPanel({ pdi, items, uid, canGenerate }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');

  const hasReports = Boolean(pdi.reportUrl && pdi.internalReportUrl);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      await generatePDIReports(pdi, items, uid);
    } catch (err) {
      setError(err.message || 'Failed to generate reports. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <DescriptionIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={700}>Reports</Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {hasReports ? (
          <Stack spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PersonOutlineIcon />}
              href={pdi.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Customer Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<BuildIcon />}
              href={pdi.internalReportUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Internal Report
            </Button>
            {canGenerate && (
              <Button
                size="small"
                color="inherit"
                startIcon={generating ? <CircularProgress size={14} /> : <AutorenewIcon />}
                onClick={handleGenerate}
                disabled={generating}
                sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
              >
                {generating ? 'Regenerating…' : 'Regenerate'}
              </Button>
            )}
          </Stack>
        ) : canGenerate ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Generate the customer-facing and internal PDF reports for this inspection.
            </Typography>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <DescriptionIcon />}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate Reports'}
            </Button>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Reports haven&apos;t been generated for this PDI yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
