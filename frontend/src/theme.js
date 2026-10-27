// Palette Safidy + jetons de theme Ant Design (v6)
export const COLORS = {
  primary: '#0E7A55',   // vert principal
  primaryDark: '#0A5E41',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#EA580C',
  info: '#0369A1',
  bg: '#F3F6F8',
  sideDark: '#0B2C22',
};

export const theme = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.success,
    colorError: COLORS.danger,
    colorWarning: COLORS.warning,
    colorInfo: COLORS.info,
    colorBgLayout: COLORS.bg,
    colorTextBase: '#1B2B2A',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: COLORS.sideDark,
      headerBg: '#FFFFFF',
      bodyBg: COLORS.bg,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemColor: 'rgba(255,255,255,0.72)',
      darkItemSelectedBg: COLORS.primary,
      darkItemHoverColor: '#FFFFFF',
      itemBorderRadius: 8,
      itemMarginBlock: 4,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Table: {
      headerBg: '#EEF3F1',
      headerColor: '#0A5E41',
      rowHoverBg: '#F1F8F5',
    },
    Button: { primaryShadow: 'none', defaultShadow: 'none' },
  },
};
