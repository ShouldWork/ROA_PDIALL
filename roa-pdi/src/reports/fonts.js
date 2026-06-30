import { Font } from '@react-pdf/renderer';

// Brand fonts are bundled locally (TTF) rather than fetched from Google Fonts
// at render time — react-pdf needs the font bytes synchronously available when
// it lays out a page, and a network hiccup would otherwise fail PDF generation.
import RajdhaniRegular  from '../assets/fonts/Rajdhani-Regular.ttf';
import RajdhaniSemiBold from '../assets/fonts/Rajdhani-SemiBold.ttf';
import RajdhaniBold     from '../assets/fonts/Rajdhani-Bold.ttf';
import DMSansLight      from '../assets/fonts/DMSans-Light.ttf';
import DMSansRegular    from '../assets/fonts/DMSans-Regular.ttf';
import DMSansBold       from '../assets/fonts/DMSans-Bold.ttf';
import DMSansItalic     from '../assets/fonts/DMSans-Italic.ttf';

let registered = false;

/**
 * Register the ROA brand fonts with react-pdf. Idempotent — safe to call before
 * every render. Must run before any Document that references these families is
 * rendered to a blob.
 */
export function registerReportFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Rajdhani',
    fonts: [
      { src: RajdhaniRegular,  fontWeight: 400 },
      { src: RajdhaniSemiBold, fontWeight: 600 },
      { src: RajdhaniBold,     fontWeight: 700 },
    ],
  });

  Font.register({
    family: 'DM Sans',
    fonts: [
      { src: DMSansLight,   fontWeight: 300 },
      { src: DMSansRegular, fontWeight: 400 },
      { src: DMSansBold,    fontWeight: 700 },
      { src: DMSansItalic,  fontWeight: 400, fontStyle: 'italic' },
    ],
  });

  // Inspection item text is long and full of slashes/part numbers. Disable
  // hyphenation so words wrap whole instead of breaking at odd points.
  Font.registerHyphenationCallback((word) => [word]);
}

// ROA grayscale palette — no accent colors are permitted on customer-facing
// output. Photography is the only source of color in brand layouts; a PDI
// report has none, so it stays fully monochrome.
export const BRAND = {
  black:         '#000000',
  deepGraphite:  '#1A1A1A',
  darkGraphite:  '#3A3A3A',
  midGraphite:   '#787878',
  lightGraphite: '#C8C8C8',
  hairline:      '#E5E5E5',
  white:         '#FFFFFF',
};
