import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
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
  HeartPulse,
  Stethoscope,
  Clock,
  Eye,
  RefreshCw,
  BarChart4,
  Sparkles,
  Play,
  FlaskConical,
  Zap,
  ScrollText,
  TrendingUp,
  Bell,
  UserCircle,
  Calendar,
  GraduationCap,
  Lightbulb,
  Upload,
  ArrowUp,
  X,
  ChevronDown,
  Lock,
  MessageSquare,
  Star,
  Menu
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  // Estado para animações e elementos interativos
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items for reuse
  const navItems = [
    { id: "demonstracoes", label: "Vita Timeline" },
    { id: "como-funciona", label: "View Laboratorial" },
    { id: "agenda", label: "Agenda" },
    { id: "beneficios", label: "Benefícios" },
    { id: "para-quem", label: "Para Quem" },
    { id: "depoimentos", label: "Depoimentos" }
  ];

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] overflow-hidden">
      {/* Background elements - minimalista, sem gradientes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Elementos decorativos sutis em escala de cinza */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#E0E0E0] rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#E0E0E0] rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Navbar - design minimalista */}
      <motion.nav
        className="bg-pureWhite border-b border-[#E0E0E0] py-3 fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Logo
                size="md"
                showText={true}
                textSize="lg"
                variant="icon"
                className="font-bold tracking-tight"
              />
            </motion.div>
          </Link>

          {/* Desktop navigation - design minimalista */}
          <div className="hidden md:flex space-x-8 text-[#212121]">
            {[
              { id: "demonstracoes", label: "Vita Timeline" },
              { id: "como-funciona", label: "View Laboratorial" },
              { id: "agenda", label: "Agenda" },
              { id: "beneficios", label: "Benefícios" },
              { id: "para-quem", label: "Para Quem" },
              { id: "depoimentos", label: "Depoimentos" }
            ].map((item) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                className="hover:text-[#9E9E9E] transition-colors relative group py-2 text-sm font-body font-medium"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/auth">
              <Button
                variant="default"
                size="sm"
                className="bg-[#212121] hover:bg-[#424242] text-white font-heading font-bold"
              >
                Acessar
              </Button>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Login/Access button with improved animation */}
          <motion.div
            className="hidden md:block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth">
              <Button variant="default" className="bg-[#212121] hover:bg-[#424242] text-white px-6 py-2 font-heading font-bold rounded-lg">
                Acessar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Slide-out menu */}
            <motion.div
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-6 pt-20">
                <nav className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3 px-4 text-[#212121] hover:bg-gray-100 rounded-lg transition-colors font-medium"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Link href="/auth">
                    <Button className="w-full bg-[#212121] hover:bg-[#424242] text-white font-bold">
                      Acessar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - design minimalista */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16 px-5 sm:px-6 lg:px-8 relative bg-pureWhite min-h-screen flex flex-col justify-center">
        <motion.div
          className="flex flex-col md:flex-row items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="md:w-1/2 mb-10 md:mb-0 md:pr-8" variants={itemVariants}>


            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#212121] leading-tight mb-5 md:mb-6">
              <span className="tracking-tight">VitaView</span><span className="text-[#9E9E9E] ml-1">AI</span>: O Prontuário que pensa com você.
            </h1>

            <p className="text-base md:text-xl text-[#9E9E9E] font-body mb-6 md:mb-8 max-w-lg">
              Dados do paciente, histórico e tendências de saúde apresentados com clareza, permitindo que você foque no cuidado humano.
            </p>

            {/* Benefícios em lista */}
            <div className="mb-6 md:mb-8 space-y-3 md:space-y-3 hidden md:block">
              {[
                { icon: <ShieldCheck className="h-5 w-5 text-[#212121]" />, text: "Conformidade HIPAA e LGPD" },
                { icon: <Brain className="h-5 w-5 text-[#212121]" />, text: "Organização Inteligente de Dados Clínicos" },
                { icon: <Activity className="h-5 w-5 text-[#212121]" />, text: "Monitoramento Remoto de Pacientes" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <div className="flex-shrink-0 p-1.5 bg-[#E0E0E0] rounded-full">
                    {item.icon}
                  </div>
                  <p className="text-[#212121] font-body">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Estatísticas animadas */}
            <div className="grid grid-cols-3 gap-4 mb-8 hidden md:grid">
              <motion.div
                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">98%</h3>
                <p className="text-sm text-[#9E9E9E] font-body">Precisão na Extração</p>
              </motion.div>
              <motion.div
                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">30%</h3>
                <p className="text-sm text-[#9E9E9E] font-body">Menos Tempo Desperdiçado</p>
              </motion.div>
              <motion.div
                className="text-center p-4 bg-pureWhite rounded-lg border border-[#E0E0E0]"
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-[#212121]">24/7</h3>
                <p className="text-sm text-[#9E9E9E] font-body">Acesso Seguro a Todo Instante</p>
              </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link href="/auth">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button size="lg" className="bg-[#212121] hover:bg-[#424242] text-white px-6 md:px-8 py-5 md:py-6 rounded-lg w-full sm:w-auto font-heading font-bold text-sm md:text-base">
                    Começar Teste Grátis
                    <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </motion.div>
              </Link>
              <a href="#demonstracoes">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button size="lg" variant="outline" className="border-2 border-[#212121] text-[#212121] hover:bg-[#E0E0E0] px-6 md:px-8 py-5 md:py-6 rounded-lg flex items-center font-heading font-bold text-sm md:text-base">
                    <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Ver Demonstração
                  </Button>
                </motion.div>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="md:w-1/2 flex justify-center relative mt-10 md:mt-0"
            variants={itemVariants}
          >
            {/* Elemento decorativo minimalista */}
            <div className="absolute -z-10 w-64 h-64 bg-[#E0E0E0] rounded-full opacity-30 blur-xl -top-10 -right-10"></div>

            {/* Imagem principal com sobreposição de elementos */}
            <div className="relative w-full max-w-[600px]">
              <motion.div
                className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10] flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0]200 bg-[#F4F4F4]/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Central Upload Icon */}
                <motion.div
                  className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 relative z-20"
                  animate={{
                    boxShadow: ["0 10px 25px -5px rgba(59, 130, 246, 0.1)", "0 10px 25px -5px rgba(59, 130, 246, 0.3)", "0 10px 25px -5px rgba(59, 130, 246, 0.1)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Upload className="w-10 h-10 text-[#212121]" />
                </motion.div>

                <h3 className="text-xl font-semibold text-[#212121] mb-2">Arraste exames de pacientes aqui</h3>
                <p className="text-[#9E9E9E] text-center max-w-xs mb-8">
                  A IA processa PDFs e imagens automaticamente para o prontuário.
                </p>

                {/* Animated Files Floating In */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* File 1 - PDF */}
                  <motion.div
                    className="absolute top-10 left-10 bg-white p-3 rounded-lg shadow-md flex items-center gap-2 border border-[#E0E0E0]"
                    initial={{ x: -100, y: -50, opacity: 0 }}
                    animate={{
                      x: [null, 150, 220],
                      y: [null, 100, 150],
                      opacity: [0, 1, 0],
                      scale: [1, 1, 0.5]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <FileText className="w-8 h-8 text-[#212121]" />
                    <div className="w-16 h-2 bg-[#E0E0E0] rounded"></div>
                  </motion.div>

                  {/* File 2 - Image */}
                  <motion.div
                    className="absolute bottom-20 right-10 bg-white p-3 rounded-lg shadow-md flex items-center gap-2 border border-[#E0E0E0]"
                    initial={{ x: 100, y: 50, opacity: 0 }}
                    animate={{
                      x: [null, -120, -200],
                      y: [null, -80, -120],
                      opacity: [0, 1, 0],
                      scale: [1, 1, 0.5]
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      delay: 1
                    }}
                  >
                    <div className="w-8 h-8 bg-[#E0E0E0] rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-[#212121]">JPG</span>
                    </div>
                    <div className="w-16 h-2 bg-[#E0E0E0] rounded"></div>
                  </motion.div>

                  {/* File 3 - Another PDF */}
                  <motion.div
                    className="absolute top-1/2 left-[-50px] bg-white p-2 rounded-lg shadow-sm flex items-center gap-2 border border-[#E0E0E0]"
                    initial={{ x: 0, opacity: 0 }}
                    animate={{
                      x: [0, 200, 280],
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0.8, 0.8, 0.4]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: 0.5
                    }}
                  >
                    <FileText className="w-6 h-6 text-[#9E9E9E]" />
                  </motion.div>
                </div>

                {/* Scanning Line Effect */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9E9E9E] to-transparent opacity-50"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>

              {/* Floating Badges */}
              <motion.div
                className="absolute -top-5 -right-5 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              >
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-[#212121]" />
                  <span className="text-sm font-medium">Processamento IA</span>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-8 -left-8 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-[#212121]" />
                  <span className="text-sm font-medium">Dados Extraídos</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Badges flutuantes na parte de baixo - design minimalista */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4 py-2 px-6 bg-pureWhite border border-[#E0E0E0] rounded-t-xl text-xs md:text-sm text-[#212121] hidden sm:flex">
          <span className="flex items-center">
            <Shield className="w-4 h-4 mr-1 text-[#212121]" /> Dados protegidos
          </span>
          <span className="flex items-center">
            <Brain className="w-4 h-4 mr-1 text-[#212121]" /> Análise com IA
          </span>
          <span className="flex items-center">
            <FlaskConical className="w-4 h-4 mr-1 text-[#212121]" /> Interpretação clínica
          </span>
        </div>
      </section>

      {/* Simulação de Relatórios Section - design minimalista */}
      <section id="demonstracoes" className="py-12 md:py-16 mt-[0] bg-[#212121] text-white relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center">
        {/* Elementos decorativos minimalistas */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-56 h-56 bg-[#424242] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#424242] rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 bg-[#E0E0E0] text-[#212121] rounded-full text-sm font-heading font-bold mb-4 md:mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Vita Timeline
            </motion.span>

            <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-4 md:mb-6">
              Linha de <span className="text-[#9E9E9E]">Vida</span> do Paciente
            </h2>
            <p className="text-base md:text-lg text-[#E0E0E0] font-body max-w-3xl mx-auto px-2">
              Tenha uma visão holística da jornada de saúde do seu paciente. Acesse exames, métricas vitais e histórico clínico em um dashboard centralizado e seguro.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Relatório de Exame Simulado */}
            <div className="relative w-full max-w-[600px]">
              {/* Dashboard mockup simulado - design mais próximo do real */}
              <motion.div
                className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10]"
                whileHover={{
                  rotate: 2,
                  transition: { duration: 0.3 }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Header do dashboard - design minimalista */}
                <div className="bg-[#212121] h-12 flex items-center px-4 text-white">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-heading font-bold">Linha do Tempo - Maria Silva</span>
                  <div className="ml-auto flex space-x-2">
                    <div className="flex items-center bg-[#424242] rounded px-2 py-1 text-xs cursor-pointer hover:bg-[#525252] transition-colors">
                      <span className="mr-1 opacity-70">Período:</span>
                      <span className="font-medium">Últimos 6 meses</span>
                      <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo do dashboard - Timeline */}
                <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white p-6">
                  <div className="max-w-3xl mx-auto">
                    {/* Timeline Items */}
                    <div className="relative">
                      {/* Vertical Line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#212121] via-[#9E9E9E] to-[#424242]"></div>

                      {/* Timeline Event 1 - Recent Lab Result */}
                      <div className="relative flex gap-4 mb-8 group">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                            <FileText className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xs text-[#9E9E9E] mt-2 font-medium">15 Abr</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#212121]">Hemograma Completo</h4>
                              <p className="text-xs text-[#9E9E9E] mt-1">Laboratório Central</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                              Normal
                            </span>
                          </div>
                          <p className="text-sm text-[#9E9E9E] mb-2">Todos os parâmetros dentro da normalidade</p>
                          <div className="flex gap-2 text-xs text-[#9E9E9E]">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#212121]"></div>
                              Hemoglobina: 14.2 g/dL
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#212121]"></div>
                              Leucócitos: 7.200/mm³
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Event 2 - Medication */}
                      <div className="relative flex gap-4 mb-8 group">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                            <span className="text-2xl">💊</span>
                          </div>
                          <span className="text-xs text-[#9E9E9E] mt-2 font-medium">10 Abr</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#212121]">Prescrição Atualizada</h4>
                              <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                              Ativo
                            </span>
                          </div>
                          <p className="text-sm text-[#9E9E9E] mb-2">Ajuste na dosagem de medicação para hipertensão</p>
                          <div className="space-y-1 text-xs text-[#9E9E9E]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Losartana 50mg</span>
                              <span className="text-[#9E9E9E]">•</span>
                              <span>1x ao dia (manhã)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Event 3 - Appointment */}
                      <div className="relative flex gap-4 mb-8 group">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                            <span className="text-2xl">🏥</span>
                          </div>
                          <span className="text-xs text-[#9E9E9E] mt-2 font-medium">05 Abr</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#212121]">Consulta de Retorno</h4>
                              <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                              Concluída
                            </span>
                          </div>
                          <p className="text-sm text-[#9E9E9E]">Avaliação de controle pressórico e ajuste terapêutico</p>
                        </div>
                      </div>

                      {/* Timeline Event 4 - Lab Result with Alert */}
                      <div className="relative flex gap-4 mb-8 group">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9E9E9E] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                            <FileText className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xs text-[#9E9E9E] mt-2 font-medium">28 Mar</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#212121]">Glicemia em Jejum</h4>
                              <p className="text-xs text-[#9E9E9E] mt-1">Laboratório Central</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                              Atenção
                            </span>
                          </div>
                          <p className="text-sm text-[#9E9E9E] mb-2">Valor ligeiramente elevado - acompanhamento necessário</p>
                          <div className="flex gap-2 text-xs text-[#9E9E9E]">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#9E9E9E]"></div>
                              Glicemia: 108 mg/dL
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Event 5 - Diagnosis */}
                      <div className="relative flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#212121] to-[#424242] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                            <span className="text-2xl">📋</span>
                          </div>
                          <span className="text-xs text-[#9E9E9E] mt-2 font-medium">15 Mar</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-md border border-[#E0E0E0] p-4 group-hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#212121]">Diagnóstico Registrado</h4>
                              <p className="text-xs text-[#9E9E9E] mt-1">Dr. João Santos - Cardiologia</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E0E0] text-[#212121] border border-[#E0E0E0]">
                              Ativo
                            </span>
                          </div>
                          <p className="text-sm text-[#9E9E9E]">Hipertensão Arterial Sistêmica (CID I10)</p>
                        </div>
                      </div>
                    </div>

                    {/* View More Link */}
                    <div className="mt-8 text-center">
                      <span className="text-sm font-medium text-[#212121] hover:text-[#212121] cursor-pointer flex items-center justify-center gap-1 transition-colors">
                        Ver histórico completo
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Elementos decorativos flutuantes */}
              <motion.div
                className="absolute -top-5 -left-5 p-4 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className="flex items-center space-x-2 text-[#212121]">
                  <Users className="w-5 h-5 text-[#212121] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#212121]">Total de Pacientes: <span className="text-[#212121]">127</span></span>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 p-3 bg-white rounded-lg shadow-lg z-20 hidden md:block"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.5
                }}
              >
                <div className="flex items-center space-x-2 text-[#212121]">
                  <BarChart4 className="w-5 h-5 text-[#212121] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#212121]">Exames Pendentes: <span className="text-[#9E9E9E]">8</span></span>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -right-10 p-3 bg-white rounded-full shadow-lg z-20 hidden md:flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Sparkles className="w-6 h-6 text-[#9E9E9E]" />
              </motion.div>
            </div>

            <div className="space-y-4 md:space-y-6 mt-8 lg:mt-0">
              <motion.div
                className="text-left"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Analise exames com eficiência e precisão</h3>
                <p className="text-base md:text-lg text-white text-opacity-90 mb-4 md:mb-6">
                  Nossos relatórios transformam dados brutos em insights clínicos, ajudando você a monitorar:
                </p>

                <ul className="space-y-3 md:space-y-4 hidden md:block">
                  {[
                    {
                      icon: <GraduationCap className="h-5 w-5 text-[#212121]" />,
                      title: "Contexto Clínico Imediato",
                      description: "Visualize métricas com referências automáticas e histórico do paciente."
                    },
                    {
                      icon: <LineChart className="h-5 w-5 text-[#212121]" />,
                      title: "Evolução do Paciente",
                      description: "Acompanhe a evolução dos resultados ao longo do tempo e identifique padrões clínicos."
                    },
                    {
                      icon: <Bell className="h-5 w-5 text-[#212121]" />,
                      title: "Alertas de Risco",
                      description: "Receba notificações automáticas sobre parâmetros críticos que necessitam de atenção."
                    },
                    {
                      icon: <ScrollText className="h-5 w-5 text-[#212121]" />,
                      title: "Registro de Anamneses",
                      description: "Documente consultas e evoluções clínicas de forma estruturada e pesquisável."
                    },
                    {
                      icon: <HeartPulse className="h-5 w-5 text-[#212121]" />,
                      title: "Medicamentos de Uso Contínuo",
                      description: "Gerencie prescrições ativas, acompanhe adesão e receba alertas de interações."
                    },
                    {
                      icon: <RefreshCw className="h-5 w-5 text-[#212121]" />,
                      title: "Renovação Automática de Receitas",
                      description: "Gere receitas de medicamentos contínuos automaticamente com um clique."
                    }
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <div className="p-2 bg-[#E0E0E0] rounded-full mr-3 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-white text-opacity-85">{item.description}</p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div >
        </div >
      </section >

      {/* Appointment Scheduler Calendar */}
      < section id="como-funciona" className="py-12 md:py-24 bg-gradient-to-b from-[#E0E0E0] to-[#F4F4F4] relative overflow-hidden" >
        {/* Elementos decorativos de fundo */}
        < div className="absolute inset-0 overflow-hidden pointer-events-none" >
          <div className="absolute left-0 top-20 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute right-0 bottom-20 w-80 h-80 bg-[#F4F4F4] rounded-full opacity-40 blur-3xl"></div>
        </div >

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 bg-[#F4F4F4] text-[#212121] rounded-full text-sm font-medium mb-4 md:mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Análise Inteligente
            </motion.span>

            <h2 className="text-2xl md:text-4xl font-bold text-[#212121] mb-4 md:mb-6">
              <span className="text-[#212121]">View Laboratorial</span>
            </h2>
            <p className="text-base md:text-lg text-[#9E9E9E] mb-6 md:mb-8 max-w-2xl mx-auto px-2">
              Compare valores ao longo do tempo, identifique tendências e visualize resultados em relação aos valores de referência.
            </p>
          </motion.div>

          {/* Lab Results Analyzer Interface */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Analyzer Header */}
            <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <LineChart className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">Análise Comparativa</h3>
                    <p className="text-sm text-[#E0E0E0]">Paciente: Maria Silva - Últimos 6 meses</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-[#212121] hover:bg-[#9E9E9E] rounded-lg text-sm font-medium transition-colors">
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Lab Results Grid */}
            <div className="p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Hemoglobina Chart */}
                <motion.div
                  className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#212121]">Hemoglobina</h4>
                      <p className="text-sm text-[#9E9E9E]">Referência: 12.0 - 16.0 g/dL</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                      Normal
                    </span>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                      <div className="flex-1 bg-red-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "75%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        >
                          <span className="text-xs font-semibold text-white">13.2</span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                      <div className="flex-1 bg-red-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "80%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <span className="text-xs font-semibold text-white">14.2</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg">↗</span>
                      <span className="font-semibold">+7.6%</span>
                    </div>
                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                  </div>
                </motion.div>

                {/* Glicemia Chart */}
                <motion.div
                  className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#212121]">Glicemia em Jejum</h4>
                      <p className="text-sm text-[#9E9E9E]">Referência: 70 - 100 mg/dL</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                      Atenção
                    </span>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                      <div className="flex-1 bg-amber-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "85%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        >
                          <span className="text-xs font-semibold text-white">102</span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                      <div className="flex-1 bg-amber-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "90%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <span className="text-xs font-semibold text-white">108</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-600">
                      <span className="text-lg">↗</span>
                      <span className="font-semibold">+5.9%</span>
                    </div>
                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                  </div>
                </motion.div>

                {/* Colesterol Total Chart */}
                <motion.div
                  className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0] hidden md:block"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#212121]">Colesterol Total</h4>
                      <p className="text-sm text-[#9E9E9E]">Referência: {'<'} 200 mg/dL</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                      Normal
                    </span>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                      <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "78%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        >
                          <span className="text-xs font-semibold text-white">195</span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                      <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "72%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <span className="text-xs font-semibold text-white">180</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg">↘</span>
                      <span className="font-semibold">-7.7%</span>
                    </div>
                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                  </div>
                </motion.div>

                {/* Creatinina Chart */}
                <motion.div
                  className="bg-[#F4F4F4] rounded-xl p-4 md:p-6 border border-[#E0E0E0] hidden md:block"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-[#212121]">Creatinina</h4>
                      <p className="text-sm text-[#9E9E9E]">Referência: 0.6 - 1.2 mg/dL</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                      Normal
                    </span>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Mar</span>
                      <div className="flex-1 bg-emerald-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "65%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        >
                          <span className="text-xs font-semibold text-white">0.9</span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9E9E9E] w-16">Abr</span>
                      <div className="flex-1 bg-emerald-100 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          whileInView={{ width: "67%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <span className="text-xs font-semibold text-white">0.92</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <span className="text-lg">→</span>
                      <span className="font-semibold">+2.2%</span>
                    </div>
                    <span className="text-[#9E9E9E]">vs. mês anterior</span>
                  </div>
                </motion.div>
              </div>

              {/* Summary Section */}
              <motion.div
                className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-[#E0E0E0]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#E0E0E0] rounded-lg">
                    <LineChart className="w-6 h-6 text-[#9E9E9E]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#212121] mb-2">Resumo da Análise</h4>
                    <p className="text-[#212121] text-sm mb-3">
                      Visualização comparativa dos últimos 2 meses. Os dados apresentados são apenas informativos e não substituem a avaliação clínica profissional.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                        3 valores normais
                      </span>
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                        1 requer atenção
                      </span>
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#212121] border border-[#E0E0E0]">
                        Período: Mar-Abr 2025
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA após análise */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/auth?tab=register">
              <button
                className="bg-[#212121] hover:bg-[#212121] text-white font-bold py-4 px-8 rounded-lg shadow-lg text-lg"
              >
                Comece agora gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section >


      {/* Appointment Scheduler Calendar */}
      <section id="agenda" className="py-12 md:py-16 bg-[#212121] text-white relative overflow-hidden scroll-mt-16" >
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Agenda Inteligente</h2>
            <p className="text-base md:text-xl text-white text-opacity-90 max-w-3xl mx-auto px-2">
              Gerencie suas consultas com facilidade. Visualize compromissos, horários disponíveis e organize sua rotina clínica com a ajuda de um <span className="font-bold text-[#E0E0E0]">assistente de IA</span> que entende comandos de texto e fotos da sua agenda.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-6xl mx-auto hidden md:block"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-[#212121] to-[#424242] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">Abril 2025</h3>
                    <p className="text-sm text-[#E0E0E0]">Semana 14 - 20 de Abril</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-[#212121] rounded-lg transition-colors">
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <button className="p-2 hover:bg-[#212121] rounded-lg transition-colors">
                    <ChevronDown className="w-5 h-5 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 md:p-6">
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs font-semibold text-[#9E9E9E] uppercase mb-2">{day}</div>
                    <div className={`text-sm font-medium ${i === 1 ? 'text-[#212121]' : 'text-[#212121]'}`}>
                      {14 + i}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {/* Sunday - Empty */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px]"></div>

                {/* Monday - 2 appointments */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px] space-y-1 md:space-y-2">
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#F4F4F4]0 rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">09:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Maria Silva</div>
                    <div className="text-xs text-[#212121]">Consulta</div>
                  </motion.div>
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">14:30</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">João Santos</div>
                    <div className="text-xs text-[#212121]">Retorno</div>
                  </motion.div>
                </div>

                {/* Tuesday - 1 appointment */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px]">
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">10:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Ana Costa</div>
                    <div className="text-xs text-[#424242]">Exames</div>
                  </motion.div>
                </div>

                {/* Wednesday - 3 appointments */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px] space-y-1 md:space-y-2">
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#9E9E9E] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">08:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Pedro Lima</div>
                    <div className="text-xs text-[#424242]">Urgência</div>
                  </motion.div>
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#F4F4F4]0 rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">11:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Carla Mendes</div>
                    <div className="text-xs text-[#212121]">Consulta</div>
                  </motion.div>
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">15:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Roberto Silva</div>
                    <div className="text-xs text-[#212121]">Retorno</div>
                  </motion.div>
                </div>

                {/* Thursday - 2 appointments */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px] space-y-1 md:space-y-2">
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#F4F4F4]0 rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">09:30</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Lucia Alves</div>
                    <div className="text-xs text-[#212121]">Consulta</div>
                  </motion.div>
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">13:00</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Fernando Costa</div>
                    <div className="text-xs text-[#424242]">Exames</div>
                  </motion.div>
                </div>

                {/* Friday - 1 appointment */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px]">
                  <motion.div
                    className="bg-[#E0E0E0] border-l-4 border-[#212121] rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-xs font-semibold text-[#212121]">10:30</div>
                    <div className="text-xs font-medium text-[#212121] mt-1">Beatriz Souza</div>
                    <div className="text-xs text-[#212121]">Retorno</div>
                  </motion.div>
                </div>

                {/* Saturday - Empty */}
                <div className="bg-[#F4F4F4] rounded-lg p-1 md:p-2 min-h-[120px] md:min-h-[200px]"></div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#212121] rounded"></div>
                  <span className="text-xs text-[#9E9E9E]">Consulta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#212121] rounded"></div>
                  <span className="text-xs text-[#9E9E9E]">Retorno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#212121] rounded"></div>
                  <span className="text-xs text-[#9E9E9E]">Exames</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#9E9E9E] rounded"></div>
                  <span className="text-xs text-[#9E9E9E]">Urgência</span>
                </div>
              </div>
            </div>

            {/* Calendar Footer */}
            <div className="bg-[#F4F4F4] px-6 py-4 border-t border-[#E0E0E0] flex justify-between items-center">
              <div className="text-sm text-[#9E9E9E]">
                <span className="font-semibold">10 consultas</span> agendadas esta semana
              </div>
              <button className="px-4 py-2 bg-[#212121] hover:bg-[#424242] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <span>Nova Consulta</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* AI Scheduling Features */}
          <motion.div
            className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2
                }
              }
            }}
          >
            <motion.div
              className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 cursor-pointer group"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.4)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="p-3 bg-[#E0E0E0] rounded-lg w-fit mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Brain className="w-6 h-6 text-[#212121]" />
              </motion.div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#E0E0E0] transition-colors">Assistente IA de Agendamento</h4>
              <p className="text-white/80 text-sm">
                Envie fotos da sua agenda atual e a IA organiza automaticamente seus compromissos, evitando conflitos de horários.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 cursor-pointer group"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.4)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="p-3 bg-[#E0E0E0] rounded-lg w-fit mb-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <MessageSquare className="w-6 h-6 text-[#212121]" />
              </motion.div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#E0E0E0] transition-colors">Comandos por Texto</h4>
              <p className="text-white/80 text-sm">
                Digite comandos como "agende retorno do João para próxima terça às 10h" e a IA cria o agendamento para você.
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 cursor-pointer group"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.4)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="p-3 bg-[#E0E0E0] rounded-lg w-fit mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Zap className="w-6 h-6 text-[#212121]" />
              </motion.div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#E0E0E0] transition-colors">Sugestões Inteligentes</h4>
              <p className="text-white/80 text-sm">
                Receba sugestões de horários otimizados baseados no seu padrão de atendimento e disponibilidade.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section >

      {/* Benefits Section */}
      <section id="beneficios" className="pt-10 md:pt-12 pb-16 md:pb-24 bg-gradient-to-b from-[#F4F4F4] to-[#E0E0E0] text-[#212121] relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center" >
        {/* Elementos decorativos de fundo */}
        < div className="absolute inset-0 overflow-hidden pointer-events-none" >
          <div className="absolute -right-10 -bottom-20 w-96 h-96 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-1/3 -top-48 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>


        </div >

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 bg-[#E0E0E0] text-[#212121] border border-[#9E9E9E] shadow-sm rounded-full text-sm font-medium mb-4 md:mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Visão Completa
            </motion.span>

            <h2 className="text-2xl md:text-4xl font-bold text-[#212121] mb-4 md:mb-6">
              Uma Nova <span className="text-[#424242]">Visão</span> para a Saúde
            </h2>
            <p className="text-base md:text-lg text-[#212121] text-opacity-90 mb-8 md:mb-12 max-w-2xl mx-auto px-2">
              O VitaView AI amplia sua capacidade de análise, transformando dados complexos em uma visão clara e acionável da vida do paciente.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Clock className="w-6 h-6 text-[#212121]" />,
                title: "Visão Cronológica",
                description: "Visualize toda a jornada de saúde do paciente em uma linha do tempo intuitiva e unificada.",
                delay: 0
              },
              {
                icon: <Eye className="w-6 h-6 text-[#9E9E9E]" />,
                title: "Olhar Preventivo",
                description: "Identifique tendências sutis e riscos potenciais antes que se tornem problemas críticos.",
                delay: 0.1
              },
              {
                icon: <UserCircle className="w-6 h-6 text-[#212121]" />,
                title: "Foco no Paciente",
                description: "Reduza o tempo em telas e burocracia para dedicar mais atenção visual e humana ao seu paciente.",
                delay: 0.2
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-[#424242]" />,
                title: "Panorama Evolutivo",
                description: "Compreenda a evolução clínica com gráficos comparativos que revelam o progresso do tratamento.",
                delay: 0.3
              },
              {
                icon: <Lightbulb className="w-6 h-6 text-[#212121]" />,
                title: "Clareza Visual",
                description: "Transforme diagnósticos complexos em visualizações claras que facilitam o entendimento do paciente.",
                delay: 0.4
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-[#212121]" />,
                title: "Segurança Total",
                description: "Seus dados protegidos com os mais altos padrões de segurança, garantindo confidencialidade absoluta.",
                delay: 0.5
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className={`relative bg-white p-5 md:p-7 rounded-xl shadow-lg overflow-hidden border border-[#E0E0E0] hover:border-[#E0E0E0]300 group ${index > 2 ? 'hidden md:block' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: benefit.delay }}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 30px rgba(0,0,0,0.07)",
                  transition: { duration: 0.3 }
                }}
              >
                {/* Ícone estilizado */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-[#E0E0E0] flex items-center justify-center mb-5 group-hover:from-[#212121] group-hover:to-[#424242] group-hover:border-[#E0E0E0]200 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    {benefit.icon}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#212121] mb-3 group-hover:text-[#212121] transition-colors duration-300">
                  {benefit.title}
                </h3>

                <p className="text-[#9E9E9E] mb-4 text-sm">
                  {benefit.description}
                </p>

                {/* Indicador de hover */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#212121] to-[#424242] group-hover:w-full transition-all duration-300 ease-out"></div>
              </motion.div>
            ))}
          </div>



          {/* CTA dentro da seção de benefícios */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/auth?tab=register">
              <Button
                className="bg-[#212121] hover:bg-[#424242] text-white border-2 border-[#212121] px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                size="lg"
              >
                Otimize seu Atendimento
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section >

      {/* For Whom Section */}
      {/* Seção: Para quem é o VitaView AI */}
      <section id="para-quem" className="py-12 md:py-20 bg-gradient-to-r from-[#424242] to-[#212121] text-white relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 bottom-0 w-96 h-96 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute right-0 top-1/4 w-80 h-80 bg-[#F4F4F4] rounded-full opacity-20 blur-3xl"></div>
          <motion.div
            className="absolute top-1/2 left-1/3 w-8 h-8 bg-[#E0E0E0] rounded-full opacity-50"
            animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          {/* Título da seção */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#E0E0E0] text-[#212121] mb-4">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Versatilidade Profissional</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
              Soluções para cada <span className="text-white">Cenário</span>
            </h2>
            <p className="text-base md:text-lg text-white text-opacity-90 max-w-2xl mx-auto px-2">
              Nossa plataforma se adapta a diferentes modelos de atuação clínica, potencializando resultados em cada contexto.
            </p>
          </motion.div>

          {/* Cards de público-alvo - Centralizados em 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-10 md:mb-16 max-w-6xl mx-auto">
            {/* Card 1: Profissional Solo */}
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-[#212121]"></div>

              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-7 w-7 text-[#212121]" />
                </div>

                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-[#212121] mb-4">Profissional de Saúde</h3>

                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Prontuário inteligente automatizado</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Agenda e lembretes inteligentes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Redução de tempo administrativo</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Card 2: Clínicas Multidisciplinares */}
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-gradient-to-r from-[#212121] to-[#424242]"></div>

              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-[#424242]" />
                </div>

                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-[#212121] mb-4">Clínicas Multidisciplinares</h3>

                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Centralização de dados do paciente</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Compartilhamento seguro de dados</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Fluxo de trabalho otimizado</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Card 3: Hospitais */}
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-[#E0E0E0]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-[#9E9E9E]"></div>

              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-[#F4F4F4] flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-7 w-7 text-[#212121]" />
                </div>

                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-[#212121] mb-4">Hospitais</h3>

                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Integração com sistemas legacy (HIS)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Dashboard de saúde populacional</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#212121] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-[#9E9E9E] text-sm">Segurança e conformidade enterprise</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {/* Estatística 1 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-[#E0E0E0] text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#F4F4F4] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-[#212121]" />
              </div>
              <h3 className="text-3xl font-bold text-[#212121] mb-2">+40%</h3>
              <p className="text-[#212121] font-medium">Aumento na produtividade clínica</p>
            </motion.div>

            {/* Estatística 2 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-[#E0E0E0] text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#F4F4F4] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#212121]" />
              </div>
              <h3 className="text-3xl font-bold text-[#212121] mb-2">30%</h3>
              <p className="text-[#212121] font-medium">Redução no tempo de consulta</p>
            </motion.div>

            {/* Estatística 3 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-[#E0E0E0] text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#F4F4F4] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-[#212121]" />
              </div>
              <h3 className="text-3xl font-bold text-[#212121] mb-2">100%</h3>
              <p className="text-[#212121] font-medium">Seguro e em conformidade com a LGPD</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-12 md:py-20 bg-[#F4F4F4] relative overflow-hidden scroll-mt-16 min-h-screen flex flex-col justify-center">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-10 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-0 bottom-10 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F4F4F4] rounded-full opacity-20 blur-3xl"></div>

          {/* Elementos decorativos minimalistas */}
          <div className="absolute top-20 left-[15%] w-3 h-3 bg-[#9E9E9E] rounded-full opacity-70"></div>
          <div className="absolute top-1/2 right-[10%] w-5 h-5 bg-[#9E9E9E] rounded-full opacity-70"></div>
          <div className="absolute bottom-40 left-[30%] w-4 h-4 bg-[#9E9E9E] rounded-full opacity-70"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-center text-[#212121] mb-3 md:mb-4">
              O Que Dizem Nossos <span className="text-[#212121]">Usuários</span>
            </h2>
            <p className="text-center text-[#9E9E9E] mb-8 md:mb-12 max-w-2xl mx-auto text-sm md:text-base px-2">
              Centenas de pessoas já transformaram sua relação com a saúde através do VitaView AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-5xl mx-auto">
            {[
              {
                quote: "O VitaView AI revolucionou a forma como acompanho meus pacientes crônicos. A linha do tempo visual me permite identificar padrões que passariam despercebidos em exames isolados.",
                name: "Dr. Ricardo Mendes",
                role: "Cardiologista",
                delay: 0,
                gradient: "from-[#212121] to-[#424242]",
                avatarBg: "bg-[#E0E0E0]",
                avatarText: "text-[#212121]",
                avatarBorder: "border-[#424242]",
                image: true
              },
              {
                quote: "A extração automática de dados economiza horas da minha semana. Posso focar totalmente no paciente, sabendo que os dados estão organizados e seguros.",
                name: "Dra. Juliana Costa",
                role: "Endocrinologista",
                delay: 0.1,
                gradient: "from-[#424242] to-[#212121]",
                avatarBg: "bg-[#E0E0E0]",
                avatarText: "text-[#212121]",
                avatarBorder: "border-[#424242]",
                image: true
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-xl overflow-hidden group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: testimonial.delay }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                {/* Elementos decorativos de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#48C9B0]/10 to-transparent rounded-bl-full z-0 opacity-70"></div>
                {index === 0 ? (
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#212121]/10 to-transparent rounded-tr-full z-0"></div>
                ) : (
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#9E9E9E]/10 to-transparent rounded-tr-full z-0"></div>
                )}

                {/* Barra gradiente superior */}
                <div className={`h-3 w-full bg-gradient-to-r ${testimonial.gradient}`}></div>

                <div className="p-5 md:p-8 relative z-10">
                  {/* Aspas decorativas */}
                  <div className="flex justify-start mb-4 relative">
                    <motion.svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      initial={{ opacity: 0.3, scale: 0.8 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      transition={{ duration: 0.5, delay: testimonial.delay + 0.2 }}
                    >
                      <path d="M14 24H6C6 18.5 7 11.9 14 11V17C11 17.5 10.5 19 10.5 21.5H14V24ZM28 24H20C20 18.5 21 11.9 28 11V17C25 17.5 24.5 19 24.5 21.5H28V24Z"
                        className={`fill-[${index === 0 ? '#424242' : '#212121'}]`}
                        style={{ opacity: 0.3 }}
                      />
                    </motion.svg>
                    <div className={`absolute w-12 h-1 bg-gradient-to-r ${testimonial.gradient} rounded-full bottom-0 left-0`}></div>
                  </div>

                  {/* Texto do depoimento */}
                  <p className="text-[#212121] mb-8 text-lg leading-relaxed relative">
                    {testimonial.quote}
                    <span className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#9E9E9E]/30 to-transparent rounded-full"></span>
                  </p>

                  <div className="flex items-center">
                    {/* Avatar com bordas animadas */}
                    <div className="relative">
                      {/* Círculo animado de fundo */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${testimonial.gradient} opacity-70 blur-[1px]`}
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                        }}
                      />

                      {testimonial.image ? (
                        <div className={`w-16 h-16 rounded-full ${testimonial.avatarBg} flex items-center justify-center relative z-10 border-3 ${testimonial.avatarBorder} overflow-hidden shadow-lg`}>
                          {index === 0 ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#9E9E9E]/10 to-[#212121]/10"></div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#212121]/10 to-[#9E9E9E]/10"></div>
                          )}
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${testimonial.avatarText} font-bold text-xl bg-gradient-to-br from-white/90 to-white/70 z-10`}>
                            {testimonial.name.charAt(0)}{testimonial.name.split(' ')[1]?.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative z-10 border-2 border-white">
                          <span className="text-lg font-bold text-[#212121]">{testimonial.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-5">
                      <h4 className="font-bold text-[#212121] text-lg">{testimonial.name}</h4>
                      <p className="text-[#9E9E9E] text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Avaliações em formato numérico */}
          <motion.div
            className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {[
                { label: "Avaliação média", value: "4.9/5", icon: "⭐" },
                { label: "Usuários ativos", value: "10k+", icon: "👥" },
                { label: "Exames analisados", value: "500k+", icon: "📊" },
                { label: "Recomendações", value: "98%", icon: "👍" }
              ].map((stat, index) => (
                <div key={index} className="p-6 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <h3 className="text-3xl font-bold text-[#212121] mb-1">{stat.value}</h3>
                  <p className="text-[#9E9E9E] text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>



      {/* Seção FAQ Accordions */}
      <section id="faq" className="py-12 md:py-24 bg-gradient-to-b from-[#212121] to-[#424242] text-white relative overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-20 w-64 h-64 bg-[#F4F4F4] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute left-20 bottom-10 w-72 h-72 bg-[#F4F4F4] rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
              Perguntas <span className="text-[#9E9E9E]">Frequentes</span>
            </h2>
            <p className="text-base md:text-xl text-white text-opacity-90 max-w-2xl mx-auto px-2">
              Tire suas dúvidas sobre o VitaView AI e como nossa plataforma pode ajudar você a entender melhor sua saúde.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Coluna Esquerda: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              {[
                {
                  question: "Como o VitaView AI processa os exames dos pacientes?",
                  answer: "Nossa IA extrai automaticamente dados de PDFs e imagens de exames laboratoriais, estruturando as informações em uma linha do tempo clínica. O sistema identifica valores de referência, sinaliza alterações e gera gráficos evolutivos, permitindo que você foque na análise clínica e não na digitação de dados."
                },
                {
                  question: "A plataforma garante a conformidade com a LGPD?",
                  answer: "Sim. O VitaView AI foi desenvolvido seguindo rigorosos protocolos de segurança e privacidade. Utilizamos criptografia de ponta a ponta, controle de acesso granular e trilhas de auditoria, garantindo que sua clínica esteja em total conformidade com a LGPD e normas do setor de saúde."
                },
                {
                  question: "É possível compartilhar casos com outros especialistas?",
                  answer: "Com certeza. A plataforma facilita a colaboração multidisciplinar. Você pode gerar relatórios seguros e anonimizados para discussão de casos ou compartilhar o acesso controlado ao prontuário com outros profissionais da equipe de saúde, agilizando a segunda opinião."
                },
                {
                  question: "Como a plataforma auxilia no acompanhamento de pacientes crônicos?",
                  answer: "O VitaView AI cria automaticamente gráficos de tendência para qualquer biomarcador ao longo do tempo. Isso permite visualizar rapidamente a progressão de condições crônicas, a eficácia de tratamentos e identificar padrões sutis que poderiam passar despercebidos em uma análise isolada."
                },
                {
                  question: "Quais formatos de exames são compatíveis com a importação?",
                  answer: "O sistema aceita os formatos mais comuns utilizados por laboratórios, incluindo PDF, JPG e PNG. Nossa tecnologia de OCR (Reconhecimento Óptico de Caracteres) é otimizada para layouts de laudos laboratoriais variados, garantindo alta precisão na extração dos dados."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <motion.div
                    className={`p-5 rounded-xl border ${activeFaq === index ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'} cursor-pointer transition-all duration-300 backdrop-blur-sm`}
                    onClick={() => toggleFaq(index)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold text-lg ${activeFaq === index ? 'text-[#E0E0E0]' : 'text-white'}`}>
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: activeFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${activeFaq === index ? 'bg-[#E0E0E0] text-[#212121]' : 'bg-white/10 text-white'}`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[#9E9E9E] leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Coluna Direita: Contato e Suporte */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 sticky top-24"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Estamos aqui para ajudar</h3>
                <p className="text-[#9E9E9E] mb-8">
                  Não encontrou o que procurava? Nossa equipe de suporte está pronta para atender você.
                </p>

                <div className="space-y-6">
                  <a
                    href="mailto:contato@vitaview.ai"
                    className="flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#E0E0E0]/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-[#E0E0E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-[#9E9E9E]">Email de Suporte</div>
                      <div className="text-lg font-semibold text-white group-hover:text-[#E0E0E0] transition-colors">contato@vitaview.ai</div>
                    </div>
                  </a>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <div className="w-10 h-10 mx-auto bg-[#212121]/20 rounded-full flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-[#9E9E9E]" />
                      </div>
                      <div className="text-sm font-medium text-white">Resposta em 24h</div>
                      <div className="text-xs text-[#9E9E9E] mt-1">Dias úteis</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <div className="w-10 h-10 mx-auto bg-[#212121]/20 rounded-full flex items-center justify-center mb-3">
                        <ShieldCheck className="w-5 h-5 text-[#9E9E9E]" />
                      </div>
                      <div className="text-sm font-medium text-white">Suporte Seguro</div>
                      <div className="text-xs text-[#9E9E9E] mt-1">Dados protegidos</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-sm text-[#9E9E9E] text-center mb-4">Siga-nos nas redes sociais</p>
                  <div className="flex justify-center space-x-4">
                    {['Instagram', 'Twitter'].map((social) => (
                      <a
                        key={social}
                        href={social === 'Instagram' ? "https://instagram.com/vitaview.ai" : "#"}
                        target={social === 'Instagram' ? "_blank" : undefined}
                        rel={social === 'Instagram' ? "noopener noreferrer" : undefined}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E0E0E0] hover:text-[#212121] transition-all duration-300"
                      >
                        <span className="sr-only">{social}</span>
                        {social === 'Instagram' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>}
                        {social === 'Twitter' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#212121] text-[#9E9E9E] py-10 md:py-12 relative overflow-hidden">
        {/* Elementos decorativos do footer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-[#424242] rounded-full opacity-5 blur-3xl"
            animate={{
              x: [0, 10, 0],
              y: [0, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-[#212121] rounded-full opacity-5 blur-3xl"
            animate={{
              x: [0, -10, 0],
              y: [0, 10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="flex flex-col md:flex-row justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="mb-6 md:mb-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center mb-4">
                <Logo variant="icon" size="sm" showText={false} className="mr-3" />
                <span className="text-xl font-bold text-white">VitaView AI</span>
              </div>
              <p className="max-w-xs">
                A evolução da sua saúde começa com o entendimento dos seus exames.
              </p>

              {/* Inscrição na newsletter */}
              <div className="mt-6 hidden md:block">
                <p className="text-sm mb-2 font-medium text-[#9E9E9E]">Fique atualizado:</p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    className="bg-[#212121] border border-[#424242] px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#212121] text-white w-full max-w-[200px]"
                  />
                  <motion.button
                    className="bg-[#212121] hover:bg-[#424242] px-3 py-2 rounded-r-md text-white text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-white font-semibold mb-4">Plataforma</h3>
                <ul className="space-y-2">
                  {[
                    { label: "View Laboratorial", href: "#como-funciona" },
                    { label: "Vita Timeline", href: "#demonstracoes" },
                    { label: "FAQ", href: "#faq" }
                  ].map((item, i) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + (i * 0.05) }}
                    >
                      <motion.a
                        href={item.href}
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-white font-semibold mb-4">Contato</h3>
                <ul className="space-y-2">
                  {[
                    { label: "contato@vitaview.ai", href: "mailto:contato@vitaview.ai" },
                    { label: "Instagram", href: "https://instagram.com/vitaview.ai" }
                  ].map((item, i) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 + (i * 0.05) }}
                    >
                      <motion.a
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Termos de Uso", href: "/termos" },
                    { label: "Privacidade", href: "/privacidade" },
                    { label: "Segurança", href: "#beneficios" }
                  ].map((item, i) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + (i * 0.05) }}
                    >
                      <motion.a
                        href={item.href}
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <p>&copy; {new Date().getFullYear()} VitaView AI. Todos os direitos reservados.</p>
            <div className="flex justify-center mt-4 md:mt-0">
              <motion.a
                href="https://instagram.com/vitaview.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9E9E9E] hover:text-white transition-colors group"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 }}
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span className="text-sm font-medium group-hover:text-[#E0E0E0] transition-colors">
                    @vitaview.ai
                  </span>
                </div>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </footer>

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