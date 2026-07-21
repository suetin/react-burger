const INGREDIENT_OVERLAY_KEY = 'stellarBurgerIngredientOverlay';

type TIngredientOverlayEntry = {
  backgroundPath: string;
  overlayPath: string;
};

export const saveIngredientOverlay = (
  overlayPath: string,
  backgroundPath: string
): void => {
  const entry: TIngredientOverlayEntry = { backgroundPath, overlayPath };
  sessionStorage.setItem(INGREDIENT_OVERLAY_KEY, JSON.stringify(entry));
};

export const clearIngredientOverlay = (): void => {
  sessionStorage.removeItem(INGREDIENT_OVERLAY_KEY);
};

export const getStoredIngredientBackground = (overlayPath: string): string | null => {
  try {
    const value = sessionStorage.getItem(INGREDIENT_OVERLAY_KEY);
    if (!value) return null;
    const entry = JSON.parse(value) as Partial<TIngredientOverlayEntry>;
    return entry.overlayPath === overlayPath && typeof entry.backgroundPath === 'string'
      ? entry.backgroundPath
      : null;
  } catch {
    clearIngredientOverlay();
    return null;
  }
};
