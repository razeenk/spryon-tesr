/**
 * Generates a RFC4122 v4 compliant UUID.
 * Uses crypto.randomUUID() if available, otherwise falls back to a Math.random based implementation.
 * This ensures compatibility with older mobile browsers or non-secure contexts.
 */
export function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID is defined but fails (rare)
    }
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
