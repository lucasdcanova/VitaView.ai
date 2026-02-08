import { Button } from "@/components/ui/button";
import { ArrowUp, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { LandingHero } from "@/components/landing-page/LandingHero";
import { LandingAnamnesis } from "@/components/landing-page/LandingAnamnesis";
import { LandingVitaTimeline } from "@/components/landing-page/LandingVitaTimeline";
import { LandingLabView } from "@/components/landing-page/LandingLabView";
import { LandingAppointmentScheduler } from "@/components/landing-page/LandingAppointmentScheduler";
import { LandingFeatures } from "@/components/landing-page/LandingFeatures";
import { LandingForWhom } from "@/components/landing-page/LandingForWhom";
import { LandingTestimonials } from "@/components/landing-page/LandingTestimonials";
import { LandingPricing } from "@/components/landing-page/LandingPricing";
import { LandingSecurity } from "@/components/landing-page/LandingSecurity";
import { LandingFAQ } from "@/components/landing-page/LandingFAQ";
import { LandingFooter } from "@/components/landing-page/LandingFooter";

export default function LandingPage() {
  // Estado para animações e elementos interativos
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [showCookieConsent, setShowCookieConsent] = useState(true);
  /* isMobileMenuOpen removed */

  // Navigation items for reuse
  // Navigation items removed (moved to LandingNavbar)

  // Efeito para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Mostrar botão de voltar ao topo apenas quando rolar mais para baixo
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Função para rolar suavemente até o topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  // SEO: Set document title and meta description
  useEffect(() => {
    document.title = "VitaView AI - Plataforma de Gestão de Saúde Inteligente";

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'VitaView AI: Prontuário inteligente que organiza exames, histórico e tendências de saúde do paciente. HIPAA e LGPD compliant. Automatize a gestão clínica com IA.');

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'VitaView AI - Plataforma de Gestão de Saúde Inteligente');

    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Prontuário inteligente que organiza exames, histórico e tendências de saúde. HIPAA e LGPD compliant.');
  }, []);

  // Variáveis de animação
  // Variáveis de animação removidas (movidas para LandingHero)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Background elements - minimalista, sem gradientes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Elementos decorativos sutis em escala de cinza */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#E0E0E0] rounded-full opacity-20 blur-3xl"></div>
      </div>

      <LandingNavbar />
      <LandingHero />
      <LandingAnamnesis />
      <LandingVitaTimeline />

      {/* Appointment Scheduler Calendar */}
      <LandingLabView />


      {/* Appointment Scheduler Calendar */}
      <LandingAppointmentScheduler />

      {/* Benefits Section */}
      <LandingFeatures />
      <LandingForWhom />
      <LandingSecurity />
      <LandingPricing />
      <LandingTestimonials />



      <LandingFAQ />

      <LandingFooter />

      {/* Botão voltar ao topo */}
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
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Banner de consentimento de cookies */}
      <AnimatePresence>
        {showCookieConsent && (
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E0E0E0] shadow-xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start md:items-center space-x-3">
                  <div className="flex-shrink-0 bg-[#E0E0E0] p-2 rounded-full">
                    <Lock className="h-5 w-5 text-[#212121]" />
                  </div>
                  <div className="text-sm text-[#9E9E9E]">
                    <p>
                      Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa
                      <a href="#" className="text-[#212121] hover:underline"> Política de Privacidade</a> e
                      <a href="#" className="text-[#212121] hover:underline"> Termos de Uso</a>.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 flex-shrink-0">
                  <Button
                    onClick={() => setShowCookieConsent(false)}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 bg-[#E0E0E0] text-[#212121] rounded-lg"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => setShowCookieConsent(false)}
                    variant="default"
                    size="sm"
                    className="px-4 py-2 bg-[#212121] hover:bg-[#424242] text-white rounded-lg font-medium"
                  >
                    Aceitar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </div >
  );
}
