import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, ChevronRight, Activity, Heart, BarChart2, User } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Usuário deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Dados de exemplo para gráficos interativos
const healthData = [
  { name: 'Jan', value: 135, status: 'normal' },
  { name: 'Fev', value: 128, status: 'normal' },
  { name: 'Mar', value: 146, status: 'alto' },
  { name: 'Abr', value: 142, status: 'alto' },
  { name: 'Mai', value: 138, status: 'normal' },
  { name: 'Jun', value: 130, status: 'normal' },
];

const cholesterolData = [
  { name: 'HDL', value: 55 },
  { name: 'LDL', value: 120 },
  { name: 'Triglicerídeos', value: 150 },
];

const COLORS = ['#4F46E5', '#8884d8', '#0088FE', '#00C49F', '#FFBB28'];
const HEALTH_COLORS = {
  normal: '#10B981',
  alto: '#EF4444',
  baixo: '#3B82F6',
  atenção: '#F59E0B'
};

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  // Removemos a variável showQuickLogin que não é mais necessária
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Monitorar os campos do formulário de login 
  const username = useWatch({
    control: loginForm.control,
    name: "username",
  });
  
  const password = useWatch({
    control: loginForm.control,
    name: "password",
  });
  
  // Removemos a lógica do botão rápido para simplificar a interface
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex md:flex-row flex-col bg-gradient-to-br from-primary-50 to-white relative">
      {/* Botão para voltar para a landing page */}
      <Link href="/" className="absolute top-4 left-4 z-10">
        <Button variant="outline" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <ArrowLeft size={18} />
        </Button>
      </Link>
      
      {/* Left side - Form */}
      <div className="md:w-3/5 w-full flex flex-col justify-center items-center p-6 min-h-screen">
        {/* Cabeçalho com logo VitaView acima do card */}
        <div className="w-full max-w-md mb-0 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="flex justify-center w-full my-4">
              <div className="flex flex-col items-center">
                <img 
                  src="/assets/vitaview_logo_icon.png" 
                  alt="VitaView AI Logo" 
                  className="h-20 w-auto object-contain mb-2" 
                  onError={(e) => {
                    console.error("Erro ao carregar logo:", e);
                    e.currentTarget.onerror = null;
                  }}
                />
                <div className="text-center mt-2 mb-2">
                  <span className="font-semibold text-[#1E3A5F] text-2xl">VitaView</span>
                  <span className="font-semibold text-[#448C9B] text-2xl">AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <Card className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-t-[#1E3A5F] border border-gray-100 relative mt-3">
          {/* Banner de branding no topo do card */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4F7C] py-2 px-4 text-center">
            <span className="text-white font-medium text-sm">Sua plataforma de saúde inteligente</span>
          </div>
          
          <CardHeader className="text-center pt-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <span>Acesse sua conta</span>
            </CardTitle>
            <CardDescription className="text-gray-600 text-center">
              Faça login para gerenciar seus exames de saúde
            </CardDescription>
          </CardHeader>
        
          <CardContent>
            <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite seu usuário"
                              {...field}
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Digite sua senha"
                              {...field}
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button variant="link" className="text-sm text-[#1E3A5F] px-0">
                        Esqueceu a senha?
                      </Button>
                    </div>
                    
                    <Button
                      ref={submitButtonRef}
                      type="submit"
                      size="lg"
                      className="w-full h-14 bg-[#448C9B] hover:bg-[#336D7A] font-bold text-lg text-white shadow-md rounded-lg"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "ENTRAR"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-center">
                  <p className="text-gray-600 text-sm">
                    Não tem uma conta?{" "}
                    <Button variant="link" className="p-0 text-[#448C9B] hover:text-[#336D7A]" onClick={() => setTab("register")}>
                      Cadastre-se
                    </Button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Escolha um nome de usuário"
                              {...field}
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite seu nome completo"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Digite seu email"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Crie uma senha"
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirme a Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirme sua senha"
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#1E3A5F] hover:bg-[#152D48] font-medium text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-center">
                  <p className="text-gray-600 text-sm">
                    Já tem uma conta?{" "}
                    <Button variant="link" className="p-0" onClick={() => setTab("login")}>
                      Faça login
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Hero with interactive graphics */}
      <div className="md:w-2/5 w-full bg-gradient-to-br from-primary-50 to-primary-100 md:flex flex-col justify-center items-center p-8 hidden min-h-screen">
        <div className="max-w-lg">
          {/* Title section - Removido o logo grande do topo */}
          <div className="text-center mb-8 bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              <span className="text-primary-600">Mais controle,</span> <span className="text-primary-800">menos papel</span>
            </h2>
            <p className="text-base text-gray-600 mb-2">
              Todos os seus exames e informações de saúde reunidos em um só lugar, sempre ao seu alcance.
            </p>
          </div>
          
          {/* Interactive graphics with 2 rows of charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Interactive Chart 1: Line Chart with animation */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-md p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-500" />
                  <h3 className="font-medium text-gray-800">Glicemia</h3>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                  Últimos 6 meses
                </span>
              </div>
              
              <div className="h-[90px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={healthData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-xs">
                              <p className="font-medium">{`${payload[0].payload.name}: ${payload[0].value}`}</p>
                              <p className="text-xs capitalize">{`Status: ${payload[0].payload.status}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      activeDot={{ r: 6, fill: "#4F46E5", stroke: "white", strokeWidth: 2 }}
                      dot={{ r: 4, fill: "white", stroke: "#4F46E5", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            {/* Interactive Chart 2: Area Chart with animation */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="font-medium text-gray-800">Perfil Lipídico</h3>
                </div>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full text-center">
                  Análise recente
                </span>
              </div>
              
              <div className="h-[80px] flex items-center justify-center px-2">
                <div className="w-16 h-16 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cholesterolData}
                        cx="50%"
                        cy="50%"
                        innerRadius={12}
                        outerRadius={26}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {cholesterolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="ml-3 space-y-1 flex-1">
                  {cholesterolData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-xs">
                      <div 
                        className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-gray-700 truncate">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Interactive Chart 3: Bar Chart with animation */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium text-gray-800">Status de Resultados</h3>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-center">
                  Último exame
                </span>
              </div>
              
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Normal', value: 12 },
                      { name: 'Alto', value: 3 },
                      { name: 'Baixo', value: 2 },
                    ]}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[
                        { name: 'Normal', fill: HEALTH_COLORS.normal },
                        { name: 'Alto', fill: HEALTH_COLORS.alto },
                        { name: 'Baixo', fill: HEALTH_COLORS.baixo },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            {/* Interactive element 4: Health Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-md p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-gray-800">Perfil de Saúde</h3>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Personalizado
                </span>
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Índice de Saúde</span>
                  <div className="flex items-center">
                    <span className="text-green-600 font-bold text-lg">87</span>
                    <span className="text-xs text-gray-500 ml-1">/100</span>
                  </div>
                </div>
                
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  />
                </div>
                
                {/* Categorias de exames - Simulação */}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Glicemia: Normal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-gray-600">Colesterol: Atenção</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Hemoglobina: Normal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Vitamina D: Normal</span>
                  </div>
                </div>
                

              </div>
            </motion.div>
          </div>
          
          {/* Features section */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span className="ml-2 text-gray-700">Seguro e privado</span>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <span className="ml-2 text-gray-700">Alertas de saúde</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}