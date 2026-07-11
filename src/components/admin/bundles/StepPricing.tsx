import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import React from 'react'
import {
  AlertCircle,
  IndianRupee,
  Percent,
  Power,
  Save,
  ShoppingCart,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import type { SelectedContentItem } from './types'

export interface StepPricingProps {
  selectedItems: SelectedContentItem[]
  formPrice: string
  setFormPrice: (v: string) => void
  formOrder: string
  setFormOrder: (v: string) => void
  formIsActive: boolean
  setFormIsActive: (v: boolean) => void
  formTitle: string
  editId: string | null
  saving: boolean
  handleSave: () => void
  calculateOriginalPrice: () => number
  calculateDiscount: () => number
  getIcon: (type: string) => LucideIcon
  getLabel: (type: string) => string
  getTextColor: (type: string) => string
}

export default function StepPricing({
  selectedItems, formPrice, setFormPrice, formOrder, setFormOrder,
  formIsActive, setFormIsActive, formTitle, editId, saving, handleSave,
  calculateOriginalPrice, calculateDiscount, getIcon, getLabel, getTextColor,
}: StepPricingProps) {
  const originalPrice = calculateOriginalPrice()
  const bundlePrice = parseFloat(formPrice) || 0
  const discount = calculateDiscount()
  const isValid = formTitle && selectedItems.length > 0

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-4 py-3 border-b border-border/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Tag className="h-4 w-4 text-amber-600" /> মূল্য ও প্রকাশ
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">বান্ডেলের মূল্য নির্ধারণ করুন ও প্রকাশ করুন</p>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-2xl font-bold text-emerald-600">{selectedItems.length}</p>
            <p className="text-[10px] text-muted-foreground">মোট আইটেম</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-2xl font-bold text-amber-600">৳{originalPrice}</p>
            <p className="text-[10px] text-muted-foreground">আসল মূল্য</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className="text-2xl font-bold text-violet-600">৳{bundlePrice}</p>
            <p className="text-[10px] text-muted-foreground">বান্ডেল মূল্য</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 text-center">
            <p className={cn(
              "text-2xl font-bold",
              discount > 0 ? "text-rose-600" : "text-muted-foreground"
            )}>
              {discount > 0 ? `${discount}%` : '0%'}
            </p>
            <p className="text-[10px] text-muted-foreground">ছাড়</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingCart className="h-3 w-3" /> আইটেম বিবরণ
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {selectedItems.map((item, idx) => {
              const Icon = getIcon(item.contentType) as React.FC<{ className?: string }>
              return (
                <div key={`${item.contentType}-${item.contentId}-${idx}`} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", getTextColor(item.contentType))} />
                    <span className="text-xs truncate min-w-0">{item.title}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                      {getLabel(item.contentType) || item.contentType}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">৳{item.price}</Badge>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 font-semibold text-sm">
            <span>আসল মূল্য (সকল আইটেমের যোগফল)</span>
            <span className="text-amber-600">৳{originalPrice}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="h-3 w-3" /> মূল্য নির্ধারণ
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>বান্ডেল মূল্য (৳) *</Label>
              <Input
                type="number"
                placeholder="বান্ডেলের মূল্য লিখুন"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ক্রম (Order)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formOrder}
                onChange={(e) => setFormOrder(e.target.value)}
              />
            </div>
          </div>

          {bundlePrice > 0 && originalPrice > 0 && (
            <div className={cn(
              'p-3 rounded-xl border',
              discount > 0
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/20'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-800/20'
            )}>
              <div className="flex items-center gap-2 text-sm">
                {discount > 0 ? (
                  <>
                    <Percent className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{discount}% ছাড়!</span>
                    <span className="text-muted-foreground text-xs">
                      (৳{originalPrice} → ৳{bundlePrice}, সাশ্রয় ৳{originalPrice - bundlePrice})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400 text-xs">
                      বান্ডেল মূল্য আসল মূল্যের সমান বা বেশি। ছাড় দিতে বান্ডেল মূল্য কম করুন।
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Power className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <Label className="text-sm font-medium">সক্রিয়</Label>
              <p className="text-xs text-muted-foreground">বান্ডেল সক্রিয় বা নিষ্ক্রিয় করুন</p>
            </div>
          </div>
          <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
        </div>

        {!isValid && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/20">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> নিচের তথ্য পূরণ করুন:
            </p>
            <ul className="mt-1.5 space-y-0.5 text-xs text-red-600 dark:text-red-400">
              {!formTitle && <li>• শিরোনাম আবশ্যক</li>}
              {selectedItems.length === 0 && <li>• কমপক্ষে ১টি কন্টেন্ট আইটেম যোগ করুন</li>}
            </ul>
          </div>
        )}

        {isValid && (
          <div className="p-4 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" /> বান্ডেল সংরক্ষণ করুন
            </p>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save className="h-4 w-4" /> {editId ? 'আপডেট করুন' : 'তৈরি ও প্রকাশ করুন'}</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
