'use client'

import { Crown, Check, ArrowRight, Sparkles, Package, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { usePremiumPrices } from '@/hooks/use-home-data'

function formatBengaliPrice(amount: number): string {
  return new Intl.NumberFormat('bn-BD').format(amount)
}

const defaultFeatures = ['প্রিমিয়াম লেকচার ও কোর্স', 'বিস্তারিত MCQ ব্যাখ্যা', 'সৃজনশীল প্রশ্নের সমাধান', 'বিশেষ সাজেশন ও গাইড', 'সকল বোর্ড প্রশ্ন সমাধান']

export default function PremiumBanner() {
  const { navigate } = useRouterStore()
  const { config } = useSiteConfig()
  const { data: prices } = usePremiumPrices()
  const minContentPrice = prices?.minContentPrice ?? null
  const minBundlePrice = prices?.minBundlePrice ?? null
  const features = config?.premiumFeatures?.length ? config.premiumFeatures : defaultFeatures

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Golden gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600" />
      <div className="absolute inset-0 premium-shimmer" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="animate-fade-in-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium uppercase tracking-wider">Premium</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {config?.homepagePremiumTitle || 'প্রিমিয়াম কন্টেন্ট'}
            </h2>

            <p className="text-white/85 text-lg mb-6">
              {config?.homepagePremiumSubtitle || 'প্রতিটি কন্টেন্ট আলাদাভাবে কিনুন অথবা বান্ডেলে আকর্ষণীয় ছাড়ে পান!'}
            </p>

            {/* Features - generic, not hardcoded */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-white animate-fade-in-left"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="bg-white text-amber-700 hover:bg-white/90 font-semibold text-lg px-8 shadow-lg"
              onClick={() => navigate('premium')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              বান্ডেল দেখুন
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          {/* Right - Info cards */}
          <div className="flex flex-col gap-4 animate-fade-in-right">
            <div
              className="relative p-6 rounded-xl backdrop-blur-sm border bg-white/25 border-white/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
              onClick={() => navigate('premium')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">একক কন্টেন্ট</h3>
              </div>
              <p className="text-white/85 text-sm mb-2">
                যে কন্টেন্ট দরকার শুধু সেটাই কিনুন
              </p>
              {minContentPrice != null && minContentPrice > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/70">প্রতিটি</span>
                  <span className="text-2xl font-bold text-white">৳{formatBengaliPrice(minContentPrice)}</span>
                  <span className="text-sm text-white/70">থেকে</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/70">সাশ্রয়ী মূল্যে</span>
                </div>
              )}
            </div>

            <div
              className="relative p-6 rounded-xl backdrop-blur-sm border bg-white/10 border-white/20 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
              onClick={() => navigate('premium')}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                সাশ্রয়ী
              </span>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">কন্টেন্ট বান্ডেল</h3>
              </div>
              <p className="text-white/85 text-sm mb-2">
                একাধিক কন্টেন্ট একসাথে কিনুন এবং পান বিশেষ ছাড়!
              </p>
              {minBundlePrice != null && minBundlePrice > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/70">মাত্র</span>
                  <span className="text-2xl font-bold text-white">৳{formatBengaliPrice(minBundlePrice)}</span>
                  <span className="text-sm text-white/70">থেকে</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/70">বিশেষ ছাড়ে</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
