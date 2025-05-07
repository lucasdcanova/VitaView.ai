import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Brain, 
  LineChart, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Users,
  Activity,
  Building,
  ChevronRight,
  Heart,
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
  Bell,
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
  HelpCircle,
  Mail,
  Phone,
  Lock,
  MessageSquare,
  Lightbulb,
  LifeBuoy,
  AlertCircle,
  InfoIcon
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
        className={`${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg py-3' : 'bg-transparent py-4'} sticky top-0 z-50 transition-all duration-300`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
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
          
          {/* Desktop navigation with enhanced hover effects */}
          <div className="hidden md:flex space-x-10 text-gray-700">
            {["demonstracoes", "como-funciona", "beneficios", "para-quem", "depoimentos"].map((id, index) => (
              <motion.a 
                key={id}
                href={`#${id}`} 
                className="hover:text-primary-600 transition-colors relative group py-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>
          
          {/* Login/Access button with improved animation */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth">
              <Button variant="default" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg text-white px-6">
                Acessar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="flex flex-col md:flex-row items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="md:w-1/2 mb-8 md:mb-0" variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700 tracking-tight">HEMOLOG</span>: seu histórico de exames, interpretado e visualizado com inteligência.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Carregue seus exames em PDF ou imagem e receba análises automáticas, alertas personalizados e gráficos evolutivos com apoio de IA.
            </p>
            
            {/* Estatísticas animadas */}
            <div className="grid grid-cols-3 gap-4 mb-8 hidden md:grid">
              <motion.div 
                className="text-center p-3 bg-white rounded-lg shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">98%</h3>
                <p className="text-sm text-gray-500">Precisão</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 bg-white rounded-lg shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">10x</h3>
                <p className="text-sm text-gray-500">Mais rápido</p>
              </motion.div>
              <motion.div 
                className="text-center p-3 bg-white rounded-lg shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-primary-600">24/7</h3>
                <p className="text-sm text-gray-500">Disponível</p>
              </motion.div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-6 rounded-lg shadow-lg w-full sm:w-auto">
                    Criar minha conta gratuita
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-6 rounded-lg flex items-center">
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
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4 py-3 px-6 bg-white bg-opacity-80 backdrop-blur-sm rounded-t-xl shadow-sm text-xs md:text-sm text-gray-600 hidden md:flex">
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
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16 relative overflow-hidden">
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
      <section className="py-16 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Relatórios Detalhados e Análises Precisas</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
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
                image: "https://placehold.co/800x500/e6f2ff/0066cc?text=Grafico+Interativo",
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
                image: "https://placehold.co/800x500/e6f2ff/0066cc?text=Historico+Organizado",
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
                  
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="w-full h-auto rounded-xl shadow-lg relative z-10"
                  />
                  
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
      <section id="como-funciona" className="py-20 bg-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 top-20 w-72 h-72 bg-blue-50 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute right-0 bottom-20 w-80 h-80 bg-primary-50 rounded-full opacity-40 blur-3xl"></div>
          
          {/* Decoração de fundo com divs simples */}
          <div className="absolute top-[200px] left-[200px] right-[200px] h-[2px] bg-primary-100"></div>
          <div className="absolute top-[400px] left-[300px] right-[300px] h-[2px] bg-primary-100"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Como Funciona o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>?
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Nossa plataforma combina tecnologia de ponta e interface intuitiva para tornar seus exames mais acessíveis e compreensíveis.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-7 h-7 text-primary-600" />,
                title: "1. Envio Simples",
                description: "Faça upload de exames em PDF, JPEG ou PNG — até uma foto funciona.",
                animation: { x: -50, rotateY: -15 }
              },
              {
                icon: <Brain className="w-7 h-7 text-primary-600" />,
                title: "2. Leitura com IA",
                description: "Nosso sistema usa inteligência artificial para identificar os exames, extrair os dados e interpretá-los.",
                animation: { y: -30 }
              },
              {
                icon: <LineChart className="w-7 h-7 text-primary-600" />,
                title: "3. Acompanhamento Evolutivo",
                description: "Veja gráficos, alertas automáticos e receba insights práticos com base nos seus resultados anteriores.",
                animation: { y: 30 }
              },
              {
                icon: <Shield className="w-7 h-7 text-primary-600" />,
                title: "4. Segurança Médica",
                description: "Seus dados são criptografados e seguem padrões internacionais de proteção.",
                animation: { x: 50, rotateY: 15 }
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 relative backdrop-blur-sm bg-white/80"
                initial={{ opacity: 0, ...item.animation }}
                whileInView={{ opacity: 1, x: 0, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
                  borderColor: "#e0e7ff"
                }}
              >
                {/* Número absoluto estilo design */}
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-lg font-bold text-primary-600">
                  {index + 1}
                </div>
                
                <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  {item.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {item.title.split('.')[1]}
                </h3>
                
                <p className="text-gray-600">
                  {item.description}
                </p>
                
                {/* Indicador de seta entre os passos (exceto o último) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ChevronRight className="w-5 h-5 text-primary-500" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Botão CTA centralizado */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/auth?tab=register">
              <Button size="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-5 rounded-lg shadow-lg">
                Comece agora mesmo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-gray-50 relative overflow-hidden">
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
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Benefícios <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Reais</span>
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              O Hemolog transforma seus dados de saúde em informações valiosas e acionáveis para você e sua família.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Histórico cronológico automático",
                description: "Todos os seus exames organizados cronologicamente sem esforço.",
                delay: 0
              },
              {
                title: "Alertas inteligentes",
                description: "Notificações personalizadas para valores fora do ideal.",
                delay: 0.1
              },
              {
                title: "Relatórios em linguagem clara",
                description: "Informações médicas traduzidas para termos compreensíveis.",
                delay: 0.2
              },
              {
                title: "Comparação ao longo do tempo",
                description: "Acompanhe a evolução dos seus indicadores de saúde.",
                delay: 0.3
              },
              {
                title: "Compatível com sistemas médicos",
                description: "Integração fácil com clínicas e planos de saúde.",
                delay: 0.4
              },
              {
                title: "Compartilhamento seguro",
                description: "Envie relatórios diretamente para seus médicos.",
                delay: 0.5
              },
            ].map((benefit, index) => (
              <motion.div 
                key={index}
                className="relative bg-white p-6 rounded-xl shadow-md overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: benefit.delay }}
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
              >
                {/* Elemento decorativo */}
                <div className="absolute -left-4 -top-4 w-16 h-16 bg-primary-50 rounded-full opacity-70 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="flex items-start relative z-10">
                  <div className="bg-green-50 p-2 rounded-full mr-4 mt-1">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
                
                {/* Indicador sutil de destaque */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
          
          {/* Destaque estatístico */}
          <motion.div 
            className="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="p-8 text-center border-b md:border-b-0 md:border-r border-gray-100">
                <h3 className="text-4xl font-bold text-primary-600 mb-2">93%</h3>
                <p className="text-gray-600">dos usuários relatam melhor entendimento de sua saúde</p>
              </div>
              <div className="p-8 text-center border-b md:border-b-0 md:border-r border-gray-100">
                <h3 className="text-4xl font-bold text-primary-600 mb-2">87%</h3>
                <p className="text-gray-600">sentem mais confiança nas consultas médicas</p>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-4xl font-bold text-primary-600 mb-2">78%</h3>
                <p className="text-gray-600">compartilham seus relatórios com médicos</p>
              </div>
            </div>
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
              Para Quem é o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>?
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Nossa plataforma atende diferentes necessidades e perfis, criando valor em cada etapa da jornada de saúde.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Activity className="w-7 h-7 text-white" />,
                title: "Pacientes crônicos",
                description: "Monitoramento contínuo e organizado de seus exames recorrentes",
                delay: 0,
                gradient: "from-primary-500 to-primary-600"
              },
              {
                icon: <Users className="w-7 h-7 text-white" />,
                title: "Famílias",
                description: "Histórico de saúde centralizado para gerenciar a saúde familiar",
                delay: 0.1,
                gradient: "from-primary-600 to-indigo-600"
              },
              {
                icon: <span className="text-white text-2xl font-bold">👨‍⚕️</span>,
                title: "Profissionais de saúde",
                description: "Relatórios prontos para consultas mais eficientes e focadas",
                delay: 0.2,
                gradient: "from-indigo-600 to-blue-600"
              },
              {
                icon: <Building className="w-7 h-7 text-white" />,
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
              O Que Dizem Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Usuários</span>
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
              Perguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Frequentes</span>
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

      {/* Call to Action Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Fundo gradiente com efeitos visuais */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-indigo-800 overflow-hidden">
          {/* Elementos decorativos flutuantes */}
          <motion.div 
            className="absolute top-10 left-[10%] w-64 h-64 bg-primary-600 rounded-full mix-blend-multiply opacity-40 blur-3xl"
            animate={{ 
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute bottom-10 right-[10%] w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply opacity-40 blur-3xl"
            animate={{ 
              y: [0, -40, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-blue-600 rounded-full mix-blend-multiply opacity-30 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* Padrão de pontos para textura */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-white/20">
              <div className="text-center text-white">
                <motion.h2 
                  className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Transforme seus exames em <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">decisões inteligentes</span>.
                </motion.h2>
                
                <motion.p 
                  className="text-xl mb-10 max-w-2xl mx-auto text-blue-50"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Comece a usar o Hemolog agora mesmo e tenha o controle da sua saúde com análises inteligentes e visualizações claras.
                </motion.p>
                
                {/* Botões de ação */}
                <motion.div 
                  className="flex flex-col sm:flex-row justify-center gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Link href="/auth?tab=register">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button size="lg" className="bg-white text-primary-800 hover:bg-blue-50 px-10 py-7 rounded-xl shadow-xl text-lg font-semibold">
                        Criar conta gratuita
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-10 py-7 rounded-xl text-lg font-semibold">
                      <Play className="mr-2 h-5 w-5" />
                      Ver demonstração
                    </Button>
                  </motion.div>
                </motion.div>
                
                {/* Indicação de custo zero */}
                <motion.div 
                  className="mt-8 text-sm text-blue-100 flex justify-center items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Sem custo inicial | Sem necessidade de cartão de crédito | Cancele a qualquer momento</span>
                </motion.div>
              </div>
            </div>
            
            {/* Logotipos de confiabilidade */}
            <motion.div 
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-sm uppercase text-blue-200 tracking-wider mb-6">Compatível com os principais sistemas</p>
              <div className="flex flex-wrap justify-center gap-8 items-center">
                {["Sistema A", "Sistema B", "Sistema C", "Sistema D"].map((system, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <span className="text-white font-semibold">{system}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pré-footer com dados e gráficos */}
      <section className="py-20 bg-gradient-to-b from-primary-900 via-primary-800 to-indigo-900 text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            className="absolute top-10 right-10 w-96 h-96 bg-white rounded-full opacity-3 blur-3xl"
            animate={{
              y: [0, 10, 0],
              x: [0, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-80 h-80 bg-white rounded-full opacity-3 blur-3xl"
            animate={{
              y: [0, -15, 0],
              x: [0, 8, 0],
              scale: [1, 1.08, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* Padrões decorativos no fundo */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/50 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white mb-4">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Visualização de Dados</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              Compreenda seus dados de saúde com clareza
            </h2>
            <p className="text-lg text-white/80">
              Nossa plataforma analisa seus exames ao longo do tempo, extraindo métricas importantes e fornecendo insights contextualizados.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Gráfico simulado 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-400/20 flex items-center justify-center mr-2">
                    <Activity className="h-4 w-4 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-medium">Glicemia</h3>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-400/10">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <span className="text-xs text-teal-300">Últimos 6 meses</span>
                </div>
              </div>
              
              <div className="h-40 relative bg-gradient-to-b from-transparent via-transparent to-teal-900/10 rounded-lg p-4">
                {/* Linhas de grade horizontais */}
                <div className="absolute inset-x-10 inset-y-0 flex flex-col justify-between">
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                </div>
                
                {/* Eixo Y - Valores */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-white/70">
                  <span>120</span>
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                </div>
                
                {/* Gráfico simulado */}
                <div className="absolute left-10 right-0 inset-y-0 flex items-end">
                  <svg viewBox="0 0 300 120" className="w-full h-32">
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(45, 212, 191, 0.5)" />
                        <stop offset="100%" stopColor="rgba(45, 212, 191, 0)" />
                      </linearGradient>
                    </defs>
                    
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d="M0,60 C20,75 40,50 60,55 C80,60 100,40 120,45 C140,50 160,30 180,25 C200,20 220,35 240,30 C260,25 280,35 300,30"
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <motion.path
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      d="M0,60 C20,75 40,50 60,55 C80,60 100,40 120,45 C140,50 160,30 180,25 C200,20 220,35 240,30 C260,25 280,35 300,30 L300,120 L0,120 Z"
                      fill="url(#gradient1)"
                    />
                    
                    {/* Pontos de dados */}
                    <motion.circle 
                      cx="0" cy="60" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 }}
                    />
                    <motion.circle 
                      cx="60" cy="55" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    />
                    <motion.circle 
                      cx="120" cy="45" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 }}
                    />
                    <motion.circle 
                      cx="180" cy="25" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.6 }}
                    />
                    <motion.circle 
                      cx="240" cy="30" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.8 }}
                    />
                    <motion.circle 
                      cx="300" cy="30" r="4" 
                      fill="#2DD4BF"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2 }}
                    />
                  </svg>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/70 px-8">
                  <span>JAN</span>
                  <span>FEV</span>
                  <span>MAR</span>
                  <span>ABR</span>
                  <span>MAI</span>
                  <span>JUN</span>
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-xs text-white/70">Valor atual</div>
                  <div className="text-xl font-bold text-teal-400">92 mg/dL</div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" /> 
                  <span className="text-xs font-medium text-green-400">Estável</span>
                </div>
              </div>
            </motion.div>
            
            {/* Gráfico simulado 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-400/20 flex items-center justify-center mr-2">
                    <Activity className="h-4 w-4 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-medium">Colesterol</h3>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-400/10">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <span className="text-xs text-rose-300">Últimos 6 meses</span>
                </div>
              </div>
              
              <div className="h-40 relative bg-gradient-to-b from-transparent via-transparent to-rose-900/10 rounded-lg p-4">
                {/* Linhas de grade horizontais */}
                <div className="absolute inset-x-10 inset-y-0 flex flex-col justify-between">
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                </div>
                
                {/* Eixo Y - Valores */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-white/70">
                  <span>240</span>
                  <span>200</span>
                  <span>160</span>
                  <span>120</span>
                </div>
                
                {/* Gráfico simulado */}
                <div className="absolute left-10 right-0 inset-y-0 flex items-end">
                  <svg viewBox="0 0 300 120" className="w-full h-32">
                    <defs>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(251, 113, 133, 0.5)" />
                        <stop offset="100%" stopColor="rgba(251, 113, 133, 0)" />
                      </linearGradient>
                    </defs>
                    
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d="M0,80 C20,85 40,75 60,70 C80,65 100,75 120,65 C140,55 160,60 180,50 C200,40 220,45 240,40 C260,35 280,30 300,25"
                      fill="none"
                      stroke="#FB7185"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <motion.path
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      d="M0,80 C20,85 40,75 60,70 C80,65 100,75 120,65 C140,55 160,60 180,50 C200,40 220,45 240,40 C260,35 280,30 300,25 L300,120 L0,120 Z"
                      fill="url(#gradient2)"
                    />
                    
                    {/* Pontos de dados */}
                    <motion.circle 
                      cx="0" cy="80" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 }}
                    />
                    <motion.circle 
                      cx="60" cy="70" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    />
                    <motion.circle 
                      cx="120" cy="65" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 }}
                    />
                    <motion.circle 
                      cx="180" cy="50" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.6 }}
                    />
                    <motion.circle 
                      cx="240" cy="40" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.8 }}
                    />
                    <motion.circle 
                      cx="300" cy="25" r="4" 
                      fill="#FB7185"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2 }}
                    />
                  </svg>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/70 px-8">
                  <span>JAN</span>
                  <span>FEV</span>
                  <span>MAR</span>
                  <span>ABR</span>
                  <span>MAI</span>
                  <span>JUN</span>
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-xs text-white/70">Valor atual</div>
                  <div className="text-xl font-bold text-rose-400">198 mg/dL</div>
                </div>
                <div className="px-3 py-1 bg-amber-500/20 rounded-full flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1 text-amber-400" /> 
                  <span className="text-xs font-medium text-amber-400">Melhorando</span>
                </div>
              </div>
            </motion.div>
            
            {/* Gráfico simulado 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-violet-400/20 flex items-center justify-center mr-2">
                    <Activity className="h-4 w-4 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-medium">Hemoglobina</h3>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-400/10">
                  <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                  <span className="text-xs text-violet-300">Últimos 6 meses</span>
                </div>
              </div>
              
              <div className="h-40 relative bg-gradient-to-b from-transparent via-transparent to-violet-900/10 rounded-lg p-4">
                {/* Linhas de grade horizontais */}
                <div className="absolute inset-x-10 inset-y-0 flex flex-col justify-between">
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                  <div className="w-full h-px bg-white/10"></div>
                </div>
                
                {/* Eixo Y - Valores */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-white/70">
                  <span>16</span>
                  <span>14</span>
                  <span>12</span>
                  <span>10</span>
                </div>
                
                {/* Gráfico simulado */}
                <div className="absolute left-10 right-0 inset-y-0 flex items-end">
                  <svg viewBox="0 0 300 120" className="w-full h-32">
                    <defs>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(167, 139, 250, 0.5)" />
                        <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
                      </linearGradient>
                    </defs>
                    
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d="M0,60 C20,65 40,60 60,55 C80,50 100,53 120,50 C140,47 160,50 180,55 C200,60 220,55 240,50 C260,45 280,47 300,45"
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <motion.path
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                      d="M0,60 C20,65 40,60 60,55 C80,50 100,53 120,50 C140,47 160,50 180,55 C200,60 220,55 240,50 C260,45 280,47 300,45 L300,120 L0,120 Z"
                      fill="url(#gradient3)"
                    />
                    
                    {/* Pontos de dados */}
                    <motion.circle 
                      cx="0" cy="60" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 }}
                    />
                    <motion.circle 
                      cx="60" cy="55" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    />
                    <motion.circle 
                      cx="120" cy="50" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 }}
                    />
                    <motion.circle 
                      cx="180" cy="55" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.6 }}
                    />
                    <motion.circle 
                      cx="240" cy="50" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.8 }}
                    />
                    <motion.circle 
                      cx="300" cy="45" r="4" 
                      fill="#A78BFA"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2 }}
                    />
                  </svg>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/70 px-8">
                  <span>JAN</span>
                  <span>FEV</span>
                  <span>MAR</span>
                  <span>ABR</span>
                  <span>MAI</span>
                  <span>JUN</span>
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="text-xs text-white/70">Valor atual</div>
                  <div className="text-xl font-bold text-violet-400">14.2 g/dL</div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" /> 
                  <span className="text-xs font-medium text-green-400">Excelente</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="flex justify-center">
            <Link href="/auth?tab=register">
              <Button size="lg" className="bg-white text-primary-800 hover:bg-primary-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8">
                Comece agora <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => setShowCookieConsent(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Rejeitar
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCookieConsent(false)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Aceitar
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}