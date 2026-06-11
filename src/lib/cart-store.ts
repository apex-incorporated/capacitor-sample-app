/**
 * Apex Outfitters — cart state.
 *
 * Hand-rolled subscriber pattern (no Zustand / Redux) keeps the
 * sample app dependency-light. Cart persists across launches via
 * localStorage; clears after a successful purchase.
 *
 * AO-P3 wires cart mutations to fire the appropriate Apex events:
 *   - add_to_cart on addItem
 *   - cart_view when the Cart screen mounts
 *   - checkout_started when the user proceeds to checkout
 *   - purchase on order confirmation
 */

import { useEffect, useState } from "react";
import { getProduct } from "./catalog";

const STORAGE_KEY = "apex_outfitters.cart_v1";

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartState {
  items: CartItem[];
}

const EMPTY: CartState = { items: [] };

let cached: CartState | null = null;
const listeners = new Set<(state: CartState) => void>();

function readFromStorage(): CartState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as CartState;
  } catch {
    return EMPTY;
  }
}

function writeToStorage(state: CartState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fail — in-memory cart still works.
  }
}

function get(): CartState {
  if (cached) return cached;
  cached = readFromStorage();
  return cached;
}

function set(next: CartState): void {
  cached = next;
  writeToStorage(next);
  for (const fn of listeners) fn(next);
}

// ─── Public API ─────────────────────────────────────────────────────

export function getCart(): CartState {
  return get();
}

export function addToCart(item: CartItem): void {
  const current = get();
  // Merge identical (productId, size, color) entries.
  const existing = current.items.findIndex(
    (i) =>
      i.productId === item.productId &&
      i.size === item.size &&
      i.color === item.color,
  );
  if (existing >= 0) {
    const next = [...current.items];
    next[existing] = {
      ...next[existing],
      quantity: next[existing].quantity + item.quantity,
    };
    set({ items: next });
  } else {
    set({ items: [...current.items, item] });
  }
}

export function removeFromCart(productId: string, size?: string, color?: string): void {
  const current = get();
  set({
    items: current.items.filter(
      (i) => !(i.productId === productId && i.size === size && i.color === color),
    ),
  });
}

export function updateQuantity(
  productId: string,
  size: string | undefined,
  color: string | undefined,
  quantity: number,
): void {
  const current = get();
  if (quantity <= 0) {
    removeFromCart(productId, size, color);
    return;
  }
  set({
    items: current.items.map((i) =>
      i.productId === productId && i.size === size && i.color === color
        ? { ...i, quantity }
        : i,
    ),
  });
}

export function clearCart(): void {
  set(EMPTY);
}

// ─── Derived state ──────────────────────────────────────────────────

export function getCartSubtotal(items?: CartItem[]): number {
  const list = items ?? get().items;
  return list.reduce((total, item) => {
    const product = getProduct(item.productId);
    if (!product) return total;
    return total + product.priceUsd * item.quantity;
  }, 0);
}

export function getCartItemCount(items?: CartItem[]): number {
  const list = items ?? get().items;
  return list.reduce((total, item) => total + item.quantity, 0);
}

/** React hook — subscribes to cart updates. */
export function useCart(): CartState {
  const [state, setState] = useState<CartState>(get);
  useEffect(() => {
    const listener = (s: CartState) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}
