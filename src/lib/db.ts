import "server-only"

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { sanitizeForStorage } from './sanitize'

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

const HTML_FIELDS: Record<string, string[]> = {
  lecture: ['content'],
  mcq: ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'],
  cq: ['uddeepok', 'question1', 'question2', 'question3', 'question4', 'answer1', 'answer2', 'answer3', 'answer4'],
  suggestion: ['content'],
  notice: ['content'],
  banner: ['title', 'subtitle'],
  faq: ['question', 'answer'],
  testimonial: ['content'],
  exam: ['instructions'],
  sitesetting: ['value'],
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
  const adapter = new PrismaPg(process.env.DATABASE_URL!, {
    max: 20,
  })
  const client = new PrismaClient({
    adapter,
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
  })

  const xclient = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, args: queryArgs, query }) {
          const modelName = model?.toLowerCase() || ''
          if (MODELS_WITH_HTML.has(modelName)) {
            const fields = HTML_FIELDS[modelName]
            const data = (queryArgs as Record<string, unknown>).data
            if (data) {
              const items = Array.isArray(data) ? data : [data]
              for (const item of items) {
                sanitizeData(item as Record<string, unknown>, fields)
              }
            }
          }
          return query(queryArgs as never)
        },
      },
    },
  })

  return xclient
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (!isProduction) globalForPrisma.prisma = db

if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
