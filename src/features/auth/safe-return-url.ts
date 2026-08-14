/**
 * Open-redirect guard: only allow same-origin relative paths. Rejects absolute
 * URLs and protocol-relative (`//host`, `/\host`) values, falling back to '/'.
 */
export function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  return raw
}
