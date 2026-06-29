import { PrismaClient } from '@prisma/client'
import { sanitizeForStorage } from './sanitize'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── HTML-CONTENT MODEL FIELDS ─────────────────────────────────────
// Models and their fields that contain user/admin-authored HTML content.
// These fields are auto-sanitized on every create/update to prevent XSS.
const HTML_FIELDS: Record<string, string[]> = {
  lecture: ['content'],
  mCQ: ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'],
  cQ: ['uddeepok', 'question1', 'question2', 'question3', 'question4', 'answer1', 'answer2', 'answer3', 'answer4'],
  suggestion: ['content'],
  notice: ['content'],
  banner: ['title', 'subtitle'],
  fAQ: ['question', 'answer'],
  testimonial: ['content'],
  exam: ['instructions'],
  siteSetting: ['value'],
}

const MODELS_WITH_HTML = new Set(Object.keys(HTML_FIELDS))

function sanitizeData(data: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    if (typeof data[field] === 'string') {
      data[field] = sanitizeForStorage(data[field])
    }
  }
}

const isProduction = process.env.NODE_ENV === 'production'

function createPrismaClient() {
  const client = new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
  })

  // ─── AUTO-SANITIZE HTML FIELDS ───
  // Intercepts all create/update/upsert operations to sanitize HTML content.
  // Prevents XSS at the data layer regardless of which route stores the content.
  client.$use(async (params, next) => {
    const model = params.model?.toLowerCase() || ''
    if (MODELS_WITH_HTML.has(model)) {
      const fields = HTML_FIELDS[model]
      const action = params.action

      if (action === 'create' || action === 'createMany') {
        const data = params.args.data
        if (data) {
          const items = Array.isArray(data) ? data : [data]
          for (const item of items) {
            sanitizeData(item, fields)
          }
        }
      }

      if (action === 'update') {
        const data = params.args.data
        if (data) {
          sanitizeData(data, fields)
        }
      }

      if (action === 'upsert') {
        const create = params.args.create
        const update = params.args.update
        if (create) sanitizeData(create, fields)
        if (update) sanitizeData(update, fields)
      }

      if (action === 'updateMany') {
        const data = params.args.data
        if (data) {
          sanitizeData(data, fields)
        }
      }
    }
    return next(params)
  })

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (!isProduction) globalForPrisma.prisma = db

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
