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
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mr-3">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-primary-800">Hemolog</span>
          </div>
          <div className="hidden md:flex space-x-8 text-gray-600">
            <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Como funciona</a>
            <a href="#beneficios" className="hover:text-primary-600 transition-colors">Benefícios</a>
            <a href="#para-quem" className="hover:text-primary-600 transition-colors">Para quem</a>
            <a href="#depoimentos" className="hover:text-primary-600 transition-colors">Depoimentos</a>
          </div>
          <div>
            <Link href="/auth">
              <Button variant="default" className="bg-primary-600 hover:bg-primary-700">
                Acessar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              <span className="text-primary-600">Hemolog</span>: seu histórico de exames, interpretado e visualizado com inteligência.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Carregue seus exames em PDF ou imagem e receba análises automáticas, alertas personalizados e gráficos evolutivos com apoio de IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-6 rounded-lg shadow-lg transform transition-transform hover:scale-105">
                  Criar minha conta gratuita
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-6 rounded-lg">
                Ver demonstração
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://placehold.co/600x400/e6f2ff/0066cc?text=Hemolog+Dashboard" 
              alt="Dashboard do Hemolog" 
              className="rounded-xl shadow-2xl max-w-full h-auto object-cover transform hover:rotate-1 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Você já recebeu um exame e ficou sem saber o que ele realmente significava?
          </h2>
          <p className="text-xl max-w-3xl mx-auto">
            A interpretação de exames ainda é um mistério para muitas pessoas. Com o Hemolog, você transforma números e siglas em informações compreensíveis e ações de saúde claras.
          </p>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Como Funciona o <span className="text-primary-600">Hemolog</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">1. Envio Simples</h3>
              <p className="text-gray-600">
                Faça upload de exames em PDF, JPEG ou PNG — até uma foto funciona.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">2. Leitura com IA</h3>
              <p className="text-gray-600">
                Nosso sistema usa inteligência artificial para identificar os exames, extrair os dados e interpretá-los com base em sexo, idade e histórico.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <LineChart className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">3. Acompanhamento Evolutivo</h3>
              <p className="text-gray-600">
                Veja gráficos, alertas automáticos e receba insights práticos com base nos seus resultados anteriores.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">4. Segurança Médica</h3>
              <p className="text-gray-600">
                Seus dados são criptografados e seguem padrões internacionais de proteção.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Benefícios Reais
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Histórico cronológico automático de todos os seus exames
                </p>
              </div>
              
              <div className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Alertas inteligentes para valores fora do ideal
                </p>
              </div>
              
              <div className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Relatórios de saúde gerados com linguagem clara
                </p>
              </div>
              
              <div className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Comparação entre exames ao longo dos anos
                </p>
              </div>
              
              <div className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <p className="ml-4 text-lg text-gray-700">
                  Compatível com clínicas e planos de saúde
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section id="para-quem" className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Para Quem é o <span className="text-primary-600">Hemolog</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Pacientes crônicos</h3>
                <p className="text-gray-600">
                  Monitoramento contínuo e organizado de seus exames recorrentes
                </p>
              </div>
            </div>
            
            <div className="relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Famílias</h3>
                <p className="text-gray-600">
                  Histórico de saúde centralizado para gerenciar a saúde familiar
                </p>
              </div>
            </div>
            
            <div className="relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                  <div className="text-white text-2xl font-bold">👨‍⚕️</div>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Profissionais de saúde</h3>
                <p className="text-gray-600">
                  Relatórios prontos para consultas mais eficientes e focadas
                </p>
              </div>
            </div>
            
            <div className="relative bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                  <Building className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Clínicas e planos de saúde</h3>
                <p className="text-gray-600">
                  Ferramenta para engajar e cuidar melhor dos pacientes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            O Que Dizem Nossos Usuários
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 relative">
              <div className="text-primary-600 text-6xl absolute -top-6 left-6">"</div>
              <div className="pt-4">
                <p className="text-gray-700 italic mb-6">
                  O Hemolog me ajudou a entender como meus exames evoluíram nos últimos anos. Hoje, me sinto no controle da minha saúde.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Ana Tavares</h4>
                    <p className="text-gray-600 text-sm">59 anos, Paciente</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 relative">
              <div className="text-primary-600 text-6xl absolute -top-6 left-6">"</div>
              <div className="pt-4">
                <p className="text-gray-700 italic mb-6">
                  Uso com meus pacientes e ganho tempo nas consultas. Os gráficos ajudam muito na explicação e o histórico evolutivo é um diferencial.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Dr. Marcos Henrique</h4>
                    <p className="text-gray-600 text-sm">Geriatra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary-800 to-primary-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Transforme seus exames em decisões inteligentes.
          </h2>
          <p className="text-xl mb-8 max-w-xl mx-auto">
            Comece a usar o Hemolog agora mesmo e tenha o controle da sua saúde.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth?tab=register">
              <Button size="lg" className="bg-white text-primary-800 hover:bg-gray-100 px-8 py-6 rounded-lg shadow-xl transform transition-transform hover:scale-105 text-lg">
                Criar conta gratuita
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-primary-700 px-8 py-6 rounded-lg text-lg">
              Ver exemplo de relatório
            </Button>
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