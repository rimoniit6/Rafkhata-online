'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, Loader2 } from 'lucide-react'
import { useFAQs, useSiteConfig } from '@/hooks/use-metadata'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

export default function FAQSection() {
  const { faqs, loading } = useFAQs()
  const { config } = useSiteConfig()

  // Don't show section if no FAQs from database
  if (!loading && faqs.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" suppressHydrationWarning>
            {config?.homepageFaqTitle || 'সচরাচর জিজ্ঞাসা'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto" suppressHydrationWarning>
            {config?.homepageFaqSubtitle || 'আপনার প্রশ্নের উত্তর এখানে'}
          </p>
        </div>

        {/* Accordion */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-2 sm:p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">FAQ লোড হচ্ছে...</span>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-b-0">
                      <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-2 sm:px-4">
                        <RichContentRenderer content={faq.question} />
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed px-2 sm:px-4">
                        <RichContentRenderer content={faq.answer} as="span" />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
