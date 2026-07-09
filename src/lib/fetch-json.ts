/**
 * Compatibility shim — re-exports fetchJSON from the canonical api-client.
 * Prefer importing directly from '@/lib/api-client' in new code.
 */
export { fetchJSON } from './api-client'
