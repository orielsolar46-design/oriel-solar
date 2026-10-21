'use client';

import * as React from 'react';

/**
 * Minimal basket state for the storefront (Stage 3). Persists to localStorage
 * so a phone dying mid-browse keeps the basket; the server-side cart record
 * and checkout arrive with Stage 6. Prices are NOT stored here — the server
 * recalculates everything at order time (MASTERPLAN 10.3).
 */

export type CartLine = {
  slug: string;
  name: string;
  modelCode: string | null;
  image: string | null;
  quantity: number;
  withInstallation: boolean;
};

/**
 * Where the order is going. Captured in the basket so the buyer says it once,
 * and read back as the default at checkout. County is the dropdown; `place`
 * is whatever they call the spot — an estate, a stage, a shop name.
 */
export type CartDestination = {
  county: string;
  place: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  destination: CartDestination;
  setDestination: (next: Partial<CartDestination>) => void;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  remove: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'oriel-basket-v1';
const DESTINATION_KEY = 'oriel-destination-v1';
const EMPTY_DESTINATION: CartDestination = { county: '', place: '' };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [destination, setDestinationState] =
    React.useState<CartDestination>(EMPTY_DESTINATION);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setLines(JSON.parse(stored));
      const dest = window.localStorage.getItem(DESTINATION_KEY);
      if (dest) setDestinationState({ ...EMPTY_DESTINATION, ...JSON.parse(dest) });
    } catch {
      // Corrupt or unavailable storage — start with an empty basket.
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      window.localStorage.setItem(DESTINATION_KEY, JSON.stringify(destination));
    } catch {
      // Storage full or blocked — the in-memory basket still works.
    }
  }, [lines, destination, hydrated]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      destination,
      setDestination: (next) => setDestinationState((prev) => ({ ...prev, ...next })),
      add: (line, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.slug === line.slug);
          if (existing) {
            return prev.map((l) =>
              l.slug === line.slug ? { ...l, quantity: l.quantity + quantity } : l
            );
          }
          return [...prev, { ...line, quantity }];
        }),
      remove: (slug) => setLines((prev) => prev.filter((l) => l.slug !== slug)),
      setQuantity: (slug, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.slug !== slug)
            : prev.map((l) => (l.slug === slug ? { ...l, quantity } : l))
        ),
      // The destination survives a cleared basket — it is where the buyer is,
      // not what they were buying.
      clear: () => setLines([]),
    }),
    [lines, destination]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
