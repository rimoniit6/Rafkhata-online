'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Search, Menu, X, Sun, Moon, User, GraduationCap, LogIn, LogOut, LayoutDashboard, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useNavigation } from '@/hooks/use-navigation'
import Image from 'next/image'

const getUserInitials = (name: string) =>
  name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const { currentRoute, navigate } = useRouterStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { config } = useSiteConfig()
  const { headerNav } = useNavigation()

  const siteName = config?.siteName || 'শিক্ষা বাংলা'
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'
  const isDark = theme === 'dark'

  useEffect(() => {
    let frameId: number
    const handleScroll = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => setScrolled(window.scrollY > 10))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => { window.removeEventListener('scroll', handleScroll); cancelAnimationFrame(frameId) }
  }, [])

  const handleNavClick = useCallback((route: string) => {
    const params = route === 'class-list' ? { scrollTarget: 'class-categories' } : undefined
    navigate(route as any, params)
  }, [navigate])

  const handleLogout = useCallback(() => { logout(); navigate('home') }, [logout, navigate])

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) { navigate('search', { searchQuery: searchQuery.trim() }); setSearchOpen(false) }
  }, [searchQuery, navigate])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }, [handleSearch])

  const visibleNav = useMemo(() =>
    headerNav.filter(item => {
      if (item.isAdminOnly && !isAdmin) return false
      if (item.isAuthOnly && !isAuthenticated) return false
      return true
    }), [headerNav, isAdmin, isAuthenticated])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/5 bg-background/95 backdrop-blur-md' : 'bg-background/80 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('home')} suppressHydrationWarning>
            {config?.logo ? (
              <Image src={config.logo} alt={siteName} width={36} height={36} className="w-9 h-9 rounded-lg object-contain" />
            ) : (
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-edu-primary to-edu-primary-dark text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <span className="text-lg font-bold leading-tight text-foreground">{siteName}</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((link) => {
              const isActive = currentRoute === link.route
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.route)}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-edu-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {link.label}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-edu-primary rounded-full" />}
                </button>
              )
            })}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="কোর্স, অধ্যায় খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-4 h-9 bg-muted/50 border-transparent focus:border-edu-primary/30 focus:bg-background transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search Toggle - Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Menu / Login */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-transparent hover:border-edu-primary/50 transition-colors">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-edu-primary/10 text-edu-primary text-xs font-semibold">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.isPremium && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-edu-premium rounded-full border-2 border-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-edu-primary/10 text-edu-primary text-xs">{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('user-dashboard')}>
                    <User className="mr-2 h-4 w-4" /> প্রোফাইল
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('premium')}>
                    <Crown className="mr-2 h-4 w-4 text-edu-premium" /> প্রিমিয়াম
                    {user.isPremium && <Badge className="ml-auto bg-edu-premium/10 text-edu-premium border-0 text-[10px] px-1.5">সক্রিয়</Badge>}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('admin-dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> এডমিন প্যানেল
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> লগ আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate('login')}
                className="hidden sm:flex bg-edu-primary hover:bg-edu-primary-dark text-white gap-1.5"
                size="sm"
              >
                <LogIn className="w-4 h-4" /> লগইন
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2" suppressHydrationWarning>
                    {config?.logo ? (
                      <Image src={config.logo} alt={siteName} width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-edu-primary to-edu-primary-dark text-white">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                    )}
                    {siteName}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-4 mt-4">
                  {visibleNav.map((link) => {
                    const isActive = currentRoute === link.route
                    return (
                      <SheetClose asChild key={link.id}>
                        <button
                          onClick={() => handleNavClick(link.route)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive ? 'bg-edu-primary/10 text-edu-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          <link.Icon className="w-4 h-4" />
                          {link.label}
                        </button>
                      </SheetClose>
                    )
                  })}
                </div>
                <div className="mt-auto px-4 pb-4">
                  {isAuthenticated && user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-edu-primary/10 text-edu-primary text-xs">{getUserInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
                          <LogOut className="w-4 h-4" /> লগ আউট
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Button className="w-full bg-edu-primary hover:bg-edu-primary-dark text-white gap-2" onClick={() => navigate('login')}>
                        <LogIn className="w-4 h-4" /> লগইন করুন
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="কোর্স, অধ্যায় খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-4 bg-muted/50 border-transparent focus:border-edu-primary/30"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
