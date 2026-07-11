export interface BundleItem {
  id: string
  bundleId: string
  contentType: string
  contentId: string
  order: number
  contentTitle: string | null
  contentPrice: number
  contentThumbnail: string | null
  contentMeta?: Record<string, unknown> | null
}

export interface Bundle {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  discount: number
  classLevel: string | null
  board: string | null
  year: string | null
  type: string
  itemCount: number
  items: BundleItem[]
  order: number
  createdAt: string
}

export interface ContentPackage {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  duration: number
  durationLabel: string
  classLevel: string | null
  isActive: boolean
  order: number
  mcqCount: number
  cqCount: number
  lectureCount: number
  totalContent: number
}
