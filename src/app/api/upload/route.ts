import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { verifyAuth } from '@/lib/auth'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: NextRequest) {
  try {
    // Verify authentication — only logged-in users can upload
    const auth = await verifyAuth(request)
    if (!auth || !auth.user) {
      return apiError('আপলোড করতে লগইন করুন', 401, 'UNAUTHORIZED')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('কোনো ফাইল পাওয়া যায়নি', 400)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError(`ফাইলের আকার ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB এর কম হতে হবে`, 400)
    }

    // Validate file type
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    if (!allowedTypes.includes(file.type)) {
      return apiError('শুধুমাত্র ছবি (JPEG, PNG, GIF, WebP, SVG) এবং PDF ফাইল আপলোড করুন', 400)
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

    // Write file to disk
    const filePath = path.join(UPLOAD_DIR, uniqueName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Return the relative path — the frontend's getFileUrl() will resolve it
    // to an absolute URL using the current domain.
    const url = `/uploads/${uniqueName}`

    return NextResponse.json({ url, success: true })
  } catch (error) {
    return handleApiError(error, 'Upload error')
  }
}
