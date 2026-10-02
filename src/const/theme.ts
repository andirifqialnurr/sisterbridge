export const theme = {
  sidebar: {
    light: {
      hover: "hsl(142 52% 94%)",
      hoverText: "hsl(142 72% 23%)",
      selected: "hsl(142 72% 23%)",
      selectedText: "hsl(0 0% 100%)",
    },
    dark: {
      hover: "hsl(142 40% 28%)",
      hoverText: "hsl(140 30% 98%)",
      selected: "hsl(142 60% 17%)",
      selectedText: "hsl(140 30% 98%)",
    },
  },
  colors: {
    primary: "hsl(142 76% 30%)",
    primaryStrong: "hsl(142 72% 23%)",
    primarySoft: "hsl(142 52% 94%)",
    canvas: "hsl(144 25% 97%)",
    surface: "hsl(0 0% 100%)",
    border: "hsl(145 18% 86%)",
    text: "hsl(150 18% 15%)",
    muted: "hsl(150 8% 43%)",
    success: "hsl(142 71% 35%)",
    warning: "hsl(38 92% 42%)",
    danger: "hsl(0 72% 51%)",
    info: "hsl(199 89% 38%)",
  },
  chart: [
    "hsl(142 76% 30%)",
    "hsl(160 64% 38%)",
    "hsl(82 55% 43%)",
    "hsl(38 92% 42%)",
    "hsl(199 89% 38%)",
  ],
  // Validated with the dataviz palette checker against the app surfaces
  // (light #ffffff, dark #12211a): categorical passes lightness, chroma, CVD
  // (all-pairs, worst ΔE 9.2) and normal-vision gates in both modes; slot 3
  // in light is <3:1, so every chart ships a legend and a table view. The
  // brand green is kept for single-series (sequential) marks only: next to
  // orange it fails colour-blind separation. A green/red "memenuhi/tidak"
  // pair also fails (deutan ΔE 4.1), so two-way splits use slots 1-2.
  chartPalette: {
    light: {
      categorical: ["#2a78d6", "#eb6834", "#1baf7a"],
      sequential: "#12873d",
      surface: "#ffffff",
      grid: "#e3ebe6",
      text: "hsl(150 18% 15%)",
      muted: "hsl(150 8% 43%)",
    },
    dark: {
      categorical: ["#3987e5", "#d95926", "#199e70"],
      sequential: "#23a653",
      surface: "#12211a",
      grid: "#24392f",
      text: "hsl(140 30% 98%)",
      muted: "hsl(145 16% 65%)",
    },
  },
  typography: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
} as const;

export type Theme = typeof theme;
