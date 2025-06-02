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
  X,
  ChevronDown,
  Mail,
  Phone,
  Lock,
  MessageSquare,
  Lightbulb,
  LifeBuoy,
  AlertCircle,
  InfoIcon,
  HelpCircle,
  Share,
  Check,
  Star,
  MapPin,
  Cookie
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
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Gradient shapes with reduced opacity and controlled positioning */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-indigo-100 rounded-full opacity-15 blur-3xl"></div>
        


      </div>
      
      {/* Navbar - improved with backdrop filter and better shadow */}
      <motion.nav 
        className="bg-white shadow-md py-3 fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-12 h-12 flex items-center justify-center mr-3 overflow-hidden">
                <img src="/assets/vitaview_logo_only_2k.png" alt="VitaView Logo" className="w-20 h-20 object-cover transform scale-125" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-[#1E3A5F]">VitaView</span>
                  <span className="text-[#448C9B] text-xl ml-1">AI</span>
                </span>

              </div>
            </motion.div>
          </Link>
          
          {/* Desktop navigation with enhanced hover effects */}
          <div className="hidden md:flex space-x-8 text-gray-700">
            {[
              {id: "demonstracoes", label: "Demonstrações"},
              {id: "como-funciona", label: "Como Funciona"},
              {id: "beneficios", label: "Benefícios"},
              {id: "para-quem", label: "Para Quem"},
              {id: "depoimentos", label: "Depoimentos"}
            ].map((item) => (
              <motion.a 
                key={item.id}
                href={`#${item.id}`} 
                className="hover:text-[#448C9B] transition-colors relative group py-2 text-sm font-medium"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#448C9B] group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>
          
          {/* Mobile access button - only visible on mobile */}
          <div className="md:hidden">
            <Link href="/auth">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4F7C] hover:from-[#152D48] hover:to-[#1E3A5F] shadow-md text-white"
              >
                Acessar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Login/Access button with improved animation */}
          <motion.div
            className="hidden md:block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth">
              <Button variant="default" className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4F7C] hover:from-[#152D48] hover:to-[#1E3A5F] shadow-md text-white px-6 py-2">
                Acessar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section - increased top padding to avoid header overlap */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-16 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-white to-[#E0E9F5]">
        <motion.div 
          className="flex flex-col md:flex-row items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="md:w-1/2 mb-10 md:mb-0 md:pr-8" variants={itemVariants}>

            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              <span className="text-[#1E3A5F] tracking-tight">VitaView</span><span className="text-[#448C9B] ml-1">AI</span>: Entenda seus exames com clareza e precisão
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
              Todos os seus exames e informações de saúde reunidos em um só lugar, sempre ao seu alcance. Faça upload em PDF ou imagem e obtenha análises detalhadas, alertas personalizados e acompanhamento visual da sua saúde.
            </p>
            
            {/* Benefícios em lista */}
            <div className="mb-8 space-y-3">
              {[
                { icon: <Shield className="h-5 w-5 text-green-500" />, text: "Tecnologia segura e com proteção de dados" },
                { icon: <Brain className="h-5 w-5 text-purple-500" />, text: "Algoritmos de IA treinados com milhares de exames" },
                { icon: <LineChart className="h-5 w-5 text-blue-500" />, text: "Visualize tendências dos seus indicadores de saúde" }
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <div className="flex-shrink-0 p-1.5 bg-white rounded-full shadow-sm">
                    {item.icon}
                  </div>
                  <p className="text-gray-700">{item.text}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Estatísticas animadas */}
            <div className="grid grid-cols-3 gap-4 mb-8 hidden md:grid">
              <motion.div 
                className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">98%</h3>
                <p className="text-sm text-gray-600">Precisão</p>
              </motion.div>
              <motion.div 
                className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">10x</h3>
                <p className="text-sm text-gray-600">Mais rápido</p>
              </motion.div>
              <motion.div 
                className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">24/7</h3>
                <p className="text-sm text-gray-600">Disponível</p>
              </motion.div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button size="lg" className="bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-primary-950 px-8 py-6 rounded-lg shadow-lg w-full sm:w-auto font-medium border border-primary-300">
                    Criar conta gratuita
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-6 rounded-lg flex items-center font-medium">
                  <Play className="mr-2 h-5 w-5" /> Ver demonstração
                </Button>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="md:w-1/2 flex justify-center relative mt-10 md:mt-0"
            variants={itemVariants}
          >
            {/* Elemento decorativo */}
            <div className="absolute -z-10 w-64 h-64 bg-primary-100 rounded-full opacity-50 blur-xl -top-10 -right-10"></div>
            
            {/* Imagem principal com sobreposição de elementos */}
            <div className="relative w-full max-w-[600px]">
              {/* Dashboard mockup simulado - design mais próximo do real */}
              <motion.div 
                className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10] hidden md:block"
                whileHover={{ 
                  rotate: 2,
                  transition: { duration: 0.3 }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Header do dashboard */}
                <div className="bg-primary-700 h-12 flex items-center px-4 text-white">
                  <Activity className="h-5 w-5 mr-2" />
                  <span className="font-medium">Dashboard de Saúde - Maria Silva</span>
                  <div className="ml-auto flex space-x-2">
                    <Bell className="h-4 w-4" />
                    <Settings className="h-4 w-4" />
                    <UserCircle className="h-4 w-4" />
                  </div>
                </div>
                
                {/* Conteúdo do dashboard */}
                <div className="p-4 bg-gray-50 h-full">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-gray-600">Índice de Saúde</h4>
                        <Heart className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-700 font-bold text-xl mr-3">
                          87
                        </div>
                        <div className="text-xs">
                          <div className="text-green-600 font-medium">Excelente</div>
                          <div className="text-gray-500">+3 desde o último mês</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-gray-600">Exames</h4>
                        <FileText className="h-4 w-4 text-primary-500" />
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xl mr-3">
                          12
                        </div>
                        <div className="text-xs">
                          <div className="text-blue-600 font-medium">Digitalizados</div>
                          <div className="text-gray-500">3 pendentes de análise</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-gray-600">Alertas</h4>
                        <Bell className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 font-bold text-xl mr-3">
                          2
                        </div>
                        <div className="text-xs">
                          <div className="text-amber-600 font-medium">Verificar</div>
                          <div className="text-gray-500">Glicemia e Triglicerídeos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gráfico principal */}
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-4 relative h-28">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Evolução dos Principais Parâmetros</h4>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                        <span className="text-gray-500 mr-2">Glicemia</span>
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        <span className="text-gray-500 mr-2">Colesterol</span>
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        <span className="text-gray-500">Hemoglobina</span>
                      </div>
                    </div>
                    
                    {/* Gráfico simulado com CSS */}
                    <div className="relative h-16 mt-1 border-b border-gray-200 flex items-end pb-1">
                      {/* Linha de base e horizontal */}
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200"></div>
                      
                      {/* Pontos representando valores do gráfico para Glicemia */}
                      <div className="absolute bottom-0 left-0 h-full w-full flex justify-between items-end">
                        <div style={{ height: '30%' }} className="w-px bg-primary-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-primary-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '45%' }} className="w-px bg-primary-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-primary-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '35%' }} className="w-px bg-primary-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-primary-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '60%' }} className="w-px bg-primary-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-primary-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '50%' }} className="w-px bg-primary-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-primary-500 -ml-0.5"></div>
                        </div>
                      </div>
                      
                      {/* Pontos representando valores do gráfico para Colesterol */}
                      <div className="absolute bottom-0 left-0 h-full w-full flex justify-between items-end" style={{ transform: 'translateX(3px)' }}>
                        <div style={{ height: '60%' }} className="w-px bg-red-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-red-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '55%' }} className="w-px bg-red-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-red-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '40%' }} className="w-px bg-red-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-red-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '35%' }} className="w-px bg-red-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-red-500 -ml-0.5"></div>
                        </div>
                        <div style={{ height: '25%' }} className="w-px bg-red-500 relative">
                          <div className="absolute bottom-full h-1.5 w-1.5 rounded-full bg-red-500 -ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Mar</span>
                      <span>Abr</span>
                      <span>Mai</span>
                      <span>Jun</span>
                      <span>Jul</span>
                    </div>
                  </div>
                  
                  {/* Miniaturas de exames recentes */}
                  <div className="flex space-x-2 overflow-x-auto">
                    <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-gray-100 w-40">
                      <div className="flex items-center mb-2">
                        <FileText className="h-3 w-3 text-primary-500 mr-1" />
                        <h5 className="text-xs font-medium text-gray-700 truncate">Hemograma Completo</h5>
                      </div>
                      <div className="h-5 flex items-center">
                        <div className="h-1.5 rounded-full bg-green-100 w-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-xs text-green-700 ml-2">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-gray-100 w-40">
                      <div className="flex items-center mb-2">
                        <FileText className="h-3 w-3 text-primary-500 mr-1" />
                        <h5 className="text-xs font-medium text-gray-700 truncate">Perfil Lipídico</h5>
                      </div>
                      <div className="h-5 flex items-center">
                        <div className="h-1.5 rounded-full bg-amber-100 w-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '63%' }}></div>
                        </div>
                        <span className="text-xs text-amber-700 ml-2">63%</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-gray-100 w-40">
                      <div className="flex items-center mb-2">
                        <FileText className="h-3 w-3 text-primary-500 mr-1" />
                        <h5 className="text-xs font-medium text-gray-700 truncate">Glicemia</h5>
                      </div>
                      <div className="h-5 flex items-center">
                        <div className="h-1.5 rounded-full bg-red-100 w-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                        <span className="text-xs text-red-700 ml-2">42%</span>
                      </div>
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
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">Colesterol: <span className="text-green-500">Ótimo</span></span>
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
                <div className="flex items-center space-x-2">
                  <BarChart4 className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Glicemia: <span className="text-amber-500">Atenção</span></span>
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
                <Sparkles className="w-6 h-6 text-amber-400" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Badges flutuantes na parte de baixo */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4 py-2 px-6 bg-white bg-opacity-80 backdrop-blur-sm rounded-t-xl shadow-sm text-xs md:text-sm text-gray-600 hidden sm:flex">
          <span className="flex items-center">
            <Shield className="w-4 h-4 mr-1 text-primary-600" /> Dados protegidos
          </span>
          <span className="flex items-center">
            <Brain className="w-4 h-4 mr-1 text-primary-600" /> Análise com IA
          </span>
          <span className="flex items-center">
            <FlaskConical className="w-4 h-4 mr-1 text-primary-600" /> Interpretação médica
          </span>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16 mt-[-3rem] hidden relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Você já recebeu um exame e ficou sem saber o que ele realmente significava?
            </h2>
            <p className="text-xl max-w-3xl mx-auto mb-10">
              A interpretação de exames ainda é um mistério para muitas pessoas. Com o VitaView AI, você transforma números e siglas em informações compreensíveis e ações de saúde claras.
            </p>
            
            {/* Ícones animados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-12">
              {[
                { icon: <Search className="w-8 h-8 text-white" />, text: "Busca inteligente em exames" },
                { icon: <FileBarChart className="w-8 h-8 text-white" />, text: "Análise detalhada de valores" },
                { icon: <TrendingUp className="w-8 h-8 text-white" />, text: "Acompanhamento de tendências" },
                { icon: <Zap className="w-8 h-8 text-white" />, text: "Alertas em tempo real" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3"
                    whileHover={{ 
                      scale: 1.1,
                      backgroundColor: "rgba(255,255,255,0.2)"
                    }}
                  >
                    {item.icon}
                  </motion.div>
                  <p className="text-sm font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Simulação de Relatórios Section */}
      <section id="demonstracoes" className="py-16 mt-[0] bg-gradient-to-br from-[#2A4F7C] to-[#1E3A5F] text-white relative overflow-hidden">
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
              className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Visualização Inteligente
            </motion.span>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Relatórios Detalhados e Análises Precisas</h2>
            <p className="text-lg text-white text-opacity-90 max-w-3xl mx-auto">
              Visualize seus exames com clareza e obtenha insights que vão além dos números, com apresentação intuitiva e contexto clínico completo.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Relatório de Exame Simulado */}
            <motion.div 
              className="rounded-xl shadow-xl bg-white overflow-hidden"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.1)" }}
            >
              {/* Header do relatório */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Hemograma Completo</h3>
                    <p className="text-sm opacity-90">Data: 15/04/2025</p>
                  </div>
                  <div className="flex space-x-2">
                    <div className="p-1.5 bg-white bg-opacity-20 rounded-md">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    <div className="p-1.5 bg-white bg-opacity-20 rounded-md">
                      <ExternalLink className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Índice de saúde para este exame */}
              <div className="p-4 bg-green-50 border-b border-green-100">
                <div className="flex items-center">
                  <div className="mr-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 border-4 border-green-200">
                      <span className="text-xl font-bold text-green-700">92</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Índice de Saúde Excelente</h4>
                    <p className="text-sm text-green-700">
                      Seus resultados indicam um ótimo estado de saúde. Continue assim!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo principal do relatório */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Principais Parâmetros</h4>
                  
                  {/* Lista de métricas */}
                  <div className="space-y-4">
                    {/* Métrica 1 */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Hemoglobina</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700">14.2 g/dL</span>
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Normal</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="relative w-full h-full">
                          {/* Faixa de referência */}
                          <div className="absolute h-full w-1/2 bg-green-200 left-1/4"></div>
                          {/* Posição do valor atual */}
                          <div className="absolute h-4 w-4 bg-green-500 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2" style={{ left: '55%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>12.0</span>
                        <span>Referência: 12.0-16.0 g/dL</span>
                        <span>16.0</span>
                      </div>
                    </div>
                    
                    {/* Métrica 2 */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Glicose</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700">100 mg/dL</span>
                          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Atenção</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="relative w-full h-full">
                          {/* Faixa de referência */}
                          <div className="absolute h-full w-1/3 bg-green-200 left-1/4"></div>
                          {/* Posição do valor atual */}
                          <div className="absolute h-4 w-4 bg-yellow-500 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2" style={{ left: '60%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>70</span>
                        <span>Referência: 70-99 mg/dL</span>
                        <span>120</span>
                      </div>
                    </div>
                    
                    {/* Métrica 3 */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Colesterol Total</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700">165 mg/dL</span>
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Normal</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="relative w-full h-full">
                          {/* Faixa de referência */}
                          <div className="absolute h-full w-1/2 bg-green-200 left-1/5"></div>
                          {/* Posição do valor atual */}
                          <div className="absolute h-4 w-4 bg-green-500 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2" style={{ left: '40%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>120</span>
                        <span>Referência: 150-199 mg/dL</span>
                        <span>260</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resumo da IA */}
                <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                  <div className="flex items-start">
                    <div className="p-2 bg-primary-100 rounded-full mr-3">
                      <Brain className="h-5 w-5 text-primary-500" />
                    </div>
                    <div>
                      <h5 className="font-medium text-primary-800 mb-1">Análise da IA</h5>
                      <p className="text-sm text-gray-700 text-center leading-relaxed">
                        Seus exames apresentam resultados dentro dos valores normais. A glicose encontra-se no limite superior de referência - recomendamos acompanhamento médico e cuidados com a alimentação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-6">
              <motion.div 
                className="text-left"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-2xl font-bold text-white mb-3">Entenda seus exames como nunca antes</h3>
                <p className="text-lg text-white text-opacity-90 mb-6">
                  Nossos relatórios transformam dados técnicos em informações compreensíveis, ajudando você a entender:
                </p>
                
                <ul className="space-y-4">
                  {[
                    {
                      icon: <GraduationCap className="h-5 w-5 text-primary-600" />,
                      title: "Contexto Clínico",
                      description: "Cada métrica vem acompanhada de uma explicação sobre o que ela significa para sua saúde."
                    },
                    {
                      icon: <LineChart className="h-5 w-5 text-primary-600" />,
                      title: "Análise de Tendências",
                      description: "Acompanhe a evolução dos seus resultados ao longo do tempo e identifique padrões."
                    },
                    {
                      icon: <Bell className="h-5 w-5 text-primary-600" />,
                      title: "Alertas Inteligentes",
                      description: "Receba notificações contextualizadas quando algum parâmetro necessitar atenção."
                    },
                    {
                      icon: <FileHeart className="h-5 w-5 text-primary-600" />,
                      title: "Recomendações Personalizadas",
                      description: "Sugestões customizadas com base em seu histórico e perfil de saúde."
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
                      <div className="p-2 bg-primary-100 rounded-full mr-3 mt-0.5">
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
          </div>
        </div>
      </section>
      
      {/* Simulação de Histórico de Exames */}
      <section className="py-16 bg-[#448C9B] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Histórico Completo e Acessível</h2>
            <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto">
              Organize todos os seus exames em um só lugar, com acesso rápido e categorização automática.
            </p>
          </motion.div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar de filtros */}
            <motion.div 
              className="lg:w-1/4 bg-white p-5 rounded-xl shadow-md border border-gray-100"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-medium text-lg text-gray-800 mb-4">Filtros</h3>
              
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tipo de Exame</h4>
                  <div className="space-y-2">
                    {["Hemograma", "Glicemia", "Colesterol", "Tireoide", "Vitaminas", "Outros"].map((type, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-4 h-4 rounded border ${i < 3 ? 'bg-primary-100 border-primary-300' : 'border-gray-300'}`}>
                          {i < 3 && <CheckCircle2 className="h-3 w-3 text-primary-500" />}
                        </div>
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Período</h4>
                  <div className="flex items-center p-2 bg-primary-50 rounded-md border border-primary-100 text-sm text-primary-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Últimos 12 meses</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                  <div className="space-y-2">
                    {[
                      { name: "Normal", color: "bg-green-100 border-green-300" },
                      { name: "Atenção", color: "bg-yellow-100 border-yellow-300" },
                      { name: "Alterado", color: "bg-red-100 border-red-300" }
                    ].map((status, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-4 h-4 rounded border ${status.color}`}></div>
                        <span className="ml-2 text-sm text-gray-700">{status.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <button className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Lista de exames */}
            <motion.div 
              className="lg:w-3/4 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium text-gray-800">Seus Exames (12)</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Ordenar por:</span>
                  <select className="ml-2 p-1 border border-gray-200 rounded bg-white">
                    <option>Data (recente)</option>
                    <option>Tipo</option>
                    <option>Status</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {[
                  { 
                    name: "Hemograma Completo",
                    date: "15/04/2025",
                    lab: "Laboratório Central",
                    status: "Normal",
                    statusColor: "bg-green-100 text-green-800 border-green-200",
                    highlight: true
                  },
                  { 
                    name: "Perfil Lipídico",
                    date: "15/04/2025",
                    lab: "Laboratório Central",
                    status: "Atenção",
                    statusColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    highlight: true
                  },
                  { 
                    name: "Glicemia em Jejum",
                    date: "15/04/2025",
                    lab: "Laboratório Central",
                    status: "Atenção",
                    statusColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    highlight: true
                  },
                  { 
                    name: "TSH e T4 Livre",
                    date: "10/02/2025",
                    lab: "Laboratório QualiVida",
                    status: "Normal",
                    statusColor: "bg-green-100 text-green-800 border-green-200"
                  },
                  { 
                    name: "Vitamina D",
                    date: "10/02/2025",
                    lab: "Laboratório QualiVida",
                    status: "Alterado",
                    statusColor: "bg-red-100 text-red-800 border-red-200"
                  }
                ].map((exam, i) => (
                  <motion.div 
                    key={i}
                    className={`p-4 flex items-center justify-between transition-colors ${exam.highlight ? 'hover:bg-primary-50' : 'hover:bg-gray-50'}`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <div className={`p-2.5 rounded-lg mr-3 ${
                        exam.name.includes("Hemograma") ? "bg-blue-100" :
                        exam.name.includes("Lipídico") ? "bg-purple-100" :
                        exam.name.includes("Glicemia") ? "bg-amber-100" :
                        exam.name.includes("TSH") ? "bg-cyan-100" : "bg-emerald-100"
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          exam.name.includes("Hemograma") ? "text-blue-600" :
                          exam.name.includes("Lipídico") ? "text-purple-600" :
                          exam.name.includes("Glicemia") ? "text-amber-600" :
                          exam.name.includes("TSH") ? "text-cyan-600" : "text-emerald-600"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{exam.name}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>{exam.date}</span>
                          <span className="mx-2">•</span>
                          <Building className="h-3.5 w-3.5 mr-1" />
                          <span>{exam.lab}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${exam.statusColor}`}>
                        {exam.status}
                      </span>
                      <button className="ml-4 p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-primary-50">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  Ver todos os exames
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </motion.div>
          </div>
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
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Simples e Intuitivo
            </motion.span>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Como Funciona o <span className="text-[#1E3A5F]">VitaView</span> <span className="text-[#448C9B]">AI</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Nossa plataforma transforma documentos médicos complexos em informações claras e úteis para sua saúde
            </p>
          </motion.div>
          
          {/* Timeline visual do processo */}
          <div className="relative max-w-5xl mx-auto pb-8">
            {/* Linha do tempo conectando os passos */}
            <div className="absolute hidden md:block top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 rounded-full"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
              {[
                {
                  icon: <FileText className="w-6 h-6 text-primary-600" />,
                  title: "Carregue seus Exames",
                  description: "Faça upload de PDFs ou fotografias dos seus exames de laboratório diretamente através da plataforma.",
                  badge: "Passo 1"
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-primary-600" />,
                  title: "Processamento com IA",
                  description: "Nossos algoritmos avançados extraem e organizam automaticamente todos os seus dados médicos.",
                  badge: "Passo 2"
                },
                {
                  icon: <BookOpen className="w-6 h-6 text-primary-600" />,
                  title: "Análise Detalhada",
                  description: "O sistema interpreta os valores com contexto médico e identifica alterações relevantes para sua saúde.",
                  badge: "Passo 3"
                },
                {
                  icon: <LineChart className="w-6 h-6 text-primary-600" />,
                  title: "Visualização Inteligente",
                  description: "Acesse gráficos, históricos e um panorama completo da evolução dos seus indicadores de saúde.",
                  badge: "Passo 4"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  {/* Círculo na linha do tempo */}
                  <div className="hidden md:flex absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-white border-4 border-primary-400 flex items-center justify-center shadow-md"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", delay: 0.3 + index * 0.1 }}
                    >
                      <span className="text-sm font-bold text-primary-700">{index + 1}</span>
                    </motion.div>
                  </div>
                  
                  {/* Card do passo */}
                  <motion.div
                    className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full relative overflow-hidden border border-gray-100"
                    whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.1)" }}
                  >
                    {/* Badge do passo (visível apenas em mobile) */}
                    <div className="md:hidden inline-block px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mb-4">
                      {step.badge}
                    </div>
                    
                    <div className="rounded-full p-3 bg-primary-50 mb-5 w-14 h-14 flex items-center justify-center">
                      {step.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    
                    {/* Seta indicando próximo passo (visível apenas em desktop) */}
                    {index < 3 && (
                      <motion.div 
                        className="absolute hidden md:block"
                        style={{
                          top: '45%',
                          right: -18,
                          zIndex: 10
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <div className="bg-white rounded-full p-1 shadow-md">
                          <ChevronRight className="w-5 h-5 text-primary-500" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* CTA após explicação dos passos */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/auth?tab=register">
              <button 
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-lg"
              >
                Comece agora gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="pt-12 pb-24 bg-gradient-to-b from-[#1E3A5F] to-[#152D48] text-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -bottom-20 w-96 h-96 bg-primary-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-1/3 -top-48 w-64 h-64 bg-green-50 rounded-full opacity-30 blur-3xl"></div>
          

        </div>
      
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Clock className="w-6 h-6 text-[#1E3A5F]" />,
                title: "Histórico cronológico",
                description: "Seus exames organizados automaticamente por data, com categorização inteligente para fácil acesso.",
                delay: 0
              },
              {
                icon: <BellRing className="w-6 h-6 text-amber-500" />,
                title: "Alertas inteligentes",
                description: "Receba notificações personalizadas quando houver valores que precisam de atenção especial.",
                delay: 0.1
              },
              {
                icon: <BookOpen className="w-6 h-6 text-blue-600" />,
                title: "Linguagem acessível",
                description: "Exames médicos traduzidos para termos compreensíveis, facilitando o entendimento dos resultados.",
                delay: 0.2
              },
              {
                icon: <AreaChart className="w-6 h-6 text-purple-600" />,
                title: "Evolução visual",
                description: "Visualize a progressão dos seus indicadores ao longo do tempo com gráficos interativos e claros.",
                delay: 0.3
              },
              {
                icon: <HeartPulse className="w-6 h-6 text-red-500" />,
                title: "Integração com médicos",
                description: "Compartilhe seus históricos e relatórios diretamente com seus profissionais de saúde.",
                delay: 0.4
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
                title: "Privacidade garantida",
                description: "Seus dados são protegidos por criptografia avançada e nunca são compartilhados sem permissão.",
                delay: 0.5
              },
            ].map((benefit, index) => (
              <motion.div 
                key={index}
                className="relative bg-white p-7 rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:border-primary-300 group"
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
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center mb-5 group-hover:from-primary-50 group-hover:to-primary-100 group-hover:border-primary-200 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    {benefit.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 mb-4 text-sm">
                  {benefit.description}
                </p>
                
                {/* Indicador de hover */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-300 ease-out"></div>
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
                className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white border-2 border-white px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                size="lg"
              >
                Comece Sua Jornada de Saúde
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Whom Section */}
      {/* Seção: Para quem é o VitaView AI */}
      <section id="para-quem" className="py-20 bg-gradient-to-r from-[#5AADBF] to-[#448C9B] text-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 bottom-0 w-96 h-96 bg-blue-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute right-0 top-1/4 w-80 h-80 bg-indigo-50 rounded-full opacity-20 blur-3xl"></div>
          <motion.div 
            className="absolute top-1/2 left-1/3 w-8 h-8 bg-primary-100 rounded-full opacity-50"
            animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Título da seção */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 mb-4">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Conheça nosso público</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              O <span className="text-white">VitaView AI</span> é para você
            </h2>
            <p className="text-lg text-white text-opacity-90 max-w-2xl mx-auto">
              Nossa plataforma foi desenvolvida para atender diferentes necessidades,
              criando valor em cada etapa da jornada de saúde.
            </p>
          </motion.div>
          
          {/* Cards de público-alvo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Card 1: Pacientes Crônicos */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-red-500"></div>
              
              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-7 w-7 text-red-600" />
                </div>
                
                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Pacientes Crônicos</h3>
                
                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Acompanhamento detalhado de exames periódicos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Monitoramento de valores e tendências</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Alertas para resultados fora do padrão</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* Card 2: Famílias */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              
              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-indigo-600" />
                </div>
                
                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Famílias</h3>
                
                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Histórico familiar centralizado em um só lugar</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Compartilhamento seguro de resultados</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Gerenciamento de saúde de dependentes</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* Card 3: Profissionais de Saúde */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              
              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FileHeart className="h-7 w-7 text-blue-600" />
                </div>
                
                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Profissionais de Saúde</h3>
                
                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Visão completa do histórico do paciente</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Análises comparativas entre exames</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Consultas mais eficientes e focadas</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* Card 4: Clínicas e Planos de Saúde */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden group border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {/* Barra superior colorida */}
              <div className="h-2 bg-gradient-to-r from-sky-500 to-sky-600"></div>
              
              <div className="p-6">
                {/* Ícone com fundo */}
                <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-7 w-7 text-sky-600" />
                </div>
                
                {/* Título do card */}
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Clínicas e Planos</h3>
                
                {/* Lista de benefícios */}
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-sky-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Ferramenta para engajamento de pacientes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-sky-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Melhoria na experiência do usuário</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-sky-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">Acompanhamento preventivo eficiente</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Estatística 1 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#E8F8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-[#1E3A5F]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A5F] mb-2">9/10</h3>
              <p className="text-gray-700 font-medium">Usuários entendem melhor seus exames</p>
            </motion.div>
            
            {/* Estatística 2 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#E8F8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#48C9B0]" />
              </div>
              <h3 className="text-3xl font-bold text-[#48C9B0] mb-2">5min</h3>
              <p className="text-gray-700 font-medium">Tempo médio para obter interpretação</p>
            </motion.div>
            
            {/* Estatística 3 */}
            <motion.div
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 30px -15px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 bg-[#E8F8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-[#1E3A5F]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A5F] mb-2">100%</h3>
              <p className="text-gray-700 font-medium">Seguro e em conformidade com a LGPD</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Nova seção de demonstrações interativas */}
      <section id="demonstracoes" className="py-20 bg-[#A0D8EF] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 mb-4">
              <Play className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Demonstrações interativas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Explore exemplos reais de como o VitaView AI funciona
            </h2>
            <p className="text-xl text-primary-800">
              Veja simulações de exames reais e como nossa plataforma fornece insights valiosos.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Demo 1: Upload e extração */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-700"></div>
              <div className="p-6">
                <div className="rounded-full bg-primary-100 w-12 h-12 flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="h-5 w-5 text-primary-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Upload e extração inteligente</h3>
                <p className="text-gray-600 mb-5">A IA analisa seu exame e extrai automaticamente todos os dados relevantes.</p>
                
                {/* Demonstração animada de upload e extração */}
                <div className="relative p-4 bg-gray-50 rounded-lg mb-5 border border-gray-200 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700">Simulação de extração:</div>
                    <div className="text-xs text-gray-400">processando...</div>
                  </div>
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 2,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="h-2 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mb-4"
                  ></motion.div>
                  
                  <div className="space-y-3">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-between text-xs bg-white p-2 rounded border border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">Hemoglobina:</span>
                      <span className="font-semibold text-primary-700">14.2 g/dL</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                      className="flex justify-between text-xs bg-white p-2 rounded border border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">Glicemia:</span>
                      <span className="font-semibold text-primary-700">92 mg/dL</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.1 }}
                      className="flex justify-between text-xs bg-white p-2 rounded border border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">Colesterol total:</span>
                      <span className="font-semibold text-primary-700">198 mg/dL</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 }}
                      className="flex justify-between text-xs bg-white p-2 rounded border border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">Triglicérides:</span>
                      <span className="font-semibold text-primary-700">120 mg/dL</span>
                    </motion.div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" className="text-xs font-medium shadow-sm">
                    Ver mais detalhes <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Demo 2: Análise e contexto */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="p-6">
                <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 shadow-sm">
                  <Brain className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Análise contextualizada</h3>
                <p className="text-gray-600 mb-5">Nossa IA analisa seus resultados considerando seu histórico e perfil médico.</p>
                
                {/* Demonstração de análise contextualizada */}
                <div className="relative p-4 bg-gray-50 rounded-lg mb-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700">Interpretação inteligente:</div>
                    <div className="text-xs text-blue-600 font-medium">IA Avançada</div>
                  </div>
                  
                  <div className="rounded-lg bg-white p-3 border border-gray-200 mb-3 shadow-sm">
                    <div className="flex items-start mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                        <Brain className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-800">Análise da Glicemia</div>
                        <motion.div 
                          initial={{ width: 0, opacity: 0 }}
                          whileInView={{ width: "100%", opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5 }}
                          className="text-xs text-gray-600 mt-1"
                        >
                          Seu nível de glicose está dentro da faixa normal (70-99 mg/dL), indicando controle glicêmico adequado.
                        </motion.div>
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      whileInView={{ opacity: 1, height: "auto" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      <div className="ml-10 pl-2 border-l border-dashed border-indigo-200 mt-2">
                        <div className="text-xs text-indigo-700 font-medium mb-2">Comparação com exames anteriores:</div>
                        <div className="flex items-center">
                          <div className="h-3 bg-gradient-to-r from-indigo-200 to-indigo-500 rounded-full w-full">
                            <div className="relative">
                              <div className="absolute top-3 left-1/4 h-3 w-0.5 bg-indigo-700"></div>
                              <div className="absolute top-7 left-1/4 text-xs text-indigo-800 -ml-3 font-medium">90</div>
                              
                              <div className="absolute top-3 left-1/2 h-3 w-0.5 bg-indigo-700"></div>
                              <div className="absolute top-7 left-1/2 text-xs text-indigo-800 -ml-3 font-medium">95</div>
                              
                              <div className="absolute top-3 left-3/4 h-3 w-0.5 bg-indigo-700"></div>
                              <div className="absolute top-7 left-3/4 text-xs text-indigo-800 -ml-3 font-medium">92</div>
                            </div>
                          </div>
                        </div>
                        <div className="h-8"></div> {/* Espaço para acomodar os rótulos */}
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2 }}
                    className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div className="flex items-center">
                      <Sparkles className="h-3 w-3 text-blue-700 mr-1" />
                      <span className="text-xs font-medium text-blue-800">IA sugere:</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Manter alimentação equilibrada e atividade física regular.
                    </div>
                  </motion.div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" className="text-xs font-medium shadow-sm">
                    Ver mais análises <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Demo 3: Visualização histórica */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="p-6">
                <div className="rounded-full bg-amber-100 w-12 h-12 flex items-center justify-center mb-4 shadow-sm">
                  <LineChart className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Visualização histórica</h3>
                <p className="text-gray-600 mb-5">Acompanhe a evolução dos seus exames ao longo do tempo com gráficos interativos.</p>
                
                {/* Demonstração de visualização histórica */}
                <div className="relative p-4 bg-gray-50 rounded-lg mb-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700">Timeline de exames:</div>
                    <div className="text-xs text-amber-600 font-medium">Histórico Completo</div>
                  </div>
                  
                  <div className="relative pl-2">
                    {/* Linha de tempo vertical mais espessa e colorida */}
                    <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 via-primary-300 to-blue-300 rounded-full z-0"></div>
                    
                    <div className="space-y-4 relative z-10 pl-4">
                      <motion.div 
                        initial={{ opacity: 0, x: -10, y: 10 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="absolute -left-8 w-8 h-8 rounded-full bg-amber-500 shadow-md flex items-center justify-center text-white text-xs font-bold">
                          3
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100 ml-2">
                          <div className="text-xs font-semibold text-amber-800">Mai 2025</div>
                          <div className="text-xs text-gray-600">Hemograma completo</div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: -10, y: 10 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative"
                      >
                        <div className="absolute -left-8 w-8 h-8 rounded-full bg-primary-500 shadow-md flex items-center justify-center text-white text-xs font-bold">
                          2
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-primary-100 ml-2">
                          <div className="text-xs font-semibold text-primary-800">Mar 2025</div>
                          <div className="text-xs text-gray-600">Perfil lipídico</div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: -10, y: 10 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="relative"
                      >
                        <div className="absolute -left-8 w-8 h-8 rounded-full bg-blue-500 shadow-md flex items-center justify-center text-white text-xs font-bold">
                          1
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100 ml-2">
                          <div className="text-xs font-semibold text-blue-800">Jan 2025</div>
                          <div className="text-xs text-gray-600">Glicemia em jejum</div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" className="text-xs font-medium shadow-sm">
                    Ver histórico completo <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="flex justify-center">
            <Link href="/auth?tab=register">
              <Button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
                Experimente grátis <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 bg-[#A5E1D2] relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-10 w-72 h-72 bg-primary-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-0 bottom-10 w-64 h-64 bg-blue-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50 rounded-full opacity-20 blur-3xl"></div>
          
          {/* Elementos decorativos minimalistas */}
          <div className="absolute top-20 left-[15%] w-3 h-3 bg-primary-300 rounded-full opacity-70"></div>
          <div className="absolute top-1/2 right-[10%] w-5 h-5 bg-blue-300 rounded-full opacity-70"></div>
          <div className="absolute bottom-40 left-[30%] w-4 h-4 bg-indigo-300 rounded-full opacity-70"></div>
        </div>
      
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              O Que Dizem Nossos <span className="text-primary-600">Usuários</span>
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Centenas de pessoas já transformaram sua relação com a saúde através do VitaView AI.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {[
              {
                quote: "O VitaView AI me ajudou a entender como meus exames evoluíram nos últimos anos. Hoje, me sinto no controle da minha saúde.",
                name: "Ana Tavares",
                role: "59 anos, Paciente com diabetes",
                delay: 0,
                gradient: "from-[#1E3A5F] to-[#48C9B0]",
                avatarBg: "bg-[#E8F8F5]",
                avatarText: "text-[#1E3A5F]",
                avatarBorder: "border-[#48C9B0]",
                image: true
              },
              {
                quote: "Uso com meus pacientes e ganho tempo nas consultas. Os gráficos ajudam muito na explicação e o histórico evolutivo é um diferencial.",
                name: "Dr. Marcos Henrique",
                role: "Geriatra",
                delay: 0.1,
                gradient: "from-[#48C9B0] to-[#1E3A5F]",
                avatarBg: "bg-[#E8F8F5]",
                avatarText: "text-[#1E3A5F]",
                avatarBorder: "border-[#48C9B0]",
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
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#1E3A5F]/10 to-transparent rounded-tr-full z-0"></div>
                ) : (
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#48C9B0]/10 to-transparent rounded-tr-full z-0"></div>
                )}
                
                {/* Barra gradiente superior */}
                <div className={`h-3 w-full bg-gradient-to-r ${testimonial.gradient}`}></div>
                
                <div className="p-8 relative z-10">
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
                        className={`fill-[${index === 0 ? '#48C9B0' : '#1E3A5F'}]`}
                        style={{ opacity: 0.3 }}
                      />
                    </motion.svg>
                    <div className={`absolute w-12 h-1 bg-gradient-to-r ${testimonial.gradient} rounded-full bottom-0 left-0`}></div>
                  </div>
                  
                  {/* Texto do depoimento */}
                  <p className="text-gray-700 mb-8 text-lg leading-relaxed relative">
                    {testimonial.quote}
                    <span className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#48C9B0]/30 to-transparent rounded-full"></span>
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
                            <div className="absolute inset-0 bg-gradient-to-br from-[#48C9B0]/10 to-[#1E3A5F]/10"></div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/10 to-[#48C9B0]/10"></div>
                          )}
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${testimonial.avatarText} font-bold text-xl bg-gradient-to-br from-white/90 to-white/70 z-10`}>
                            {testimonial.name.charAt(0)}{testimonial.name.split(' ')[1]?.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative z-10 border-2 border-white">
                          <span className="text-lg font-bold text-gray-700">{testimonial.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-5">
                      <h4 className="font-bold text-[#1E3A5F] text-lg">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
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
                  <h3 className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</h3>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seção FAQ Accordions */}
      <section id="faq" className="py-20 bg-gradient-to-b from-[#2A4F7C] to-[#1E3A5F] text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-20 w-64 h-64 bg-primary-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-20 bottom-10 w-72 h-72 bg-blue-50 rounded-full opacity-30 blur-3xl"></div>
          
          {/* Elementos decorativos minimalistas */}
          <div className="absolute top-1/4 left-[10%] w-3 h-3 bg-primary-300 rounded-full opacity-70"></div>
          <div className="absolute bottom-1/3 right-[15%] w-4 h-4 bg-blue-300 rounded-full opacity-70"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Perguntas <span className="text-[#A5E1D2]">Frequentes</span>
            </h2>
            <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto">
              Tire suas dúvidas sobre o VitaView AI e como nossa plataforma pode ajudar você a entender melhor sua saúde.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "Como o VitaView AI analisa meus exames de sangue?",
                answer: "O VitaView AI utiliza inteligência artificial avançada para analisar seus exames. Nosso sistema extrai automaticamente os valores dos documentos, compara com as referências médicas, identifica tendências históricas e fornece interpretações em linguagem simples para você entender o significado dos resultados."
              },
              {
                question: "Meus dados médicos estão seguros na plataforma?",
                answer: "Absolutamente. Implementamos as mais rigorosas medidas de segurança digital. Todos os dados são criptografados em trânsito e em repouso, seguimos as normas LGPD/HIPAA, nossos servidores possuem certificação de segurança e você sempre mantém total controle sobre quem pode acessar suas informações."
              },
              {
                question: "Posso compartilhar meus resultados com meu médico?",
                answer: "Sim! O VitaView AI permite que você compartilhe facilmente relatórios e gráficos com seus médicos. Você pode gerar um link temporário de acesso ou exportar relatórios em PDF para levar à consulta, facilitando a comunicação com profissionais de saúde."
              },
              {
                question: "Como o VitaView AI me ajuda a acompanhar minha saúde ao longo do tempo?",
                answer: "Nossa plataforma cria automaticamente gráficos de tendência para todos os seus biomarcadores importantes. Você receberá alertas sobre mudanças significativas, e nosso sistema sugerirá correlações entre diferentes parâmetros, criando uma visão holística da sua saúde que evolui com o tempo."
              },
              {
                question: "Que tipos de arquivos posso carregar no VitaView AI?",
                answer: "O VitaView AI suporta arquivos em formato PDF, JPG, PNG e TIFF. Você pode carregar exames digitalizados, fotografias de resultados impressos ou arquivos digitais fornecidos diretamente pelos laboratórios. Nosso sistema é treinado para reconhecer formatos de diversos laboratórios."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <motion.div 
                  className={`p-5 rounded-lg border ${activeFaq === index ? 'bg-white/95 border-white/40' : 'bg-white/85 border-white/30'} cursor-pointer transition-all duration-300 hover:shadow-md backdrop-blur-sm`}
                  onClick={() => toggleFaq(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${activeFaq === index ? 'text-primary-700' : 'text-gray-800'}`}>
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: activeFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${activeFaq === index ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-gray-700">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-lg text-white text-opacity-90 mb-8">
              Ainda tem dúvidas? Entre em contato com nossa equipe de suporte.
            </p>
            
            {/* Email contact card */}
            <motion.div
              className="inline-flex items-center justify-center mb-8"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="mailto:contato@vitaview.ai"
                className="group flex items-center space-x-4 bg-white bg-opacity-10 backdrop-blur-sm px-8 py-4 rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full group-hover:bg-opacity-30 transition-colors">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm text-white text-opacity-80 group-hover:text-opacity-90 transition-colors">
                    Envie-nos um email
                  </div>
                  <div className="text-lg font-semibold text-white group-hover:text-teal-200 transition-colors">
                    contato@vitaview.ai
                  </div>
                </div>
                <div className="ml-2">
                  <svg
                    className="w-5 h-5 text-white text-opacity-60 group-hover:text-teal-200 group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </a>
            </motion.div>

            {/* Support information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-1">Resposta Rápida</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Em até 24h nos dias úteis
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-1">Equipe Especializada</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Profissionais em saúde e tecnologia
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-1">Suporte Completo</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Dúvidas técnicas e de uso
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 relative overflow-hidden">
        {/* Elementos decorativos do footer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 w-96 h-96 bg-primary-800 rounded-full opacity-5 blur-3xl"
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
            className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-800 rounded-full opacity-5 blur-3xl"
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
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="flex flex-col md:flex-row justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div 
              className="mb-8 md:mb-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center mb-4">
                <motion.div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mr-3 shadow-md"
                  whileHover={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Activity className="w-6 h-6" />
                </motion.div>
                <span className="text-xl font-bold text-white">VitaView AI</span>
              </div>
              <p className="max-w-xs">
                A evolução da sua saúde começa com o entendimento dos seus exames.
              </p>
              
              {/* Inscrição na newsletter */}
              <div className="mt-6 hidden md:block">
                <p className="text-sm mb-2 font-medium text-gray-300">Fique atualizado:</p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-white w-full max-w-[200px]" 
                  />
                  <motion.button 
                    className="bg-primary-600 hover:bg-primary-700 px-3 py-2 rounded-r-md text-white text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-white font-semibold mb-4">Plataforma</h3>
                <ul className="space-y-2">
                  {["Como funciona", "Recursos", "Preços", "FAQ"].map((item, i) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + (i * 0.05) }}
                    >
                      <motion.a 
                        href="#" 
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
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
                <h3 className="text-white font-semibold mb-4">Empresa</h3>
                <ul className="space-y-2">
                  {["Sobre nós", "Blog", "Carreiras", "Contato"].map((item, i) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 + (i * 0.05) }}
                    >
                      <motion.a 
                        href="#" 
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
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
                  {["Termos de Uso", "Privacidade", "Segurança"].map((item, i) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + (i * 0.05) }}
                    >
                      <motion.a 
                        href="#" 
                        className="hover:text-white transition-colors relative group inline-block"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
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
                className="text-gray-400 hover:text-white transition-colors group"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 }}
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="text-sm font-medium group-hover:text-teal-200 transition-colors">
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