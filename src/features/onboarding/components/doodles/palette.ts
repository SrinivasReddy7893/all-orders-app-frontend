/**
 * One doodle system: flat fills, a single ink outline weight with round
 * caps and joins, flat ground shadows. Red/black/white, tuned to ember.
 */
export const doodle = {
  ink: '#1A0602',
  paper: '#FFFFFF',
  cream: '#FFF1E6',
  ember: '#E8501A',
  emberDark: '#B83A10',
  cardboard: '#FFB57E',
  cardboardSide: '#E8894E',
  cardboardTop: '#FFCDA6',
  skin: '#FFE0CC',
  light: '#FFE08A',
  shadow: 'rgba(20, 4, 0, 0.28)',
  stroke: 3,
} as const;

export const outline = {
  stroke: doodle.ink,
  strokeWidth: doodle.stroke,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
