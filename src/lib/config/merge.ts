/**
 * Deep merge with explicit rules:
 * - Primitives: later wins
 * - Arrays: later replaces entirely (no concat)
 * - Objects: recurse and merge
 * - null/undefined in later: keeps earlier value (no accidental wipes)
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    // Skip null/undefined - keeps base value
    if (overrideValue === null || overrideValue === undefined) {
      continue;
    }

    // Arrays: replace entirely
    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as T[keyof T];
      continue;
    }

    // Objects: recurse
    if (
      typeof overrideValue === 'object' &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[keyof T];
      continue;
    }

    // Primitives: override wins
    result[key] = overrideValue as T[keyof T];
  }

  return result;
}
