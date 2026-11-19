/**
 * Warm "ember" palette: deep red-brown at the top, settling into a saturated
 * orange (kept deep enough at the bottom for white text to pass contrast).
 */
export const colors = {
  ink: '#121212',
  onInk: '#FFFFFF',

  onEmber: '#FFFFFF',
  onEmberMuted: 'rgba(255, 255, 255, 0.88)',
  onEmberSubtle: 'rgba(255, 255, 255, 0.72)',
  glass: 'rgba(255, 255, 255, 0.14)',
  glassBorder: 'rgba(255, 255, 255, 0.24)',
  live: '#FF8A4C',

  // White product-UI surfaces floating on the ember gradient
  surface: '#FFFFFF',
  textPrimary: '#121212',
  textSecondary: '#6B6B70',
  track: '#F1E9E5',
  ember: '#E2501A',
  /** Ember for text on white (4.5:1+); `ember` is for fills. */
  emberText: '#C2410C',
  danger: '#FFD7C9',

  // Product canvas under the ember header (Home and beyond)
  canvas: '#FAF6F3',
  hairline: '#EDE3DD',
  success: '#1F7A4D',
  successTint: '#E4F3EA',
  emberTint: '#FDEDE4',
  /** Warm hairline for order cards. */
  cardBorder: '#F6DFD1',
} as const;

/** CSS gradients for the native `backgroundImage` style (RN 0.76+). */
export const gradients = {
  ember:
    'linear-gradient(180deg, #1A0602 0%, #561205 26%, #9A270A 54%, #AE3310 80%, #B23611 100%)',
  glow: 'radial-gradient(circle at center, rgba(255, 140, 60, 0.5) 0%, rgba(255, 140, 60, 0) 70%)',
  darkCard: 'linear-gradient(145deg, #3A1A12 0%, #1A0B07 55%, #0E0605 100%)',
  emberStripe: 'linear-gradient(180deg, #FF7A35 0%, #C7340C 100%)',
  chip: 'linear-gradient(135deg, #FFB078 0%, #E8561A 100%)',
  /** Order cards: white that warms to a faint peach at the bottom-right. */
  orderCard: 'linear-gradient(160deg, #FFFFFF 0%, #FFFFFF 45%, #FFF1E8 100%)',
} as const;
