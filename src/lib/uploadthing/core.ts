import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { verifyAuth } from '@/lib/auth'

const f = createUploadthing()

function withErrorLog<T extends (...args: any[]) => any>(name: string, fn: T): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.catch((err) => {
          console.error(`[UploadThing] ${name} error:`, err)
          throw err
        })
      }
      return result
    } catch (err) {
      console.error(`[UploadThing] ${name} error:`, err)
      throw err
    }
  }) as T
}

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(
      withErrorLog('imageUploader.middleware', async () => {
        const auth = await verifyAuth()
        if (!auth?.user) throw new Error('Unauthorized')
        return { userId: auth.user.id }
      })
    )
    .onUploadComplete(
      withErrorLog('imageUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  pdfUploader: f({ pdf: { maxFileSize: '16MB', maxFileCount: 5 } })
    .middleware(
      withErrorLog('pdfUploader.middleware', async () => {
        const auth = await verifyAuth()
        if (!auth?.user) throw new Error('Unauthorized')
        return { userId: auth.user.id }
      })
    )
    .onUploadComplete(
      withErrorLog('pdfUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  mediaUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    video: { maxFileSize: '256MB', maxFileCount: 1 },
    audio: { maxFileSize: '64MB', maxFileCount: 1 },
  })
    .middleware(
      withErrorLog('mediaUploader.middleware', async () => {
        const auth = await verifyAuth()
        if (!auth?.user) throw new Error('Unauthorized')
        return { userId: auth.user.id }
      })
    )
    .onUploadComplete(
      withErrorLog('mediaUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  screenshotUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(
      withErrorLog('screenshotUploader.middleware', async () => {
        const auth = await verifyAuth()
        if (!auth?.user) throw new Error('Unauthorized')
        return { userId: auth.user.id }
      })
    )
    .onUploadComplete(
      withErrorLog('screenshotUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
