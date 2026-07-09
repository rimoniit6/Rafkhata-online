'use client'

import HeroSection from './HeroSection'
import ClassCategories from './ClassCategories'
import FeaturedCourses from './FeaturedCourses'
import StatsSection from './StatsSection'
import BoardQuestionSection from './BoardQuestionSection'
import PremiumBanner from './PremiumBanner'
import TestimonialsSection from './TestimonialsSection'
import TeacherModeratorsSection from './TeacherModeratorsSection'
import FAQSection from './FAQSection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ClassCategories />
      <FeaturedCourses />
      <StatsSection />
      <BoardQuestionSection />
      <PremiumBanner />
      <TeacherModeratorsSection />
      <TestimonialsSection />
      <FAQSection />
    </main>
  )
}
