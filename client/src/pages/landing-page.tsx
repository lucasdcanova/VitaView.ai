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
        
        {/* Subtle animated elements with reduced size and opacity */}
        <motion.div 
          className="absolute top-[15%] left-[25%] w-6 h-6 bg-primary-300 rounded-full opacity-15"
          animate={{ 
            y: [0, 15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        <motion.div 
          className="absolute top-[28%] right-[30%] w-4 h-4 bg-blue-300 rounded-md opacity-15"
          animate={{ 
            y: [0, -12, 0],
            x: [0, -8, 0]
          }}
          transition={{ 
            duration: 10,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-[35%] left-[35%] w-5 h-5 bg-indigo-300 rounded-full opacity-15"
          animate={{ 
            y: [0, 15, 0],
            x: [0, -6, 0]
          }}
          transition={{ 
            duration: 12,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
      </div>
      
      {/* Navbar - improved with backdrop filter and better shadow */}
      <motion.nav 
        className={`${isScrolled ? 'bg-white/98 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'} sticky top-0 z-50 transition-all duration-300`}
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mr-3 shadow-md">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary-800 tracking-tight">HEMOLOG</span>
                <span className="text-xs text-primary-600 -mt-1">Análise Inteligente de Exames</span>
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
                className="hover:text-primary-600 transition-colors relative group py-2 text-sm font-medium"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>
          
          {/* Mobile menu button - only visible on mobile */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-700"
              onClick={() => alert('Menu mobile a ser implementado')}
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Login/Access button with improved animation */}
          <motion.div
            className="hidden md:block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth">
              <Button variant="default" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md text-white px-6 py-2">
                Acessar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="py-8 md:py-12 container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="flex flex-col md:flex-row items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="md:w-1/2 mb-10 md:mb-0 md:pr-8" variants={itemVariants}>
            <motion.span
              className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Inteligência Artificial aplicada à saúde
            </motion.span>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              <span className="text-primary-600 tracking-tight">HEMOLOG</span>: Entenda seus exames com clareza e precisão
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
              Transforme seus exames médicos em informações compreensíveis. Faça upload em PDF ou imagem e obtenha análises detalhadas, alertas personalizados e acompanhamento visual da sua saúde.
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
                  <Button size="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-6 rounded-lg shadow-lg w-full sm:w-auto font-medium">
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
                className="rounded-xl shadow-2xl relative z-10 bg-white overflow-hidden w-full max-w-[600px] h-auto aspect-[16/10]"
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
              A interpretação de exames ainda é um mistério para muitas pessoas. Com o Hemolog, você transforma números e siglas em informações compreensíveis e ações de saúde claras.
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
      <section id="demonstracoes" className="py-16 mt-[0] bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
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
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Relatórios Detalhados e Análises Precisas</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
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
                      <p className="text-sm text-gray-700">
                        Seus exames mostram resultados dentro dos parâmetros normais. A glicose está no limite superior da faixa de referência, recomendamos monitoramento e atenção à dieta.
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
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Entenda seus exames como nunca antes</h3>
                <p className="text-lg text-gray-600 mb-6">
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
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-gray-600">{item.description}</p>
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
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Histórico Completo e Acessível</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
      
      {/* Feature Showcase Section */}
      <section className="py-20 bg-primary-50 relative overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-white to-transparent"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="text-primary-600">
                Recursos inteligentes
              </span> para sua saúde
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos uma plataforma completa para que você compreenda e acompanhe seus exames com facilidade.
            </p>
          </motion.div>
          
          {/* Features Alternating */}
          <div className="space-y-24">
            {[
              {
                title: "Visualização intuitiva de dados de saúde",
                description: "Gráficos interativos transformam números complexos em informações visuais de fácil compreensão, mostrando tendências e comparando valores com referências de normalidade.",
                icon: <BarChart className="w-12 h-12 text-primary-500" />,
                image: "",  // Vamos substituir por um elemento personalizado JSX
                features: [
                  "Gráficos evolutivos de valores",
                  "Comparação com referências médicas",
                  "Exportação de relatórios visuais"
                ],
                reverse: false
              },
              {
                title: "Armazenamento seguro e organizado",
                description: "Mantenha todos os seus exames em um único local, organizados cronologicamente e por tipo, com acesso fácil a todo o seu histórico médico sempre que precisar.",
                icon: <ScrollText className="w-12 h-12 text-primary-500" />,
                image: "",  // Vamos substituir por um elemento personalizado JSX
                features: [
                  "Ordenação inteligente por data",
                  "Categorização automática por tipo",
                  "Busca avançada por valores e parâmetros"
                ],
                reverse: true
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className={`flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
              >
                {/* Texto */}
                <div className="md:w-1/2 space-y-6">
                  <motion.div 
                    className="inline-block p-3 rounded-2xl bg-primary-50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <motion.li 
                        key={idx} 
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.4 + (idx * 0.1) }}
                      >
                        <div className="p-1 rounded-full bg-green-100">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
                {/* Imagem */}
                <motion.div 
                  className="md:w-1/2 relative"
                  initial={{ opacity: 0, ...(feature.reverse ? { x: -30 } : { x: 30 }) }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* Elemento decorativo */}
                  <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-primary-50 to-transparent rounded-3xl transform translate-x-4 translate-y-4"></div>
                  
                  {/* Conteúdo personalizado que substitui a imagem */}
                  {index === 0 ? (
                    // Gráfico Interativo
                    <div className="w-full h-[340px] bg-blue-50 rounded-xl shadow-lg relative z-10 overflow-hidden">
                      {/* Cabeçalho do gráfico */}
                      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <LineChart className="h-5 w-5 text-primary-500 mr-2" />
                          <span className="font-medium text-primary-700">Gráfico Interativo</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-1.5 rounded-md hover:bg-gray-100">
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-gray-100">
                            <RefreshCw className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Área do gráfico */}
                      <div className="p-4 h-[calc(100%-4rem)]">
                        {/* Legendas na parte superior */}
                        <div className="flex justify-end mb-2 space-x-4">
                          <div className="flex items-center">
                            <span className="h-3 w-3 rounded-full bg-primary-500 mr-2"></span>
                            <span className="text-xs text-gray-600">Hemoglobina</span>
                          </div>
                          <div className="flex items-center">
                            <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                            <span className="text-xs text-gray-600">Glicose</span>
                          </div>
                          <div className="flex items-center">
                            <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                            <span className="text-xs text-gray-600">Colesterol</span>
                          </div>
                        </div>
                        
                        {/* Grid do gráfico */}
                        <div className="relative h-[calc(100%-2rem)] border-l border-b border-gray-200">
                          {/* Linhas horizontais do grid */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="absolute w-full h-px bg-gray-100" style={{ top: `${i * 25}%` }}></div>
                          ))}
                          
                          {/* Pontos e linhas animadas */}
                          <motion.div 
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                          >
                            {/* Linha azul (Hemoglobina) */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <motion.path 
                                d="M0,60 L20,50 L40,55 L60,40 L80,35 L100,45"
                                fill="none" 
                                stroke="rgb(59, 130, 246)" 
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.8 }}
                              />
                            </svg>
                            
                            {/* Linha âmbar (Glicose) */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <motion.path 
                                d="M0,50 L20,60 L40,70 L60,65 L80,55 L100,60"
                                fill="none" 
                                stroke="rgb(245, 158, 11)" 
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 1 }}
                              />
                            </svg>
                            
                            {/* Linha vermelha (Colesterol) */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <motion.path 
                                d="M0,65 L20,70 L40,60 L60,55 L80,45 L100,50"
                                fill="none" 
                                stroke="rgb(239, 68, 68)" 
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 1.2 }}
                              />
                            </svg>
                            
                            {/* Pontos animados */}
                            {[
                              { left: '0%', top: '60%', color: 'bg-primary-500' },
                              { left: '20%', top: '50%', color: 'bg-primary-500' },
                              { left: '40%', top: '55%', color: 'bg-primary-500' },
                              { left: '60%', top: '40%', color: 'bg-primary-500' },
                              { left: '80%', top: '35%', color: 'bg-primary-500' },
                              { left: '100%', top: '45%', color: 'bg-primary-500' },
                              
                              { left: '0%', top: '50%', color: 'bg-amber-500' },
                              { left: '20%', top: '60%', color: 'bg-amber-500' },
                              { left: '40%', top: '70%', color: 'bg-amber-500' },
                              { left: '60%', top: '65%', color: 'bg-amber-500' },
                              { left: '80%', top: '55%', color: 'bg-amber-500' },
                              { left: '100%', top: '60%', color: 'bg-amber-500' },
                              
                              { left: '0%', top: '65%', color: 'bg-red-500' },
                              { left: '20%', top: '70%', color: 'bg-red-500' },
                              { left: '40%', top: '60%', color: 'bg-red-500' },
                              { left: '60%', top: '55%', color: 'bg-red-500' },
                              { left: '80%', top: '45%', color: 'bg-red-500' },
                              { left: '100%', top: '50%', color: 'bg-red-500' }
                            ].map((point, i) => (
                              <motion.div 
                                key={i}
                                className={`absolute h-2 w-2 rounded-full ${point.color} transform -translate-x-1 -translate-y-1`}
                                style={{ left: point.left, top: point.top }}
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.8 + (i * 0.05) }}
                              />
                            ))}
                          </motion.div>
                          
                          {/* Datas no eixo X */}
                          <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
                            <span className="text-xs text-gray-500">Jan</span>
                            <span className="text-xs text-gray-500">Fev</span>
                            <span className="text-xs text-gray-500">Mar</span>
                            <span className="text-xs text-gray-500">Abr</span>
                            <span className="text-xs text-gray-500">Mai</span>
                            <span className="text-xs text-gray-500">Jun</span>
                          </div>
                          
                          {/* Valores no eixo Y */}
                          <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between py-1">
                            <span className="text-xs text-gray-500">200</span>
                            <span className="text-xs text-gray-500">150</span>
                            <span className="text-xs text-gray-500">100</span>
                            <span className="text-xs text-gray-500">50</span>
                            <span className="text-xs text-gray-500">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Histórico Organizado 
                    <div className="w-full h-[340px] bg-blue-50 rounded-xl shadow-lg relative z-10 overflow-hidden">
                      {/* Cabeçalho do histórico */}
                      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <ScrollText className="h-5 w-5 text-primary-500 mr-2" />
                          <span className="font-medium text-primary-700">Histórico Organizado</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-1.5 rounded-md hover:bg-gray-100">
                            <Filter className="h-4 w-4 text-gray-500" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-gray-100">
                            <Search className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Lista de exames */}
                      <div className="p-2 space-y-2 h-[calc(100%-4rem)] overflow-y-auto">
                        {[
                          { 
                            title: "Hemograma Completo", 
                            date: "15/04/2025", 
                            lab: "Laboratório Central",
                            status: "normal"
                          },
                          { 
                            title: "Check-up Anual", 
                            date: "10/03/2025", 
                            lab: "ClínicaVida",
                            status: "atencao" 
                          },
                          { 
                            title: "Lipidograma", 
                            date: "22/02/2025", 
                            lab: "Laboratório Central",
                            status: "normal" 
                          },
                          { 
                            title: "Teste de Glicemia", 
                            date: "05/02/2025", 
                            lab: "Central Diagnósticos",
                            status: "alerta" 
                          },
                          { 
                            title: "Hormônios Tireoide", 
                            date: "15/01/2025", 
                            lab: "Laboratório Central",
                            status: "normal" 
                          },
                        ].map((exam, i) => (
                          <motion.div 
                            key={i}
                            className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.2, delay: 0.5 + (i * 0.1) }}
                            whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                          >
                            <div className="flex items-center">
                              <div className="mr-3">
                                {exam.status === "normal" && <Circle className="h-3 w-3 text-green-500 fill-green-500" />}
                                {exam.status === "atencao" && <Circle className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                {exam.status === "alerta" && <Circle className="h-3 w-3 text-red-500 fill-red-500" />}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-800">{exam.title}</h4>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{exam.date}</span>
                                  <Building className="h-3 w-3 ml-2 mr-1" />
                                  <span>{exam.lab}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  
                  {/* Badge */}
                  <motion.div 
                    className={`absolute ${feature.reverse ? 'left-0' : 'right-0'} -bottom-4 bg-white shadow-lg p-4 rounded-lg z-20`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-medium">{
                        feature.reverse 
                          ? "Seu histórico completo em um só lugar" 
                          : "Visualização simples e objetiva"
                      }</span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
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
              Como Funciona o <span className="text-primary-600">HEMOLOG</span>
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
              <Button 
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-6 rounded-lg shadow-lg text-lg"
                size="lg"
              >
                Comece agora gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="pt-12 pb-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -bottom-20 w-96 h-96 bg-primary-50 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute left-1/3 -top-48 w-64 h-64 bg-green-50 rounded-full opacity-30 blur-3xl"></div>
          
          {/* Padrão geométrico sutil */}
          <div className="hidden lg:block absolute left-10 top-40 w-32 h-32">
            <div className="w-4 h-4 rounded-full bg-primary-100 absolute top-0 left-0"></div>
            <div className="w-2 h-2 rounded-full bg-blue-100 absolute top-10 left-10"></div>
            <div className="w-6 h-6 rounded-full bg-green-100 absolute top-20 left-20"></div>
          </div>
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
              className="inline-block px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Vantagens Exclusivas
            </motion.span>
          
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Benefícios <span className="text-primary-600">Reais</span> para sua Saúde
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              O HEMOLOG transforma seus dados de saúde em informações valiosas e acionáveis para você e sua família.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Clock className="w-6 h-6 text-primary-600" />,
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
                className="relative bg-white p-7 rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-primary-100 group"
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
          
          {/* Estatísticas de impacto */}
          <div className="mt-24 max-w-5xl mx-auto">
            <motion.h3 
              className="text-2xl font-bold text-center text-gray-800 mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Impacto comprovado na vida dos usuários
            </motion.h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  number: "93%",
                  text: "dos usuários relatam melhor entendimento de sua saúde",
                  icon: <Brain className="w-10 h-10 text-primary-500" />,
                  delay: 0
                },
                {
                  number: "87%",
                  text: "aumentaram a confiança durante consultas médicas",
                  icon: <Users className="w-10 h-10 text-blue-500" />,
                  delay: 0.2
                },
                {
                  number: "78%",
                  text: "compartilham regularmente seus relatórios com médicos",
                  icon: <Share className="w-10 h-10 text-green-500" />,
                  delay: 0.4
                },
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: stat.delay }}
                  whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                >
                  <div className="p-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-50 rounded-full">
                        {stat.icon}
                      </div>
                    </div>
                    <h4 className="text-4xl font-bold text-center text-primary-600 mb-3">{stat.number}</h4>
                    <p className="text-center text-gray-600">{stat.text}</p>
                  </div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 to-primary-300"></div>
                </motion.div>
              ))}
            </div>
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
                className="bg-white hover:bg-gray-50 text-primary-700 border-2 border-primary-600 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg"
                size="lg"
              >
                Comece Sua Jornada de Saúde
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="para-quem" className="py-20 bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 bottom-0 w-80 h-80 bg-blue-50 rounded-full opacity-30 blur-3xl"></div>
        </div>
      
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Para Quem é o <span className="text-primary-600">Hemolog</span>?
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Nossa plataforma atende diferentes necessidades e perfis, criando valor em cada etapa da jornada de saúde.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <div className="bg-primary-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>,
                title: "Pacientes crônicos",
                description: "Monitoramento contínuo e organizado de seus exames recorrentes",
                delay: 0,
                gradient: "from-primary-500 to-primary-600"
              },
              {
                icon: <div className="bg-indigo-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>,
                title: "Famílias",
                description: "Histórico de saúde centralizado para gerenciar a saúde familiar",
                delay: 0.1,
                gradient: "from-primary-600 to-indigo-600"
              },
              {
                icon: <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                        <FileHeart className="w-6 h-6 text-white" />
                      </div>,
                title: "Profissionais de saúde",
                description: "Relatórios prontos para consultas mais eficientes e focadas",
                delay: 0.2,
                gradient: "from-indigo-600 to-blue-600"
              },
              {
                icon: <div className="bg-primary-600 w-12 h-12 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>,
                title: "Clínicas e planos de saúde",
                description: "Ferramenta para engajar e cuidar melhor dos pacientes",
                delay: 0.3,
                gradient: "from-blue-600 to-primary-500"
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="relative bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: item.delay }}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, 5, -5, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                    {item.icon}
                  </div>
                </motion.div>
                
                {/* Decoração de fundo */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-primary-50 opacity-50 rounded-t-xl"></div>
                
                <div className="mt-10 relative z-10">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
                
                {/* Decoração de fundo circular */}
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary-50 rounded-full opacity-20"></div>
              </motion.div>
            ))}
          </div>
          
          {/* Info cards adicionais */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                number: "9/10",
                text: "usuários conseguem entender melhor seus exames",
                color: "text-primary-600"
              },
              {
                number: "5min",
                text: "tempo médio para obter interpretação completa",
                color: "text-indigo-600"
              },
              {
                number: "100%",
                text: "seguro e confidencial seguindo normas LGPD",
                color: "text-blue-600"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white p-5 rounded-xl shadow-sm text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                whileHover={{ y: -5 }}
              >
                <h3 className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.number}</h3>
                <p className="text-gray-600">{stat.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nova seção de demonstrações interativas */}
      <section id="demonstracoes" className="py-20 bg-white relative overflow-hidden">
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore exemplos reais de como o Hemolog funciona
            </h2>
            <p className="text-xl text-gray-600">
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
      <section id="depoimentos" className="py-20 bg-gray-50 relative overflow-hidden">
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
              Centenas de pessoas já transformaram sua relação com a saúde através do Hemolog.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {[
              {
                quote: "O Hemolog me ajudou a entender como meus exames evoluíram nos últimos anos. Hoje, me sinto no controle da minha saúde.",
                name: "Ana Tavares",
                role: "59 anos, Paciente com diabetes",
                delay: 0,
                gradient: "from-primary-600 to-primary-400"
              },
              {
                quote: "Uso com meus pacientes e ganho tempo nas consultas. Os gráficos ajudam muito na explicação e o histórico evolutivo é um diferencial.",
                name: "Dr. Marcos Henrique",
                role: "Geriatra",
                delay: 0.1,
                gradient: "from-indigo-600 to-primary-500"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl shadow-lg overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: testimonial.delay }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                }}
              >
                {/* Barra gradiente superior */}
                <div className={`h-2 w-full bg-gradient-to-r ${testimonial.gradient}`}></div>
                
                <div className="p-8">
                  {/* Aspas decorativas */}
                  <div className="flex justify-start mb-4">
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
                        className="fill-primary-200"
                      />
                    </motion.svg>
                  </div>
                  
                  {/* Texto do depoimento */}
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    {testimonial.quote}
                  </p>
                  
                  <div className="flex items-center">
                    {/* Avatar gradiente com bordas animadas */}
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
                      
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative z-10 border-2 border-white">
                        <span className="text-lg font-bold text-gray-700">{testimonial.name.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
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
      <section id="faq" className="py-20 bg-white relative overflow-hidden">
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas <span className="text-primary-600">Frequentes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tire suas dúvidas sobre o Hemolog e como nossa plataforma pode ajudar você a entender melhor sua saúde.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "Como o Hemolog analisa meus exames de sangue?",
                answer: "O Hemolog utiliza inteligência artificial avançada para analisar seus exames. Nosso sistema extrai automaticamente os valores dos documentos, compara com as referências médicas, identifica tendências históricas e fornece interpretações em linguagem simples para você entender o significado dos resultados."
              },
              {
                question: "Meus dados médicos estão seguros na plataforma?",
                answer: "Absolutamente. Implementamos as mais rigorosas medidas de segurança digital. Todos os dados são criptografados em trânsito e em repouso, seguimos as normas LGPD/HIPAA, nossos servidores possuem certificação de segurança e você sempre mantém total controle sobre quem pode acessar suas informações."
              },
              {
                question: "Posso compartilhar meus resultados com meu médico?",
                answer: "Sim! O Hemolog permite que você compartilhe facilmente relatórios e gráficos com seus médicos. Você pode gerar um link temporário de acesso ou exportar relatórios em PDF para levar à consulta, facilitando a comunicação com profissionais de saúde."
              },
              {
                question: "Como o Hemolog me ajuda a acompanhar minha saúde ao longo do tempo?",
                answer: "Nossa plataforma cria automaticamente gráficos de tendência para todos os seus biomarcadores importantes. Você receberá alertas sobre mudanças significativas, e nosso sistema sugerirá correlações entre diferentes parâmetros, criando uma visão holística da sua saúde que evolui com o tempo."
              },
              {
                question: "Que tipos de arquivos posso carregar no Hemolog?",
                answer: "O Hemolog suporta arquivos em formato PDF, JPG, PNG e TIFF. Você pode carregar exames digitalizados, fotografias de resultados impressos ou arquivos digitais fornecidos diretamente pelos laboratórios. Nosso sistema é treinado para reconhecer formatos de diversos laboratórios."
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
                  className={`p-5 rounded-lg border ${activeFaq === index ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'} cursor-pointer transition-all duration-300 hover:shadow-md`}
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
                        <p className="text-gray-600">{faq.answer}</p>
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
            <p className="text-lg text-gray-600 mb-6">
              Ainda tem dúvidas? Entre em contato com nossa equipe de suporte.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white">
                <MessageSquare className="mr-2 h-5 w-5" /> Fale Conosco
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Recursos principais */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <motion.span
              className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Funcionalidades Principais
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
              Transforme números em <span className="text-primary-600">informações úteis</span>
            </h2>
            <p className="text-lg text-gray-600">
              Organize seu histórico médico e visualize tendências em gráficos intuitivos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Bloco 1: Visualização intuitiva de dados */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 md:order-1"
            >
              <div className="mb-3">
                <BarChart3 className="w-9 h-9 text-primary-600 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Visualização intuitiva de dados de saúde</h3>
              </div>
              <p className="text-gray-600 mb-5">
                Gráficos interativos transformam números complexos em informações visuais de fácil compreensão, mostrando tendências e comparando valores com referências de normalidade.
              </p>
              
              <ul className="space-y-3 mb-5">
                {[
                  "Gráficos evolutivos de valores",
                  "Comparação com referências médicas",
                  "Exportação de relatórios visuais"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <div className="mt-1 bg-green-100 p-1 rounded-full mr-3">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* Demo Gráfico Interativo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="order-1 md:order-2"
            >
              <div className="bg-blue-50 rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-3 top-3 px-3 py-1.5 bg-white rounded-full text-xs text-primary-700 font-medium shadow-sm flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                  Visualização simples e objetiva
                </div>
                
                <h3 className="text-2xl text-center font-bold text-primary-700 mb-6">Gráfico Interativo</h3>
                
                {/* Gráfico simulado */}
                <div className="h-60 relative">
                  {/* Eixos */}
                  <div className="absolute left-0 bottom-0 w-full h-px bg-gray-300"></div>
                  <div className="absolute left-0 bottom-0 h-full w-px bg-gray-300"></div>
                  
                  {/* Pontos de dados */}
                  {[
                    { x: 0, y: 30, label: "Jan", value: 120 },
                    { x: 20, y: 45, label: "Fev", value: 115 },
                    { x: 40, y: 25, label: "Mar", value: 125 },
                    { x: 60, y: 60, label: "Abr", value: 110 },
                    { x: 80, y: 50, label: "Mai", value: 112 },
                    { x: 100, y: 30, label: "Jun", value: 120 }
                  ].map((point, index) => (
                    <motion.div
                      key={index}
                      className="absolute"
                      style={{ 
                        left: `${point.x}%`, 
                        bottom: `${point.y}%` 
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        delay: 0.5 + (index * 0.1),
                        type: "spring"
                      }}
                    >
                      <div className="relative">
                        <div className="w-4 h-4 bg-primary-500 rounded-full shadow-md"></div>
                        <div className="absolute -top-10 left-50 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-sm text-xs">
                          {point.value} mg/dL
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Linhas entre pontos */}
                  <svg className="absolute inset-0 w-full h-full">
                    <motion.path
                      d="M 0,70 L 20,55 L 40,75 L 60,40 L 80,50 L 100,70"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <motion.path
                      d="M 0,70 L 20,55 L 40,75 L 60,40 L 80,50 L 100,70"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="8"
                      strokeOpacity="0.2"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </svg>
                  
                  {/* Rótulos do eixo X */}
                  <div className="absolute bottom-0 left-0 w-full flex justify-between px-3 -mb-6">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((month, index) => (
                      <div key={index} className="text-xs text-gray-500">{month}</div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center mt-12">
                  <div className="bg-white rounded-lg shadow-sm py-2 px-4 text-sm text-gray-700 flex items-center">
                    <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                    <span>Glicemia em jejum</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Demo Histórico Organizado */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-blue-50 rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-3 top-3 px-3 py-1.5 bg-white rounded-full text-xs text-primary-700 font-medium shadow-sm flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-amber-500" />
                  Seu histórico completo em um só lugar
                </div>
                
                <h3 className="text-2xl text-center font-bold text-primary-700 mb-8">Histórico Organizado</h3>
                
                {/* Lista de exames simulada */}
                <div className="space-y-3">
                  {[
                    { date: "15/04/2025", title: "Hemograma Completo", lab: "Laboratório Central", status: "normal" },
                    { date: "22/03/2025", title: "Perfil Lipídico", lab: "Clínica São Paulo", status: "attention" },
                    { date: "10/02/2025", title: "Glicemia em Jejum", lab: "Laboratório Central", status: "normal" },
                    { date: "05/01/2025", title: "Função Renal", lab: "Hospital Aurora", status: "normal" },
                    { date: "12/12/2024", title: "Função Hepática", lab: "Clínica São Paulo", status: "warning" }
                  ].map((exam, index) => (
                    <motion.div
                      key={index}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-10 ${
                          exam.status === "normal" ? "bg-green-500" : 
                          exam.status === "attention" ? "bg-amber-500" : "bg-red-500"
                        } rounded-full`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                          <div className="text-xs text-gray-500">{exam.lab}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{exam.date}</div>
                    </motion.div>
                  ))}
                </div>
                
                <Link href="/auth?tab=register">
                  <motion.div 
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                  >
                    <button className="text-primary-600 text-sm flex items-center">
                      Ver todos os exames
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
            
            {/* Bloco 2: Armazenamento seguro */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-3">
                <ScrollText className="w-9 h-9 text-primary-600 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Armazenamento seguro e organizado</h3>
              </div>
              <p className="text-gray-600 mb-5">
                Mantenha todos os seus exames em um único local, organizados cronologicamente e por tipo, com acesso fácil a todo o seu histórico médico sempre que precisar.
              </p>
              
              <ul className="space-y-3 mb-5">
                {[
                  "Ordenação inteligente por data",
                  "Categorização automática por tipo",
                  "Busca avançada por valores e parâmetros"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <div className="mt-1 bg-green-100 p-1 rounded-full mr-3">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
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
                <span className="text-xl font-bold text-white">Hemolog</span>
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
            <p>&copy; {new Date().getFullYear()} Hemolog. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {[
                { 
                  icon: <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />,
                  delay: 0.1
                },
                { 
                  icon: <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />,
                  delay: 0.2
                },
                { 
                  icon: <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />,
                  delay: 0.3
                },
                { 
                  icon: <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />,
                  delay: 0.4
                }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + social.delay }}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {social.icon}
                  </svg>
                </motion.a>
              ))}
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
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg"
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