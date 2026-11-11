import { memo, useId } from 'react';
import { HERITAGE } from '../utils/heritage';

/**
 * The couple's mood board, drawn as SVG: warm white with caramel-bronze
 * African-inspired motifs (almond eyes, carved masks, sun discs, bars and
 * dots) and a serif "T&D" monogram in an oval with leaf sprigs.
 *
 * Everything here is vector, so it is crisp at any size, weighs nothing,
 * and takes its colour from HERITAGE.bronze (or a `color` prop).
 */

const TILE = 120;

/** One 120×120 tile of motifs; repeats seamlessly. `bg` fills the cut-outs. */
function MotifTileShapes({ color, bg }) {
  return (
    <g fill={color}>
      {/* almond eye */}
      <path d="M8 18 Q28 3 48 18 Q28 33 8 18Z" />
      <circle cx="28" cy="18" r="6" fill={bg} />
      <circle cx="28" cy="18" r="2.6" />
      {/* carved mask */}
      <ellipse cx="96" cy="34" rx="10" ry="27" />
      <path d="M89 24 Q93 21 97 24 Q93 27 89 24Z M95 24 Q99 21 103 24 Q99 27 95 24Z" fill={bg} />
      <rect x="95" y="30" width="2" height="14" fill={bg} />
      <path d="M90 50 h12" stroke={bg} strokeWidth="2" />
      <path d="M91 55 h10" stroke={bg} strokeWidth="1.5" />
      {/* sun disc */}
      <circle cx="30" cy="70" r="14" />
      <circle cx="30" cy="70" r="7.5" fill={bg} />
      <circle cx="30" cy="70" r="3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle
          key={a}
          cx={30 + Math.cos((a * Math.PI) / 180) * 10.8}
          cy={70 + Math.sin((a * Math.PI) / 180) * 10.8}
          r="1.3"
          fill={bg}
        />
      ))}
      {/* bars */}
      <rect x="58" y="62" width="22" height="3" rx="1.5" />
      <rect x="58" y="69" width="16" height="3" rx="1.5" />
      <rect x="58" y="76" width="22" height="3" rx="1.5" />
      {/* comb / ladder */}
      <rect x="4" y="96" width="34" height="3" />
      {[6, 12, 18, 24, 30, 36].map((x) => <rect key={x} x={x - 1} y="99" width="2" height="9" />)}
      {/* seed / lips */}
      <path d="M58 104 Q72 94 86 104 Q72 114 58 104Z" />
      <path d="M61 104 H83" stroke={bg} strokeWidth="1.6" />
      {/* small eye */}
      <path d="M92 96 Q104 88 116 96 Q104 104 92 96Z" />
      <circle cx="104" cy="96" r="2.6" fill={bg} />
      {/* scattered dots and ticks */}
      <circle cx="54" cy="10" r="1.8" />
      <circle cx="60" cy="16" r="1.8" />
      <circle cx="66" cy="10" r="1.8" />
      <rect x="60" y="34" width="2.4" height="14" rx="1.2" />
      <rect x="66" y="30" width="2.4" height="22" rx="1.2" />
      <rect x="72" y="34" width="2.4" height="14" rx="1.2" />
      <circle cx="112" cy="70" r="2" />
      <circle cx="112" cy="78" r="2" />
      <circle cx="48" cy="86" r="1.6" />
    </g>
  );
}

/** The repeating pattern as an SVG <pattern> definition. */
function MotifPatternDef({ id, color, bg, scale = 1 }) {
  // The cut-outs (pupils, inner rings) are punched out with a mask so they
  // show whatever is behind the pattern, even when its background is clear.
  const s = TILE * scale;
  return (
    <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
      <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width={s} height={s}>
        <g transform={`scale(${scale})`}>
          <MotifTileShapes color="#fff" bg="#000" />
        </g>
      </mask>
      {bg && bg !== 'transparent' && <rect width={s} height={s} fill={bg} />}
      <rect width={s} height={s} fill={color} mask={`url(#${id}-cut)`} />
    </pattern>
  );
}

/**
 * A corner of patterned cloth that fades into the page. Replaces the big
 * corner flowers. `corner`: 'top-left' | 'bottom-right' | 'top-right' | 'bottom-left'.
 */
export const MotifCorner = memo(function MotifCorner({
  size = 260,
  corner = 'top-left',
  color = HERITAGE.bronze,
  opacity = 0.55,
  className = '',
  style,
}) {
  const uid = useId().replace(/:/g, '');
  const cx = corner.includes('left') ? 0 : 100;
  const cy = corner.includes('top') ? 0 : 100;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
      // Sized by `size`, but a parent's width class (e.g. w-48 on phones) can shrink it.
      style={{ opacity, maxWidth: '100%', height: 'auto', ...style }}
    >
      <defs>
        <MotifPatternDef id={`p${uid}`} color={color} bg="transparent" scale={0.32} />
        <radialGradient id={`g${uid}`} cx={cx} cy={cy} r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`m${uid}`}>
          <rect width="100" height="100" fill={`url(#g${uid})`} />
        </mask>
      </defs>
      <rect width="100" height="100" fill={`url(#p${uid})`} mask={`url(#m${uid})`} />
    </svg>
  );
});

/** A patterned arch, like the panels on the décor backdrop. */
export const MotifArch = memo(function MotifArch({
  width = 120,
  height = 220,
  color = HERITAGE.bronze,
  bg = '#ffffff',
  className = '',
  style,
}) {
  const uid = useId().replace(/:/g, '');
  const r = width / 2;
  const d = `M0 ${height} V${r} A${r} ${r} 0 0 1 ${width} ${r} V${height} Z`;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={`pointer-events-none ${className}`} style={style}>
      <defs>
        <MotifPatternDef id={`a${uid}`} color={color} bg={bg} scale={0.5} />
      </defs>
      <path d={d} fill={`url(#a${uid})`} />
    </svg>
  );
});

/** A thin horizontal strip of the pattern (headers, footers, card edges). */
export const MotifBand = memo(function MotifBand({ height = 28, color = HERITAGE.bronze, bg = 'transparent', opacity = 0.9, className = '' }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" width="100%" height={height} className={`block pointer-events-none ${className}`} style={{ opacity }}>
      <defs>
        <MotifPatternDef id={`b${uid}`} color={color} bg={bg} scale={height / TILE} />
      </defs>
      <rect width="100%" height={height} fill={`url(#b${uid})`} />
    </svg>
  );
});

/** A single small emblem (eye in a diamond with a sun disc) for dividers. */
export const MotifEmblem = memo(function MotifEmblem({ size = 40, color = HERITAGE.bronze, variant = 'eye', className = '', style }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" width={size} height={size} className={`pointer-events-none ${className}`} style={style}>
      <g fill={color}>
        {variant === 'sun' ? (
          <>
            <circle cx="20" cy="20" r="15" />
            <circle cx="20" cy="20" r="8" fill="#fff" />
            <circle cx="20" cy="20" r="3.4" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <circle key={a} cx={20 + Math.cos((a * Math.PI) / 180) * 11.6} cy={20 + Math.sin((a * Math.PI) / 180) * 11.6} r="1.4" fill="#fff" />
            ))}
          </>
        ) : variant === 'mask' ? (
          <>
            <ellipse cx="20" cy="20" rx="8" ry="18" />
            <path d="M14 14 Q17 11.5 20 14 Q17 16.5 14 14Z M20 14 Q23 11.5 26 14 Q23 16.5 20 14Z" fill="#fff" />
            <rect x="19" y="18" width="2" height="9" fill="#fff" />
            <path d="M15 30 h10" stroke="#fff" strokeWidth="1.6" />
          </>
        ) : (
          <>
            <path d="M20 3 L37 20 L20 37 L3 20Z" fill="none" stroke={color} strokeWidth="1.4" />
            <path d="M9 20 Q20 11 31 20 Q20 29 9 20Z" />
            <circle cx="20" cy="20" r="4.2" fill="#fff" />
            <circle cx="20" cy="20" r="2" />
          </>
        )}
      </g>
    </svg>
  );
});

/** A leafy sprig (as on the monogram). */
function Sprig({ transform, color }) {
  const leaves = [
    [8, -4, -35], [16, -9, -30], [24, -13, -25], [32, -16, -20],
    [10, 5, 40], [19, 1, 35], [28, -3, 30],
  ];
  return (
    <g transform={transform} fill={color}>
      <path d="M0 0 Q20 -6 40 -20" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {leaves.map(([x, y, r]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4.4" ry="1.9" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

/**
 * The couple's monogram: two serif initials with an ampersand, in an oval
 * framed by two leaf sprigs. Initials come from the names in Settings.
 */
export const Monogram = memo(function Monogram({
  first = 'T',
  second = 'D',
  size = 120,
  color = HERITAGE.bronzeSoft,
  className = '',
  title,
}) {
  const h = size * 1.32;
  return (
    <svg
      viewBox="0 0 100 132"
      width={size}
      height={h}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="10" y="6" width="80" height="120" rx="40" fill="none" stroke={color} strokeWidth="1.6" />
      <Sprig transform="translate(62 30) rotate(-10)" color={color} />
      <Sprig transform="translate(38 104) rotate(170)" color={color} />
      <g fill={color} fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif">
        <text x="40" y="62" fontSize="40" textAnchor="middle">{first}</text>
        <text x="52" y="80" fontSize="28" textAnchor="middle" fontStyle="italic">&amp;</text>
        <text x="60" y="104" fontSize="40" textAnchor="middle">{second}</text>
      </g>
    </svg>
  );
});
