// Forte Advice Design Tokens (auto-generated)
// DO NOT EDIT — regenerate with: npm run build

export declare const meta: {
  readonly "name": "Forte Advice Design System";
  readonly "version": "0.4.0";
  readonly "updated": "2026-09-05";
};

export declare const typography: {
  readonly "fontFamily": {
    readonly "sans": "Geist";
    readonly "mono": "Geist Mono";
    readonly "powerpoint": "Aptos";
    readonly "powerpointHeading": "Aptos Display";
  };
  readonly "fontWeight": {
    readonly "regular": 400;
    readonly "medium": 500;
    readonly "semibold": 600;
    readonly "bold": 700;
  };
  readonly "notes": {
    readonly "powerpoint": "Aptos and Aptos Display are used in PowerPoint templates instead of Geist, since Aptos ships with Microsoft 365 and works without per-machine font installation. For all web/digital products, use Geist.";
  };
};

export declare const icons: {
  readonly "library": "phosphor";
  readonly "defaultWeight": "regular";
  readonly "weights": readonly ["thin", "light", "regular", "bold", "fill", "duotone"];
  readonly "defaultSizes": readonly [16, 20, 24, 28];
};

export declare const colors: {
  readonly "notes": {
    readonly "focus": "The focus ring colour is mode-dependent and lives in each entry of colors.modes, surfaced as --focus / ring-focus. There is deliberately no colors.state.focus: a single global value would contradict the per-mode ones.";
  };
  readonly "primitives": {
    readonly "darkPlum": "#221C38";
    readonly "plum": "#39344B";
    readonly "harbourMist": "#BBC6C5";
    readonly "ashGrey": "#D6DDDC";
    readonly "cream": "#F2F0E7";
    readonly "cookieDough": "#EDE6C3";
    readonly "burgendy": "#511E29";
    readonly "darkBurgendy": "#3D0E18";
    readonly "wine": "#751B2F";
    readonly "highlight": "#FF6A3D";
    readonly "white": "#FFFFFF";
  };
  readonly "tones": {
    readonly "harbourMist": {
      readonly "50": "#F7F8F8";
      readonly "100": "#EEF0F0";
      readonly "200": "#D9DEDE";
      readonly "300": "#BBC6C5";
      readonly "400": "#919F9D";
      readonly "500": "#738482";
      readonly "600": "#5D6C6A";
      readonly "700": "#4C5857";
      readonly "800": "#414B4B";
      readonly "900": "#394141";
      readonly "950": "#262B2B";
    };
    readonly "cream": {
      readonly "50": "#ECE8DA";
      readonly "100": "#E0DBC8";
      readonly "200": "#D4CDB3";
      readonly "300": "#CDC3A4";
      readonly "400": "#B8A77F";
      readonly "500": "#A99266";
      readonly "600": "#9C815A";
      readonly "700": "#82694C";
      readonly "800": "#6A5642";
      readonly "900": "#574737";
      readonly "950": "#2E241C";
    };
    readonly "plum": {
      readonly "50": "#F4F4FA";
      readonly "100": "#E7E7F2";
      readonly "200": "#D4D4E9";
      readonly "300": "#B7B8D9";
      readonly "400": "#9595C5";
      readonly "500": "#7F7BB6";
      readonly "600": "#7269A7";
      readonly "700": "#685D98";
      readonly "800": "#594F7E";
      readonly "900": "#494365";
      readonly "950": "#39344B";
    };
    readonly "burgendy": {
      readonly "50": "#FBF4F7";
      readonly "100": "#F7ECF0";
      readonly "200": "#F1D9E3";
      readonly "300": "#E7BACA";
      readonly "400": "#D78FA8";
      readonly "500": "#C76D89";
      readonly "600": "#B2506A";
      readonly "700": "#983E53";
      readonly "800": "#7F3546";
      readonly "900": "#6B303D";
      readonly "950": "#511E29";
    };
  };
  readonly "state": {
    readonly "error": "#9D140F";
    readonly "warning": "#CBAE54";
    readonly "success": "#518579";
  };
  readonly "modes": {
    readonly "cream-plum": {
      readonly "id": "light";
      readonly "label": "Cream / Plum";
      readonly "surface": {
        readonly "primary": "#F2F0E7";
        readonly "secondary": "#ECE8DA";
        readonly "opaque": "rgba(242,240,231,0.6)";
      };
      readonly "text": {
        readonly "primary": "#221C38";
        readonly "secondary": "#82694C";
        readonly "inverted": "#F2F0E7";
        readonly "disabled": "#B8A77F";
      };
      readonly "button": {
        readonly "primary": "#39344B";
        readonly "primaryHover": "#221C38";
        readonly "disabled": "#D4CDB3";
      };
      readonly "stroke": {
        readonly "harsh": "#221C38";
        readonly "subtle": "#D4CDB3";
      };
      readonly "focus": "#7269A7";
    };
    readonly "plum-cream": {
      readonly "id": "dark";
      readonly "label": "Plum / Cream";
      readonly "surface": {
        readonly "primary": "#221C38";
        readonly "secondary": "#39344B";
        readonly "opaque": "rgba(34,28,56,0.6)";
      };
      readonly "text": {
        readonly "primary": "#F2F0E7";
        readonly "secondary": "#9595C5";
        readonly "inverted": "#221C38";
        readonly "disabled": "#7269A7";
      };
      readonly "button": {
        readonly "primary": "#ECE8DA";
        readonly "primaryHover": "#D4CDB3";
        readonly "disabled": "#39344B";
      };
      readonly "stroke": {
        readonly "harsh": "#F2F0E7";
        readonly "subtle": "#39344B";
      };
      readonly "focus": "#7269A7";
    };
    readonly "cream-burgendy": {
      readonly "id": "light-burgendy";
      readonly "label": "Cream / Burgendy";
      readonly "surface": {
        readonly "primary": "#F2F0E7";
        readonly "secondary": "#ECE8DA";
        readonly "opaque": "rgba(242,240,231,0.6)";
      };
      readonly "text": {
        readonly "primary": "#3D0E18";
        readonly "secondary": "#82694C";
        readonly "inverted": "#F2F0E7";
        readonly "disabled": "#B8A77F";
      };
      readonly "button": {
        readonly "primary": "#511E29";
        readonly "primaryHover": "#3D0E18";
        readonly "disabled": "#D4CDB3";
      };
      readonly "stroke": {
        readonly "harsh": "#3D0E18";
        readonly "subtle": "#D4CDB3";
      };
      readonly "focus": "#FF6A3D";
    };
    readonly "burgendy-cream": {
      readonly "id": "dark-burgendy";
      readonly "label": "Burgendy / Cream";
      readonly "surface": {
        readonly "primary": "#3D0E18";
        readonly "secondary": "#511E29";
        readonly "opaque": "rgba(61,14,24,0.6)";
      };
      readonly "text": {
        readonly "primary": "#FF6A3D";
        readonly "secondary": "#E7BACA";
        readonly "inverted": "#3D0E18";
        readonly "disabled": "#983E53";
      };
      readonly "button": {
        readonly "primary": "#F2F0E7";
        readonly "primaryHover": "#D4CDB3";
        readonly "disabled": "#511E29";
      };
      readonly "stroke": {
        readonly "harsh": "#FF6A3D";
        readonly "subtle": "#511E29";
      };
      readonly "focus": "#FF6A3D";
    };
    readonly "grey": {
      readonly "id": "grey";
      readonly "label": "Grey";
      readonly "surface": {
        readonly "primary": "#D6DDDC";
        readonly "secondary": "#BBC6C5";
        readonly "opaque": "rgba(214,221,220,0.6)";
      };
      readonly "text": {
        readonly "primary": "#3D0E18";
        readonly "secondary": "#983E53";
        readonly "inverted": "#F2F0E7";
        readonly "disabled": "#738482";
      };
      readonly "button": {
        readonly "primary": "#511E29";
        readonly "primaryHover": "#3D0E18";
        readonly "disabled": "#919F9D";
      };
      readonly "stroke": {
        readonly "harsh": "#511E29";
        readonly "subtle": "#919F9D";
      };
      readonly "focus": "#FF6A3D";
    };
  };
};

export type ColorMode = "cream-plum" | "plum-cream" | "cream-burgendy" | "burgendy-cream" | "grey";

export declare function modeColors(mode: ColorMode): (typeof colors)["modes"][ColorMode];
