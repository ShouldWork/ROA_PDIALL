import { Svg, G, Path } from '@react-pdf/renderer';
import { ROA_WORDMARK } from './roaWordmark';

/**
 * Official ROA / RVS OF AMERICA wordmark, BLACK variant for light backgrounds.
 * Renders the sanctioned brand artwork through react-pdf SVG primitives — the
 * path is the exact brand asset, never approximated or recolored.
 *
 * Pass a width; height is derived from the artwork's native aspect ratio so the
 * logo is never stretched or distorted (a brand do-not).
 */
export default function ReportLogo({ width = 150 }) {
  const height = width / ROA_WORDMARK.aspect;
  return (
    <Svg viewBox={ROA_WORDMARK.viewBox} width={width} height={height}>
      <G transform={ROA_WORDMARK.transform} fill="#000000">
        <Path d={ROA_WORDMARK.path} />
      </G>
    </Svg>
  );
}
