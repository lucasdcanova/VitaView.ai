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
  FileBarChart
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function LandingPage() {
  // Estado para animações e elementos interativos
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Efeito para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-100 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Animated floating elements */}
        <motion.div 
          className="absolute top-20 left-1/4 w-8 h-8 bg-primary-400 rounded-full opacity-20"
          animate={{ 
            y: [0, 15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        <motion.div 
          className="absolute top-40 right-1/3 w-5 h-5 bg-blue-400 rounded-md opacity-20"
          animate={{ 
            y: [0, -20, 0],
            x: [0, -15, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-40 left-1/3 w-6 h-6 bg-indigo-400 rounded-full opacity-20"
          animate={{ 
            y: [0, 25, 0],
            x: [0, -10, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
      </div>
      
      {/* Navbar */}
      <motion.nav 
        className={`${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-4'} sticky top-0 z-50 transition-all duration-300`}
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mr-3 shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-primary-800">Hemolog</span>
          </motion.div>
          <div className="hidden md:flex space-x-8 text-gray-600">
            {["como-funciona", "beneficios", "para-quem", "depoimentos"].map((id, index) => (
              <motion.a 
                key={id}
                href={`#${id}`} 
                className="hover:text-primary-600 transition-colors relative group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth">
              <Button variant="default" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md text-white">
                Acessar
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>: seu histórico de exames, interpretado e visualizado com inteligência.
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
            className="md:w-1/2 flex justify-center relative"
            variants={itemVariants}
          >
            {/* Elemento decorativo */}
            <div className="absolute -z-10 w-64 h-64 bg-primary-100 rounded-full opacity-50 blur-xl -top-10 -right-10"></div>
            
            {/* Imagem principal com sobreposição de elementos */}
            <div className="relative">
              <motion.img 
                src="https://placehold.co/600x400/e6f2ff/0066cc?text=Hemolog+Dashboard" 
                alt="Dashboard do Hemolog" 
                className="rounded-xl shadow-2xl max-w-full h-auto object-cover relative z-10"
                whileHover={{ 
                  rotate: 2,
                  transition: { duration: 0.3 }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              
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
      
      {/* Feature Showcase Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-gray-50 to-transparent"></div>
        
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mr-3">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-white">Hemolog</span>
              </div>
              <p className="max-w-xs">
                A evolução da sua saúde começa com o entendimento dos seus exames.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Plataforma</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Como funciona</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Empresa</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Hemolog. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}