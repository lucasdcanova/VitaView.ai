import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Brain, 
  LineChart, 
  Shield, 
  ShieldCheck,
  ArrowRight, 
  CheckCircle2,
  Users,
  Activity,
  Building,
  ChevronRight,
  Heart,
  HeartPulse,
  Circle,
  Stethoscope,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  BarChart4,
  Sparkles,
  Play,
  FlaskConical,
  Zap,
  Search,
  List,
  ScrollText,
  BarChart,
  TrendingUp,
  FileBarChart,
  AreaChart,
  Bell,
  BellRing,
  Settings,
  UserCircle,
  Calendar,
  Dumbbell,
  BookOpen,
  GraduationCap,
  FileHeart,
  Medal,
  Timer,
  Upload,
  Download,
  ExternalLink,
  BarChart3,
  PieChart,
  ArrowUp,
  CheckCircle,
  Lock,
  Star,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  PhoneCall,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function LandingPage() {
  // Estado para animações e elementos interativos
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  
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
  
  // Função para alternar o estado de perguntas/respostas do FAQ
  const toggleFaq = (index: number) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };
  
  // Variáveis de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-[#1E3A5F]">VitaView</span>
                <span className="text-2xl font-bold text-[#48C9B0]">AI</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#como-funciona" className="text-gray-700 hover:text-primary-600 transition-colors">
                Como funciona
              </a>
              <a href="#demonstracoes" className="text-gray-700 hover:text-primary-600 transition-colors">
                Demonstrações
              </a>
              <a href="#planos" className="text-gray-700 hover:text-primary-600 transition-colors">
                Planos
              </a>
              <a href="#contato" className="text-gray-700 hover:text-primary-600 transition-colors">
                Contato
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-primary-600">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#48C9B0] hover:bg-[#3BB59A] text-white">
                  Começar agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="text-gray-900">Mais controle,</span>
              <br />
              <span className="text-gray-900">menos papel</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Transforme seus exames médicos em <span className="font-semibold text-[#1E3A5F]">insights de saúde</span> com inteligência artificial. 
              Organize, analise e compreenda seus resultados de forma simples e segura.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-[#48C9B0] hover:bg-[#3BB59A] text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Experimentar grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 border-gray-300 hover:border-[#48C9B0] hover:text-[#48C9B0] transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver demonstração
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-[#A5E1D2] to-[#5AADBF] relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 top-20 w-72 h-72 bg-blue-50 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute right-0 bottom-20 w-80 h-80 bg-primary-50 rounded-full opacity-40 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Como o <span className="text-[#1E3A5F]">VitaView</span><span className="text-[#48C9B0]">AI</span> funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transformamos seus exames médicos em insights de saúde de forma simples e intuitiva
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-[#2A4F7C] to-[#1E3A5F] text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-56 h-56 bg-primary-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 bg-green-100 text-green-800 border border-green-300 shadow-sm rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Vantagens Exclusivas
            </motion.span>
          
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Benefícios <span className="text-[#A5E1D2]">Reais</span> para sua Saúde
            </h2>
            <p className="text-lg text-white text-opacity-90 mb-12 max-w-2xl mx-auto">
              O VitaView AI transforma seus dados de saúde em informações valiosas e acionáveis para você e sua família.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="planos" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Planos que <span className="text-[#1E3A5F]">Cabem</span> no seu <span className="text-[#48C9B0]">Orçamento</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal para você e sua família. Comece hoje mesmo a cuidar melhor da sua saúde.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#2A4F7C] to-[#1E3A5F] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <span className="text-3xl font-bold text-white">VitaView</span>
              <span className="text-3xl font-bold text-[#48C9B0]">AI</span>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Transformando a gestão da saúde através da inteligência artificial
            </p>
          </div>
        </div>
      </footer>
      
      {/* Botão voltar ao topo */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700"
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
            className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start md:items-center space-x-3">
                  <div className="flex-shrink-0 bg-primary-100 p-2 rounded-full">
                    <Lock className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa 
                      <a href="#" className="text-primary-600 hover:underline"> Política de Privacidade</a> e 
                      <a href="#" className="text-primary-600 hover:underline"> Termos de Uso</a>.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 flex-shrink-0">
                  <Button
                    onClick={() => setShowCookieConsent(false)}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => setShowCookieConsent(false)}
                    variant="default"
                    size="sm"
                    className="px-4 py-2 bg-[#48C9B0] hover:bg-[#3BB59A] text-white rounded-lg font-medium"
                  >
                    Aceitar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}