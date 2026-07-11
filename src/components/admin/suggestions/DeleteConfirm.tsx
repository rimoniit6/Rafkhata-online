'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmProps {
  deleteId: string | null
  setDeleteId: (id: string | null) => void
  handleDelete: () => void
}

export function DeleteConfirm({ deleteId, setDeleteId, handleDelete }: DeleteConfirmProps) {
  return (
    <AnimatePresence>
      {!!deleteId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">সাজেশন মুছুন</h3>
              <p className="text-sm text-muted-foreground mb-6">আপনি কি নিশ্চিত যে এই সাজেশন মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="min-w-20">বাতিল</Button>
                <Button variant="destructive" onClick={handleDelete} className="min-w-20">মুছুন</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
