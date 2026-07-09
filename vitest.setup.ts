import { vi } from 'vitest'

// Mock 'server-only' package — it throws at import time in non-Next.js contexts.
// In tests we just need it to be a no-op.
vi.mock('server-only', () => ({}))
