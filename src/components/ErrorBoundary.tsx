'use client'

import { Component, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (replace with monitoring service in production)
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">কিছু একটা সমস্যা হয়েছে</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                {process.env.NODE_ENV === 'development'
                  ? this.state.error?.message
                  : 'একটি অপ্রত্যাশিত ত্রুটি হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="size-4" />
                  আবার চেষ্টা করুন
                </Button>
                <Button onClick={this.handleGoHome} className="gap-2">
                  <Home className="size-4" />
                  হোমে যান
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
