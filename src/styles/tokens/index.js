import spacing from './spacing';
import radius from './radius';
import shadows from './shadows';
import colors from './colors';
import typography from './typography';

export { spacing, radius, shadows, colors, typography };

export const dashboardTokens = {
  shellPadding: '40px 48px',
  sidebarWidth: '260px',
  cardPadding: spacing.xl,
  cardRadius: radius.md,
  cardBorder: `1px solid ${colors.border}`,
};

export const tokens = {
  spacing,
  radius,
  shadows,
  colors,
  typography,
  dashboard: dashboardTokens,
};

export default tokens;
