import { Button } from "@/components/ui/button";
import { ArrowUp, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showCookieConsent, setShowCookieConsent] = useState(() => {
    // Check if user has already made a choice
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('cookieConsent');
    }
    return true;
  });

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

  const handleCookieChoice = (accepted: boolean) => {
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'rejected');
    setShowCookieConsent(false);
  };

  return (
    <>
      <div className="min-h-screen bg-white overflow-x-hidden">
        <LandingNavbar />

        <main>
          <LandingHero />
          <LandingLabView />
          <LandingPrescription />
          <LandingAISuggestions />
          <LandingVoiceTranscription />
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
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cookie consent - outside overflow-x-hidden to avoid iOS fixed-position bug */}
      <AnimatePresence>
        {showCookieConsent && (
          <motion.div
            className="fixed bottom-0 inset-x-0 z-[9998] bg-white border-t border-[#E0E0E0] shadow-xl"
            role="dialog"
            aria-label="Consentimento de cookies"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center space-x-3 flex-1">
                  <div className="flex-shrink-0 bg-[#E0E0E0] p-2 rounded-full">
                    <Lock className="h-5 w-5 text-[#212121]" aria-hidden="true" />
                  </div>
                  <div className="text-sm text-[#9E9E9E]">
                    <p>
                      Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa
                      <a href="/privacidade" className="text-[#212121] hover:underline ml-1"> Política de Privacidade</a> e
                      <a href="/termos" className="text-[#212121] hover:underline ml-1"> Termos de Uso</a>.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 flex-shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => handleCookieChoice(false)}
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-[#E0E0E0] text-[#212121] rounded-lg text-sm font-bold hover:bg-[#D5D5D5] active:bg-[#BDBDBD] transition-colors touch-manipulation min-h-[44px]"
                    aria-label="Rejeitar cookies"
                  >
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCookieChoice(true)}
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-[#212121] hover:bg-[#424242] active:bg-[#616161] text-white rounded-lg text-sm font-bold transition-colors touch-manipulation min-h-[44px]"
                    aria-label="Aceitar cookies"
                  >
                    Aceitar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
