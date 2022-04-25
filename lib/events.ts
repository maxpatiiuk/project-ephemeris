/**
 * A super basic event implementation.
 *
 * Can't use new EventTarget() because it causes build erros, as that API is
 * present in browsers only, not in Node.JS
 */

export function eventTarget() {
  const listeners = new Set<() => void>();
  return {
    listen(callback: () => void) {
      listeners.add(callback);
      return (): void => void listeners.delete(callback);
    },
    trigger: () => listeners.forEach((listener) => listener()),
  };
}
