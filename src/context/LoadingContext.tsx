'use client'

import { createContext } from 'react'
import type { LoadingContextType } from '@/types/loading'

export const LoadingContext = createContext<LoadingContextType | null>(null)
