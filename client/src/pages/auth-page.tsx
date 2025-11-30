import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
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

      {/* Main Content - Centered Form */}
      <div className="w-full flex flex-col justify-center items-center p-6 min-h-screen relative z-10">
        {/* Cabeçalho com logo VitaView acima do card */}
        <div className="w-full max-w-md mb-0 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="flex justify-center w-full my-4">
              <Logo
                size="xl"
                showText={true}
                textSize="lg"
                className="flex-col items-center"
              />
            </div>
          </motion.div>
        </div>

        <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border-t-4 border-t-[#1E3A5F] border border-gray-100 relative mt-3">
          {/* Banner de branding no topo do card */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4F7C] py-3 px-4 text-center">
            <span className="text-white font-medium text-sm tracking-wide">Gestão Clínica Inteligente</span>
          </div>

          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <span>Acesse sua conta</span>
            </CardTitle>
            <CardDescription className="text-gray-600 text-center mt-2">
              Bem-vindo ao VitaView AI
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
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
                              className="h-11"
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
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-sm text-[#1E3A5F] hover:underline px-0 font-medium">
                        Esqueceu a senha?
                      </Link>
                    </div>

                    <Button
                      ref={submitButtonRef}
                      type="submit"
                      size="lg"
                      className="w-full h-12 bg-[#448C9B] hover:bg-[#336D7A] font-bold text-lg text-white shadow-md rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
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

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Não tem uma conta?{" "}
                    <Button variant="link" className="p-0 text-[#448C9B] hover:text-[#336D7A] font-semibold" onClick={() => setTab("register")}>
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
                              className="h-11"
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
                              className="h-11"
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
                              className="h-11"
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
                              className="h-11"
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
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 bg-[#1E3A5F] hover:bg-[#152D48] font-medium text-white shadow-md rounded-lg mt-2"
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

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Já tem uma conta?{" "}
                    <Button variant="link" className="p-0 text-[#1E3A5F] font-semibold" onClick={() => setTab("login")}>
                      Faça login
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 VitaView AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}