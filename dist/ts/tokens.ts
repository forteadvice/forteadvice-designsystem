// Forte Advice Design Tokens (auto-generated)
// DO NOT EDIT — regenerate with: npm run build

export const meta = {
  "name": "Forte Advice Design System",
  "version": "0.1.0",
  "updated": "2026-03-31"
} as const;

export const typography = {
  "fontFamily": {
    "sans": "Geist",
    "mono": "Geist Mono"
  },
  "fontWeight": {
    "regular": 400,
    "medium": 500,
    "semibold": 600,
    "bold": 700
  }
} as const;

export const icons = {
  "library": "phosphor",
  "defaultWeight": "regular",
  "weights": [
    "thin",
    "light",
    "regular",
    "bold",
    "fill",
    "duotone"
  ],
  "defaultSizes": [
    16,
    20,
    24,
    28
  ]
} as const;

export const colors = {
  "primitives": {
    "darkPlum": "#221C38",
    "plum": "#39344B",
    "habourMist": "#BBC6C5",
    "ashGrey": "#D6DDDC",
    "cream": "#F2F0E7",
    "cookieDough": "#EDE6C3",
    "burgendy": "#511E29",
    "darkBurgendy": "#3D0E18",
    "highlight": "#FF6A3D",
    "white": "#FFFFFF"
  },
  "tones": {
    "harbourMist": {
      "50": "#F7F8F8",
      "100": "#EEF0F0",
      "200": "#D9DEDE",
      "300": "#BBC6C5",
      "400": "#919F9D",
      "500": "#738482",
      "600": "#5D6C6A",
      "700": "#4C5857",
      "800": "#414B4B",
      "900": "#394141",
      "950": "#262B2B"
    },
    "cream": {
      "50": "#ECE8DA",
      "100": "#E0DBC8",
      "200": "#D4CDB3",
      "300": "#CDC3A4",
      "400": "#B8A77F",
      "500": "#A99266",
      "600": "#9C815A",
      "700": "#82694C",
      "800": "#6A5642",
      "900": "#574737",
      "950": "#2E241C"
    },
    "plum": {
      "50": "#F4F4FA",
      "100": "#E7E7F2",
      "200": "#D4D4E9",
      "300": "#B7B8D9",
      "400": "#9595C5",
      "500": "#7F7BB6",
      "600": "#7269A7",
      "700": "#685D98",
      "800": "#594F7E",
      "900": "#494365",
      "950": "#39344B"
    },
    "burgendy": {
      "50": "#FBF4F7",
      "100": "#F7ECF0",
      "200": "#F1D9E3",
      "300": "#E7BACA",
      "400": "#D78FA8",
      "500": "#C76D89",
      "600": "#B2506A",
      "700": "#983E53",
      "800": "#7F3546",
      "900": "#6B303D",
      "950": "#511E29"
    }
  },
  "state": {
    "error": "#9D140F",
    "warning": "#CBAE54",
    "success": "#518579",
    "focus": "#FF6A3D"
  },
  "modes": {
    "cream-plum": {
      "id": "light",
      "label": "Cream / Plum",
      "surface": {
        "primary": "#F2F0E7",
        "secondary": "#ECE8DA",
        "opaque": "rgba(242,240,231,0.6)"
      },
      "text": {
        "primary": "#221C38",
        "secondary": "#82694C",
        "inverted": "#F2F0E7",
        "disabled": "#B8A77F"
      },
      "button": {
        "primary": "#39344B",
        "primaryHover": "#221C38",
        "disabled": "#D4CDB3"
      },
      "stroke": {
        "harsh": "#221C38",
        "subtle": "#D4CDB3"
      },
      "focus": "#7269A7"
    },
    "plum-cream": {
      "id": "dark",
      "label": "Plum / Cream",
      "surface": {
        "primary": "#221C38",
        "secondary": "#39344B",
        "opaque": "rgba(34,28,56,0.6)"
      },
      "text": {
        "primary": "#F2F0E7",
        "secondary": "#9595C5",
        "inverted": "#221C38",
        "disabled": "#7269A7"
      },
      "button": {
        "primary": "#ECE8DA",
        "primaryHover": "#D4CDB3",
        "disabled": "#39344B"
      },
      "stroke": {
        "harsh": "#F2F0E7",
        "subtle": "#39344B"
      },
      "focus": "#7269A7"
    },
    "cream-burgendy": {
      "id": "light-burgendy",
      "label": "Cream / Burgendy",
      "surface": {
        "primary": "#F2F0E7",
        "secondary": "#ECE8DA",
        "opaque": "rgba(242,240,231,0.6)"
      },
      "text": {
        "primary": "#3D0E18",
        "secondary": "#82694C",
        "inverted": "#F2F0E7",
        "disabled": "#B8A77F"
      },
      "button": {
        "primary": "#511E29",
        "primaryHover": "#3D0E18",
        "disabled": "#D4CDB3"
      },
      "stroke": {
        "harsh": "#3D0E18",
        "subtle": "#D4CDB3"
      },
      "focus": "#FF6A3D"
    },
    "burgendy-cream": {
      "id": "dark-burgendy",
      "label": "Burgendy / Cream",
      "surface": {
        "primary": "#3D0E18",
        "secondary": "#511E29",
        "opaque": "rgba(61,14,24,0.6)"
      },
      "text": {
        "primary": "#FF6A3D",
        "secondary": "#E7BACA",
        "inverted": "#3D0E18",
        "disabled": "#983E53"
      },
      "button": {
        "primary": "#F2F0E7",
        "primaryHover": "#D4CDB3",
        "disabled": "#511E29"
      },
      "stroke": {
        "harsh": "#FF6A3D",
        "subtle": "#511E29"
      },
      "focus": "#FF6A3D"
    },
    "grey": {
      "id": "grey",
      "label": "Grey",
      "surface": {
        "primary": "#D6DDDC",
        "secondary": "#BBC6C5",
        "opaque": "rgba(214,221,220,0.6)"
      },
      "text": {
        "primary": "#3D0E18",
        "secondary": "#983E53",
        "inverted": "#F2F0E7",
        "disabled": "#738482"
      },
      "button": {
        "primary": "#511E29",
        "primaryHover": "#3D0E18",
        "disabled": "#919F9D"
      },
      "stroke": {
        "harsh": "#511E29",
        "subtle": "#919F9D"
      },
      "focus": "#FF6A3D"
    }
  }
} as const;

export type ColorMode = "cream-plum" | "plum-cream" | "cream-burgendy" | "burgendy-cream" | "grey";

export function modeColors(mode: ColorMode) {
  return colors.modes[mode];
}
