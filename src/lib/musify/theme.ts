import type { ThemeMode } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r} ${g} ${bl})`;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode;
}

export function applyMusifyTheme(opts: {
  accent: string;
  mode: ThemeMode;
  pureBlack: boolean;
}) {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeMode(opts.mode);
  const accent = hexToRgb(opts.accent);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  const darkBg: [number, number, number] = opts.pureBlack
    ? [0, 0, 0]
    : [16, 20, 20];
  const isLight = resolved === "light";

  const primary = isLight ? mix(accent, black, 0.18) : mix(accent, white, 0.42);
  const onPrimary = relativeLuminance(hexToRgb(toHex(primary))) > 0.45 ? "#102221" : "#f4fffd";
  const primaryContainer = isLight
    ? mix(accent, white, 0.72)
    : mix(accent, black, 0.45);
  const onPrimaryContainer = isLight ? mix(accent, black, 0.45) : mix(accent, white, 0.78);
  const secondaryContainer = isLight
    ? mix(accent, white, 0.82)
    : mix(accent, darkBg, 0.55);

  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.pureBlack = opts.pureBlack ? "1" : "0";
  root.style.setProperty("--m-accent", opts.accent);
  root.style.setProperty("--m-primary", primary);
  root.style.setProperty("--m-on-primary", onPrimary);
  root.style.setProperty("--m-primary-container", primaryContainer);
  root.style.setProperty("--m-on-primary-container", onPrimaryContainer);
  root.style.setProperty("--m-secondary-container", secondaryContainer);
  root.style.setProperty(
    "--m-on-secondary-container",
    isLight ? mix(accent, black, 0.5) : mix(accent, white, 0.85),
  );
  root.style.setProperty("--m-theme-color", isLight ? "#f7f4f2" : toHex(mix(darkBg, [0, 0, 0], 0)));
}

function toHex(rgb: string): string {
  const m = rgb.match(/rgb\((\d+) (\d+) (\d+)\)/);
  if (!m) return "#80cbc4";
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
}
