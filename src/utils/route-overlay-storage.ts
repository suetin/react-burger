const ROUTE_OVERLAY_KEY = 'stellarBurgerRouteOverlay';

export type TRouteOverlayKind = 'feed-order' | 'ingredient' | 'profile-order';

export type TRouteOverlayEntry = {
  backgroundPath: string;
  kind: TRouteOverlayKind;
  overlayPath: string;
};

type TRouteOverlayRule = {
  backgroundPath: string;
  kind: TRouteOverlayKind;
  overlayPattern: RegExp;
};

const ROUTE_OVERLAY_RULES: readonly TRouteOverlayRule[] = [
  {
    backgroundPath: '/',
    kind: 'ingredient',
    overlayPattern: /^\/ingredients\/[A-Za-z0-9][A-Za-z0-9_-]*$/,
  },
  {
    backgroundPath: '/feed',
    kind: 'feed-order',
    overlayPattern: /^\/feed\/[A-Za-z0-9][A-Za-z0-9_-]*$/,
  },
  {
    backgroundPath: '/profile/orders',
    kind: 'profile-order',
    overlayPattern: /^\/profile\/orders\/[A-Za-z0-9][A-Za-z0-9_-]*$/,
  },
];

const getRouteOverlayRule = (
  overlayPath: string,
  backgroundPath: string
): TRouteOverlayRule | undefined =>
  ROUTE_OVERLAY_RULES.find(
    (rule) =>
      rule.backgroundPath === backgroundPath && rule.overlayPattern.test(overlayPath)
  );

const isRouteOverlayEntry = (value: unknown): value is TRouteOverlayEntry => {
  if (typeof value !== 'object' || value === null) return false;

  const keys = Object.keys(value);
  if (
    keys.length !== 3 ||
    !keys.includes('backgroundPath') ||
    !keys.includes('kind') ||
    !keys.includes('overlayPath')
  ) {
    return false;
  }

  const entry = value as Partial<TRouteOverlayEntry>;
  if (
    typeof entry.backgroundPath !== 'string' ||
    typeof entry.kind !== 'string' ||
    typeof entry.overlayPath !== 'string'
  ) {
    return false;
  }

  const rule = getRouteOverlayRule(entry.overlayPath, entry.backgroundPath);
  return rule?.kind === entry.kind;
};

export const isAllowedRouteOverlayPair = (
  overlayPath: string,
  backgroundPath: string
): boolean => getRouteOverlayRule(overlayPath, backgroundPath) !== undefined;

export const saveRouteOverlay = (overlayPath: string, backgroundPath: string): void => {
  const rule = getRouteOverlayRule(overlayPath, backgroundPath);
  if (!rule) {
    clearRouteOverlay();
    return;
  }

  const entry: TRouteOverlayEntry = {
    backgroundPath,
    kind: rule.kind,
    overlayPath,
  };
  sessionStorage.setItem(ROUTE_OVERLAY_KEY, JSON.stringify(entry));
};

export const clearRouteOverlay = (): void => {
  sessionStorage.removeItem(ROUTE_OVERLAY_KEY);
};

export const getStoredRouteOverlay = (
  overlayPath: string
): TRouteOverlayEntry | null => {
  try {
    const value = sessionStorage.getItem(ROUTE_OVERLAY_KEY);
    if (value === null) return null;
    if (value.length === 0) {
      clearRouteOverlay();
      return null;
    }

    const entry: unknown = JSON.parse(value);
    if (!isRouteOverlayEntry(entry) || entry.overlayPath !== overlayPath) {
      clearRouteOverlay();
      return null;
    }

    return entry;
  } catch {
    clearRouteOverlay();
    return null;
  }
};
