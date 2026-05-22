/**
 * Escapes user input for safe use inside MongoDB `$regex` queries (ReDoS / injection hardening).
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
