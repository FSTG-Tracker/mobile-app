export const colors = {
  dark: {
    background: '#1a1f2e',
    card: '#252d3d',
    foreground: '#f5f7f9',
    primary: '#c2763a',
    muted: '#2a3547',
    mutedForeground: '#8fa3b1',
    border: 'rgba(255,255,255,0.10)',
    destructive: '#e05a3a',
  },
  light: {
    background: '#ffffff',
    card: '#ffffff',
    foreground: '#1a1f2e',
    primary: '#b5621e',
    muted: '#f0f4f5',
    mutedForeground: '#5a7a87',
    border: '#e2eaed',
    destructive: '#e05a3a',
  },
};

export type ThemeColors = typeof colors.dark;
