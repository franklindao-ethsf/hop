export const defaultTransition = 'all 0.15s ease-out'

export const palette = {
  primary: {
    light: '#c462fc',
    main: '#B32EFF',
    dark: '#7213a8',
    contrastText: 'white',
  },
  background: {
    default: '#FDF7F9',
    paper: '#FDF7F9',
    contrast: '#FFFFFF',
  },
  action: {
    active: '#B32EFF',
    hover: '#e8c1ff',
    selected: '#B32EFF',
    disabled: 'white',
  },
  secondary: {
    main: '#666077',
    light: '#6660777f',
  },
  success: {
    main: '#00a72f',
    light: '#00a72f33',
  },
  error: {
    main: '#c50602',
    light: '#c506021e',
  },
  info: {
    main: '#2172e5',
    light: '#2172e51e',
  },
  text: {
    primary: '#0F0524',
    secondary: '#666077',
    disabled: '#6660777f',
  },
}

export const boxShadows = {
  input: {
    normal: ` `,
    bold: ` `,
  },
  inner: ` `,
  card: ` `,
  button: {
    default: ` `,
    disabled: ` `,
    highlighted: ` `,
  },
  select: ` `,
}

export const overridesLight = {
  MuiButton: {
    root: {
      margin: 'inherit',
      backgroundColor: 'transparent',
      boxShadow: boxShadows.button.default,
      color: palette.primary.main,
      transition: defaultTransition,
      '&:disabled': {
        background: '#FDF7F9',
        boxShadow: boxShadows.button.default,
        color: palette.text.disabled,
      },
    },
  },
  MuiCard: {
    root: {
      padding: '2.8rem',
      borderRadius: '3.0rem',
      boxShadow: boxShadows.card,
      transition: defaultTransition,
    },
  },
  MuiListItem: {
    root: {
      transition: defaultTransition,
      '&$selected': {
        backgroundColor: '#b32eff19',
        color: palette.text.primary,
        '&:hover': {
          backgroundColor: '#b32eff1e',
        },
      },
    },
    button: {
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
      transition: defaultTransition,
    },
  },
  MuiMenuItem: {
    root: {
      fontWeight: 700,
      fontSize: '1.8rem',
      transition: defaultTransition,
    },
  },
  MuiInputBase: {
    root: {
      transition: defaultTransition,
    },
  },
  MuiPaper: {
    root: {
      backgroundColor: '#FDF7F9',
      transition: defaultTransition,
    },
  },
  MuiPopover: {
    paper: {
      transition: defaultTransition,
      borderRadius: '3.0rem',
      boxShadow: `
          0px 5px 15px -3px rgba(0,0,0,0.1),
          0px 8px 20px 1px rgba(0,0,0,0.07),
          0px 3px 24px 2px rgba(0,0,0,0.06);
        `,
    },
  },
  MuiSelect: {
    root: {
      backgroundColor: 'white',
      // boxShadow: boxShadows.select,
      transition: defaultTransition,
    },
  },
  MuiSlider: {
    root: {
      height: 3,
    },
    thumb: {
      height: 14,
      width: 14,
    },
    track: {
      height: 3,
      borderRadius: 8,
    },
    rail: {
      height: 3,
      borderRadius: 8,
    },
    mark: {
      height: 3,
    },
    valueLabel: {
      fontSize: '1.4rem',
    },
  },
  MuiTabs: {
    indicator: {
      display: 'none',
    },
  },
  MuiTab: {
    root: {
      transition: defaultTransition,
      '&.MuiTab-root': {
        color: palette.text.secondary,
        minWidth: 0,
        borderRadius: '3rem',
      },
      '&$selected': {
        color: palette.primary.main,
      },
      '&:hover:not($selected)': {
        color: palette.text.primary,
      },
    },
  },
  MuiTooltip: {
    tooltip: {
      fontSize: '1.6rem',
    },
  },
  MuiTypography: {
    root: {
      color: '#0F0524',
      transition: defaultTransition,
    },
  },
}
