'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Home,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  Crown,
  LayoutDashboard,
  Lightbulb,
  User,
  type LucideIcon,
} from 'lucide-react'

// ============ Icon Map ============

const iconMap: Record<string, LucideIcon> = {
  Home,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  Crown,
  LayoutDashboard,
  Lightbulb,
  User,
}

// ============ Types ============

export interface NavItem {
  id: string
  label: string
  route: string
  icon: string
  location: 'header' | 'footer' | 'bottomNav'
  order: number
  isAuthOnly: boolean
  isAdminOnly: boolean
  isActive: boolean
}

export interface NavItemWithIcon extends NavItem {
  Icon: LucideIcon
}

// ============ Default Navigation Fallback ============

const defaultNavItems: NavItemWithIcon[] = [
  // Header
  { id: 'h1', label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Home },
  { id: 'h2', label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: GraduationCap },
  { id: 'h3', label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: ClipboardCheck },
  { id: 'h4', label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: BookOpen },
  { id: 'h5', label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 5, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: BookOpen },
  { id: 'h6', label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 6, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Megaphone },
  { id: 'h7', label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 7, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Crown },
  { id: 'h8', label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 8, isAuthOnly: false, isAdminOnly: true, isActive: true, Icon: LayoutDashboard },

  // Bottom Nav
  { id: 'b1', label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Home },
  { id: 'b2', label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: BookOpen },
  { id: 'b3', label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: ClipboardCheck },
  { id: 'b4', label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Lightbulb },
  { id: 'b5', label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true, isAdminOnly: false, isActive: true, Icon: User },

  // Footer
  { id: 'f1', label: 'হোম', route: 'home', icon: 'Home', location: 'footer', order: 1, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Home },
  { id: 'f2', label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: GraduationCap },
  { id: 'f3', label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: BookOpen },
  { id: 'f4', label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4, isAuthOnly: false, isAdminOnly: false, isActive: true, Icon: Crown },
]

// ============ Helper ============

function resolveIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || BookOpen
}

// ============ Hook ============

export function useNavigation() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/navigation')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch navigation')
        return res.json()
      })
      .then((data) => {
        const navItems = data.items || []
        if (navItems.length > 0) {
          setItems(navItems)
        }
        // If empty, we keep the fallback via useMemo below
        setLoading(false)
      })
      .catch(() => {
        // On error, use fallback (already in defaultNavItems via useMemo)
        setLoading(false)
      })
  }, [])

  // Merge DB items with icon resolution, or use defaults
  const enrichedItems: NavItemWithIcon[] = useMemo(() => {
    if (items.length > 0) {
      return items.map((item) => ({
        ...item,
        location: item.location as 'header' | 'footer' | 'bottomNav',
        Icon: resolveIcon(item.icon),
      }))
    }
    return defaultNavItems
  }, [items])

  const headerNav = useMemo(
    () => enrichedItems.filter((item) => item.location === 'header').sort((a, b) => a.order - b.order),
    [enrichedItems]
  )

  const bottomNav = useMemo(
    () => enrichedItems.filter((item) => item.location === 'bottomNav').sort((a, b) => a.order - b.order),
    [enrichedItems]
  )

  const footerNav = useMemo(
    () => enrichedItems.filter((item) => item.location === 'footer').sort((a, b) => a.order - b.order),
    [enrichedItems]
  )

  return { items, headerNav, bottomNav, footerNav, loading }
}
