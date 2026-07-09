'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  setName: (name: string) => void
  mobile: string
  setMobile: (mobile: string) => void
  loading: boolean
  onSave: () => void
}

export function EditProfileDialog({
  open,
  onOpenChange,
  name,
  setName,
  mobile,
  setMobile,
  loading,
  onSave
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>প্রোফাইল এডিট করুন</DialogTitle>
          <DialogDescription>
            আপনার নাম এবং মোবাইল নম্বর আপডেট করুন।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">নাম</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-mobile">মোবাইল নম্বর</Label>
            <Input
              id="edit-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="017xxxxxxxx"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
