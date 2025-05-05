import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
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
    <div className="min-h-screen flex md:flex-row flex-col bg-gradient-to-br from-primary-50 to-white">
      
      {/* Left side - Form */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-4">
        <Card className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-10 h-10 fill-current"
                >
                  <path d="M19 5.5h-4.5V1H9v4.5H4.5V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5.5zm-9-3h3V7h4.5v10.5c0 .55-.45 1-1 1h-10c-.55 0-1-.45-1-1V7H11V2.5z"/>
                  <path d="M11 11h2v6h-2z"/>
                  <path d="M11 9h2v1h-2z"/>
                </svg>
              </div>
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
                      type="submit"
                      size="lg"
                      className="w-full bg-primary-600 hover:bg-primary-700 font-medium text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
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
      
      {/* Right side - Hero with illustration */}
      <div className="md:w-1/2 w-full bg-primary-50 md:flex flex-col justify-center items-center p-8 hidden">
        <div className="max-w-md text-center">
          <div className="relative w-full h-64 mb-8">
            {/* Hero illustration */}
            <div className="absolute inset-0 transform transition-all duration-700 hover:rotate-1 hover:scale-105">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg">
                <path fill="#4F46E5" d="M43.2,-68.1C54.7,-58.1,62,-44.5,69.2,-30.7C76.5,-16.9,83.6,-2.9,81.1,9.6C78.6,22,66.4,32.9,56.1,42.9C45.8,52.9,37.3,62,26.6,70.5C15.9,79,8,87,-2.9,91.5C-13.8,96,-27.7,97,-38.7,90.3C-49.7,83.6,-57.8,69.2,-63.8,55.4C-69.8,41.6,-73.6,28.4,-76.1,14.6C-78.6,0.7,-79.7,-13.7,-76.2,-27.2C-72.8,-40.7,-64.7,-53.2,-53.1,-63.1C-41.6,-73,-20.8,-80.2,-2.1,-77.3C16.6,-74.4,33.2,-61.4,43.2,-68.1Z" transform="translate(100 125) scale(1.1)" />
              </svg>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white shadow-xl rounded-2xl p-6 w-48 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl mx-auto flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M19 5.5h-4.5V1H9v4.5H4.5V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5.5zm-9-3h3V7h4.5v10.5c0 .55-.45 1-1 1h-10c-.55 0-1-.45-1-1V7H11V2.5z"/>
                      <path d="M11 11h2v6h-2z"/>
                      <path d="M11 9h2v1h-2z"/>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">Seus exames</p>
                  <p className="text-sm text-gray-500">analisados por IA</p>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Hemolog</span>: Análise de Exames com Inteligência Artificial
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            A evolução da sua saúde começa com o entendimento dos seus exames. Transforme dados em ações com nossa análise AI avançada.
          </p>
          <div className="flex justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span className="ml-2 text-gray-700">Seguro e privado</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <span className="ml-2 text-gray-700">Alertas de saúde</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}