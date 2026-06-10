'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Inbox, Search, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ElementType
  }
  searchQuery?: string
  className?: string
}

export default function EnhancedEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  searchQuery,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-full mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {description}
            </p>
          )}
          
          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-4">
              অনুসন্ধান: <span className="font-medium">&quot;{searchQuery}&quot;</span>
            </p>
          )}
          
          {action && (
            <Button
              onClick={action.onClick}
              className="gap-2"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
