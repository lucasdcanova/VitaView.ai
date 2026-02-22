import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { LandingHero } from "@/components/landing-page/LandingHero";
import { LandingLabView } from "@/components/landing-page/LandingLabView";
import { LandingAppointmentScheduler } from "@/components/landing-page/LandingAppointmentScheduler";
import { LandingFeatures } from "@/components/landing-page/LandingFeatures";
import { LandingForWhom } from "@/components/landing-page/LandingForWhom";
import { LandingTestimonials } from "@/components/landing-page/LandingTestimonials";
import { LandingPricing } from "@/components/landing-page/LandingPricing";
import { LandingSecurity } from "@/components/landing-page/LandingSecurity";
import { LandingPrescription } from "@/components/landing-page/LandingPrescription";
import { LandingAISuggestions } from "@/components/landing-page/LandingAISuggestions";
import { LandingVoiceTranscription } from "@/components/landing-page/LandingVoiceTranscription";
import { LandingFAQ } from "@/components/landing-page/LandingFAQ";
import { LandingFooter } from "@/components/landing-page/LandingFooter";

export default function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <>
        <div className="landing-motion min-h-screen bg-white overflow-x-hidden">
          <LandingNavbar />

          <main>
            <LandingHero />
            <LandingLabView />
            <LandingVoiceTranscription />
            <LandingAISuggestions />
            <LandingPrescription />
            <LandingAppointmentScheduler />
            <LandingFeatures />
            <LandingForWhom />
            <LandingSecurity />
            <LandingPricing />
            <LandingTestimonials />
            <LandingFAQ />
          </main>

          <LandingFooter />
        </div>

        {/* Scroll to top - outside overflow-x-hidden to avoid iOS fixed-position bug */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#212121] text-white flex items-center justify-center shadow-lg hover:bg-[#424242]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.24 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </>
    </MotionConfig>
  );
}
