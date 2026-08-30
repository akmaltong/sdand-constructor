/**
 * Normalizes a raw string into a slug:
 * - lowercase
 * - spaces → hyphen
 * - strip non [a-z0-9-]
 * - collapse consecutive hyphens
 * - trim hyphens from ends
 * - enforce ≤ 64 chars
 *
 * Throws if the result is empty.
 */
export declare function sanitizeSlug(raw: string): string;
/**
 * Checks if a string is already a valid slug (no sanitization performed).
 */
export declare function isValidSlug(s: string): boolean;
/**
 * Generates a fresh 12-char lowercase alphanumeric slug using crypto randomness.
 */
export declare function generateSlug(): string;
//# sourceMappingURL=slug.d.ts.map