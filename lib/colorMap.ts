// src/lib/colorMap.ts

export type UiLanguage = "es" | "en";

const colorMap: Record<string, { es: string; en: string }> = {
  black: { es: "Negro", en: "Black" },
  white: { es: "Blanco", en: "White" },
  pink: { es: "Rosa", en: "Pink" },
  blue: { es: "Azul", en: "Blue" },
  red: { es: "Rojo", en: "Red" },
  green: { es: "Verde", en: "Green" },
  purple: { es: "Morado", en: "Purple" },
  brown: { es: "Café", en: "Brown" },
  yellow: { es: "Amarillo", en: "Yellow" },
  gray: { es: "Gris", en: "Gray" },
  navy: { es: "Azul marino", en: "Navy" },
  beige: { es: "Beige", en: "Beige" },
  multicolor: { es: "Multicolor", en: "Multicolor" },
};

export function translateColor(
  rawColor: string | null | undefined,
  lang: UiLanguage
): string {
  if (!rawColor) return "";

  const key = rawColor.toLowerCase().trim();

  const mapped = colorMap[key];
  if (!mapped) {
    // Fallback: return original value if it's not in our map yet
    return rawColor;
  }

  return mapped[lang];
}
