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
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-4">
        <Card className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative">
          {/* Botão ENTRAR grande e evidente quando os campos estão preenchidos */}
          {/* Removemos o botão flutuante para evitar confusão */}
          
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-10 h-10 fill-current"
                >
                  <path d="M19 5.5h-4.5V1H9v4.5H4.5V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5.5zm-9-3h3V7h4.5v10.5c0 .55-.45 1-1 1h-10c-.55 0-1-.45-1-1V7H11V2.5z"/>
                  <path d="M11 11h2v6h-2z"/>
                  <path d="M11 9h2v1h-2z"/>
                </svg>
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>
            </CardTitle>
            <CardDescription className="text-gray-500">
              A evolução da sua saúde começa com o entendimento dos seus exames
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
                      <Button variant="link" className="text-sm text-primary-600 px-0">
                        Esqueceu a senha?
                      </Button>
                    </div>
                    
                    <Button
                      ref={submitButtonRef}
                      type="submit"
                      size="lg"
                      className="w-full h-14 bg-green-600 hover:bg-green-700 font-bold text-lg text-white shadow-md rounded-lg"
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
                    <Button variant="link" className="p-0" onClick={() => setTab("register")}>
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
                      className="w-full bg-primary-600 hover:bg-primary-700 font-medium text-white"
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
      <div className="md:w-1/2 w-full bg-primary-50 md:flex flex-col justify-center items-center p-8 hidden">
        <div className="max-w-lg">
          {/* Title section */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>: Análise de Exames com Inteligência Artificial
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              A evolução da sua saúde começa com o entendimento dos seus exames. Transforme dados em ações com nossa análise AI avançada.
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
              
              <div className="h-[160px]">
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
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  Análise recente
                </span>
              </div>
              
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cholesterolData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {cholesterolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
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
              className="bg-white rounded-xl shadow-md p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-gray-800">Seu Perfil de Saúde</h3>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  Personalizado
                </span>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Índice de Saúde</span>
                  <div className="flex items-center">
                    <span className="text-primary-600 font-medium">87</span>
                    <span className="text-xs text-gray-500 ml-1">/100</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full bg-primary-500 rounded-full"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Faça login para ver sua análise completa
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