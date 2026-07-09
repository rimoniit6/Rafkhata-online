import {
  generateUploadButton,
  generateUploadDropzone,
  generateUploader,
  generateReactHelpers,
} from '@uploadthing/react'
import type { UploadRouter } from './core'

export const UploadButton = generateUploadButton<UploadRouter>()
export const UploadDropzone = generateUploadDropzone<UploadRouter>()
export const Uploader = generateUploader<UploadRouter>()
export const { useUploadThing } = generateReactHelpers<UploadRouter>()
