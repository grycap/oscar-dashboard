enum OscarColors {
  Green1 = "#B8CEB8",
  Green2 = "#9AB99A",
  Green3 = "#95B699",
  Green4 = "#009688",
  Blue = "#1F5FA6",
}

/**
 * @param color - hex color string
 * @param opacity - number between 0 and 1
 *
 * @returns color with opacity
 */
export function ColorWithOpacity(color: OscarColors | string, opacity: number) {
  return color + Math.round(255 * opacity).toString(16);
}

export default OscarColors;
