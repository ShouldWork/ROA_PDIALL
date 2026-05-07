/**
 * Manufacturer chip colors — consolidated helper used by every component
 * that renders a PAUSE/MDC tag (Dashboard, NewPDI, PDIHeader,
 * TemplateItemList, SuggestionQueue).
 *
 * Returns an sx object keyed for MUI Chip:
 *   <Chip sx={getMfrChipSx('PAUSE', isDark)} ... />
 */
export function getMfrChipSx(manufacturer, isDark) {
  if (manufacturer === 'PAUSE') {
    return {
      bgcolor: isDark ? 'rgba(96,165,250,0.15)' : '#EFF6FF',
      color:   isDark ? '#93C5FD' : '#1D4ED8',
    };
  }
  return {
    bgcolor: isDark ? 'rgba(74,222,128,0.12)' : '#F0FDF4',
    color:   isDark ? '#4ADE80' : '#15803D',
  };
}
