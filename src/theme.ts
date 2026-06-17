import type { Settings } from "./types";

export interface Palette {
  bg: string; ink: string; muted: string; border: string;
  panel: string; empty: string; overlay: string;
}
export interface GradeColors { green: string; yellow: string; gray: string }

export function palette(dark: boolean): Palette {
  return dark
    ? { bg: "#121213", ink: "#ffffff", muted: "#818384", border: "#3a3a3c", panel: "#1e1e1f", empty: "#3a3a3c", overlay: "rgba(0,0,0,.6)" }
    : { bg: "#ffffff", ink: "#1a1a1b", muted: "#787c7e", border: "#d3d6da", panel: "#f6f7f8", empty: "#d3d6da", overlay: "rgba(0,0,0,.4)" };
}

export function gradeColors({ dark, colorblind }: Settings): GradeColors {
  return {
    green: colorblind ? "#f5793a" : dark ? "#538d4e" : "#6aaa64",
    yellow: colorblind ? "#85c0f9" : dark ? "#b59f3b" : "#c9b458",
    gray: dark ? "#3a3a3c" : "#787c7e",
  };
}
