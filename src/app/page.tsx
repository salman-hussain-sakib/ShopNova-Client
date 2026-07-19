import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import RecommendationEngine from '@/components/RecommendationEngine';
import FeaturesSection from '@/components/FeaturesSection';
import {
  CategoriesSection,
  StatsSection,
  TestimonialsSection,
  CTASection,
  NewsletterSection,
} from '@/components/HomeSections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <FeaturedProducts />
      <CategoriesSection />
      <RecommendationEngine />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <NewsletterSection />
    </>
  );
}
