import { useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Stack, Button,
  Skeleton, Alert, Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { useItemStats } from '../../hooks/useItemStats';

const MFR_FILTERS = [
  { value: 'all',   label: 'All' },
  { value: 'PAUSE', label: 'PAUSE' },
  { value: 'MDC',   label: 'MDC' },
];

// Below this many evaluations a fail rate is too noisy to rank or flag
// (1 fail out of 1 is not "100% failure"). Such items still appear in the
// full table, just never in the chart or the flagged-items count.
const MIN_SAMPLE = 5;
const TOP_N      = 10;

// A fail rate at or above this (with adequate sample) is worth attention.
const FLAG_THRESHOLD = 25;

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

const truncate = (s, n = 32) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function AnalyticsPage() {
  const { rows, loading, error, refresh } = useItemStats();
  const theme = useTheme();

  const [mfrFilter, setMfrFilter] = useState('all');

  const filtered = useMemo(
    () => (mfrFilter === 'all' ? rows : rows.filter((r) => r.manufacturer === mfrFilter)),
    [rows, mfrFilter],
  );

  // Headline numbers. Pass/fail totals are summed across items so the overall
  // rate is weighted by volume, not a naive average of per-item rates.
  const summary = useMemo(() => {
    const totalEvaluated = filtered.reduce((sum, r) => sum + r.totalEvaluated, 0);
    const totalFailed    = filtered.reduce((sum, r) => sum + r.totalFailed, 0);
    const flagged = filtered.filter(
      (r) => r.totalEvaluated >= MIN_SAMPLE && r.failRate >= FLAG_THRESHOLD,
    ).length;
    return {
      itemsTracked: filtered.length,
      totalEvaluated,
      overallFailRate: totalEvaluated > 0 ? Math.round((totalFailed / totalEvaluated) * 100) : 0,
      flagged,
    };
  }, [filtered]);

  // Sorted once, descending by fail rate then by volume as the tiebreaker.
  const ranked = useMemo(
    () => [...filtered].sort(
      (a, b) => b.failRate - a.failRate || b.totalEvaluated - a.totalEvaluated,
    ),
    [filtered],
  );

  const chartData = useMemo(
    () => ranked
      .filter((r) => r.totalEvaluated >= MIN_SAMPLE)
      .slice(0, TOP_N)
      .map((r) => ({ id: r.id, name: truncate(r.itemText), failRate: r.failRate, fullName: r.itemText })),
    [ranked],
  );

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5">Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Inspection failure rates by item, drawn from completed PDIs
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {/* Manufacturer filter */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 3 }}>
        {MFR_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            size="small"
            clickable
            variant={mfrFilter === f.value ? 'filled' : 'outlined'}
            color={mfrFilter === f.value ? 'secondary' : 'default'}
            onClick={() => setMfrFilter(f.value)}
          />
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load analytics. Check your connection and try Refresh.
        </Alert>
      )}

      {loading && (
        <Grid container spacing={2} mb={3}>
          {[1, 2, 3, 4].map((n) => (
            <Grid item xs={6} sm={3} key={n}>
              <Card><CardContent><Skeleton width="50%" height={40} /><Skeleton width="80%" height={16} /></CardContent></Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Card><CardContent><Skeleton variant="rectangular" height={300} /></CardContent></Card>
          </Grid>
        </Grid>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No analytics yet. Failure rates populate as PDIs are completed.
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* Summary cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <StatCard label="Items Tracked" value={summary.itemsTracked} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="Evaluations" value={summary.totalEvaluated} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="Overall Fail Rate" value={`${summary.overallFailRate}%`} color="warning.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label={`Flagged (≥${FLAG_THRESHOLD}%)`} value={summary.flagged} color="error.main" />
            </Grid>
          </Grid>

          {/* Top failures chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Highest failure rates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top {TOP_N} items with at least {MIN_SAMPLE} evaluations
              </Typography>
              {chartData.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Not enough data yet. Items need at least {MIN_SAMPLE} evaluations to rank.
                </Typography>
              ) : (
                <Box sx={{ height: Math.max(220, chartData.length * 38 + 40), mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}>
                      <CartesianGrid horizontal={false} stroke={theme.palette.divider} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={200}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: theme.palette.action.hover }}
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                          color: theme.palette.text.primary,
                        }}
                        formatter={(value) => [`${value}%`, 'Fail rate']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                      />
                      <Bar dataKey="failRate" radius={[0, 4, 4, 0]}>
                        {chartData.map((d) => (
                          <Cell
                            key={d.id}
                            fill={d.failRate >= FLAG_THRESHOLD ? theme.palette.error.main : theme.palette.warning.main}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Full table */}
          <Card>
            <CardContent sx={{ px: 0, pb: '0 !important' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, mb: 1 }}>
                All inspection items
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Category</TableCell>
                      {mfrFilter === 'all' && <TableCell>Mfr</TableCell>}
                      <TableCell align="right">Evaluated</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right" sx={{ minWidth: 120 }}>Fail Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ranked.map((r) => {
                      const lowSample = r.totalEvaluated < MIN_SAMPLE;
                      const flagged   = !lowSample && r.failRate >= FLAG_THRESHOLD;
                      return (
                        <TableRow key={r.id} hover>
                          <TableCell>{r.itemText}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{r.category}</Typography>
                          </TableCell>
                          {mfrFilter === 'all' && <TableCell>{r.manufacturer}</TableCell>}
                          <TableCell align="right">{r.totalEvaluated}</TableCell>
                          <TableCell align="right">{r.totalFailed}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                              <Box sx={{ width: 56 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={r.failRate}
                                  color={flagged ? 'error' : 'warning'}
                                  sx={{ height: 6, borderRadius: 3, opacity: lowSample ? 0.4 : 1 }}
                                />
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight={flagged ? 700 : 400}
                                color={lowSample ? 'text.disabled' : 'text.primary'}
                                sx={{ minWidth: 36 }}
                              >
                                {r.failRate}%
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
