// Same palette as the TrueRate web app (EXE101/TrueRate/static/style.css).
export const colors = {
  bg: '#0a0d14',
  surface: '#12161f',
  surface2: '#171c27',
  surface3: '#1d2330',
  border: '#262c3b',
  text: '#eceef3',
  muted: '#8993a8',
  faint: '#545d70',
  accent: '#dba954',
  accentStrong: '#f0c274',
  accentSoft: 'rgba(219,169,84,0.13)',
  safe: '#4fae82',
  caution: '#d98a3d',
  danger: '#e0555a',
  neutral: '#8993a8',
};

export const radius = { sm: 8, md: 12, lg: 18 };

/** Risk level (from the engine) -> colour. */
export const levelColor = {
  low: colors.safe,
  caution: colors.caution,
  high: colors.danger,
  serious: colors.danger,
  unknown: colors.neutral,
};

export const levelIcon = {
  low: 'shield-checkmark',
  caution: 'alert-circle',
  high: 'warning',
  serious: 'skull',
  unknown: 'help-circle',
};
