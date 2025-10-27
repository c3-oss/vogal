// 3rd-party
import _ from 'lodash'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Normalize a filename to ASCII-only and make it filesystem/URL friendly.
 * - Trims leading/trailing whitespace
 * - Removes diacritics (accents) using lodash.deburr
 * - Replaces any non-alphanumeric sequences with a single hyphen
 * - Collapses multiple hyphens and trims hyphens at the ends
 * - Preserves extension (sanitized to [A-Za-z0-9])
 */
export function normalizeFilename(original: string): string {
  const trimmed = (original ?? '').trim()
  if (trimmed.length === 0) {
    return 'file'
  }

  const lastDotIndex = trimmed.lastIndexOf('.')
  const hasExt = lastDotIndex > 0 && lastDotIndex < trimmed.length - 1
  const base = hasExt ? trimmed.slice(0, lastDotIndex) : trimmed
  const ext = hasExt ? trimmed.slice(lastDotIndex + 1) : ''

  // Remove diacritics and convert to ASCII-friendly slug
  const deburredBase = _.deburr(base)
  let safeBase = deburredBase.replace(/[^A-Za-z0-9]+/g, '-') // non-alnum -> '-'
  safeBase = safeBase.replace(/-+/g, '-') // collapse multiple '-'
  safeBase = safeBase.replace(/^-+|-+$/g, '') // trim leading/trailing '-'

  // Fallback if base fully sanitized away
  if (safeBase.length === 0) {
    safeBase = 'file'
  }

  // Sanitize extension to alnum characters only, lowercase it for consistency
  const safeExt = ext.replace(/[^A-Za-z0-9]+/g, '').toLowerCase()

  // Guard overall length (common filesystem limit ~255 bytes)
  // Keep room for dot + extension if present
  const maxBaseLen = safeExt ? 255 - (safeExt.length + 1) : 255
  const finalBase = safeBase.slice(0, Math.max(1, maxBaseLen))

  return safeExt ? `${finalBase}.${safeExt}` : finalBase
}
