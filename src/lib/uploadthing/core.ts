import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  pdfUploader: f({ pdf: { maxFileSize: '16MB', maxFileCount: 5 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),

  mediaUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    video: { maxFileSize: '256MB', maxFileCount: 1 },
    audio: { maxFileSize: '64MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
