'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Youtube,
  MessageCircle,
  ExternalLink,
  Heart,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useRouterStore, type RoutePath } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useNavigation } from '@/hooks/use-navigation'
import { getMessages } from '@/lib/messages'
import Image from 'next/image'

export default function Footer() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const { navigate } = useRouterStore()
  const { config } = useSiteConfig()
  const { classOptions } = useHierarchyMetadata()
  const { footerNav } = useNavigation()
  const msg = getMessages(config?.messages)

  const siteName = config?.siteName || 'শিক্ষা বাংলা'

  const classLinks = classOptions.map((c) => ({
    label: c.label,
    route: 'class-detail' as const,
    params: { classSlug: c.value },
  }))

  const contactInfo = [
    ...(config?.contactEmail ? [{ icon: Mail, label: config.contactEmail, href: `mailto:${config.contactEmail}` }] : []),
    ...(config?.contactPhone ? [{ icon: Phone, label: config.contactPhone, href: `tel:${config.contactPhone}` }] : []),
    ...(config?.contactAddress ? [{ icon: MapPin, label: config.contactAddress, href: '#' }] : []),
  ]

  const finalContactInfo = contactInfo

  const socialLinks = [
    ...(config?.facebook ? [{ icon: Facebook, label: 'Facebook', href: config.facebook }] : []),
    ...(config?.youtube ? [{ icon: Youtube, label: 'YouTube', href: config.youtube }] : []),
    ...(config?.telegram ? [{ icon: MessageCircle, label: 'Telegram', href: config.telegram }] : []),
  ]

  return (
    <footer className="bg-gradient-to-b from-muted/50 to-muted border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <motion.div
              className="flex items-center gap-2 cursor-pointer mb-4"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('home')}
            >
              {config?.logo ? (
                <Image
                  src={config.logo}
                  alt={siteName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-edu-primary to-edu-primary-dark text-white shadow-md">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground">{siteName}</h3>
            </motion.div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs" suppressHydrationWarning>
              {config?.footerDescription || config?.siteDescription || 'শিক্ষার্থীদের জন্য অনলাইন শিক্ষা প্ল্যাটফর্ম।'}
            </p>
            {/* Social Links */}
            {socialLinks.length > 0 && mounted && (
              <div className="flex items-center gap-3 mt-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border hover:border-edu-primary/30 hover:text-edu-primary text-muted-foreground transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="sr-only">{social.label}</span>
                    </motion.a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-2.5">
              {footerNav.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => navigate(link.route as RoutePath)}
                    className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Class Links */}
          {classLinks.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">শ্রেণিসমূহ</h4>
              <ul className="space-y-2.5">
                {classLinks.map((link, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => navigate(link.route, link.params)}
                      className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-center gap-1.5 group"
                    >
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">শ্রেণিসমূহ</h4>
              <p className="text-sm text-muted-foreground italic">{msg.footerClassesSoon}</p>
            </div>
          )}

          {/* Contact Info */}
          {finalContactInfo.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">যোগাযোগ</h4>
              <ul className="space-y-3">
                {finalContactInfo.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <li key={idx}>
                      <a
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">যোগাযোগ</h4>
              <p className="text-sm text-muted-foreground italic">{msg.footerContactSoon}</p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <Separator />
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-edu-primary transition-colors">
              প্রাইভেসি পলিসি
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-edu-primary transition-colors">
              শর্তাবলী
            </a>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            ভালোবাসায় তৈরি <Heart className="w-3 h-3 text-red-500 fill-red-500" /> বাংলাদেশ থেকে
          </p>
        </div>
      </div>
    </footer>
  )
}
