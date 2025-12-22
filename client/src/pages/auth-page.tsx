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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

/**
 * VitaView AI Auth Page
 * 
 * Design Language:
 * - Fundo Background Gray (#F4F4F4)
 * - Card branco com bordas Light Gray
 * - Tipografia: Montserrat Bold para títulos, Open Sans para corpo
 * - Botões: Charcoal Gray (#212121) primário
 * - Minimalista, limpo, focado em conteúdo
 */

const loginSchema = z.object({
  username: z.string().min(3, { message: "Usuário deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os Termos de Uso para continuar",
  }),
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

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, acceptedTerms, ...registerData } = values;
    // Add timestamp of terms acceptance
    const dataWithTerms = {
      ...registerData,
      acceptedTermsAt: new Date().toISOString(),
    };
    registerMutation.mutate(dataWithTerms as any);
  };

  return (
    <div className="min-h-screen flex md:flex-row flex-col bg-[#F4F4F4] relative">
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
                showText={false}
                variant="full"
                className="flex-col items-center"
              />
            </div>
          </motion.div>
        </div>

        <Card className="max-w-md w-full bg-white rounded-lg border border-[#E0E0E0] overflow-hidden relative mt-3">
          {/* Banner de branding no topo do card */}
          <div className="bg-[#212121] py-3 px-4 text-center">
            <span className="text-white font-heading font-bold text-sm tracking-wide">
              O Prontuário que Pensa com Você
            </span>
          </div>

          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-heading font-bold text-[#212121] flex items-center justify-center gap-2">
              <span>Acesse sua conta</span>
            </CardTitle>
            <CardDescription className="text-[#9E9E9E] text-center mt-2 font-body">
              Bem-vindo ao VitaView AI
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#E0E0E0] p-1 rounded-lg">
                <TabsTrigger
                  value="login"
                  className="rounded-md font-heading font-bold data-[state=active]:bg-[#212121] data-[state=active]:text-white text-[#212121]"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-md font-heading font-bold data-[state=active]:bg-[#212121] data-[state=active]:text-white text-[#212121]"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Usuário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite seu usuário"
                              {...field}
                              autoComplete="username"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Digite sua senha"
                              {...field}
                              autoComplete="current-password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-sm text-[#212121] hover:underline px-0 font-body">
                        Esqueceu a senha?
                      </Link>
                    </div>

                    <Button
                      ref={submitButtonRef}
                      type="submit"
                      size="lg"
                      className="w-full h-12 bg-[#212121] hover:bg-[#424242] font-heading font-bold text-lg text-white rounded-lg transition-all duration-200"
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
                  <p className="text-[#9E9E9E] text-sm font-body">
                    Não tem uma conta?{" "}
                    <Button
                      variant="link"
                      className="p-0 text-[#212121] hover:text-[#424242] font-heading font-bold"
                      onClick={() => setTab("register")}
                    >
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
                          <FormLabel className="font-heading font-bold text-[#212121]">Usuário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Escolha um nome de usuário"
                              {...field}
                              autoComplete="username"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Nome Completo</FormLabel>
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
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Email</FormLabel>
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
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Crie uma senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-[#212121]">Confirme a Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirme sua senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-[#D32F2F]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#E0E0E0] p-4 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-[#212121] data-[state=checked]:border-[#212121]"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-body text-[#424242] cursor-pointer">
                              Li e aceito os{" "}
                              <Link href="/termos" target="_blank" className="text-[#212121] underline font-semibold hover:text-[#424242]">
                                Termos de Uso
                              </Link>{" "}
                              e a{" "}
                              <Link href="/privacidade" target="_blank" className="text-[#212121] underline font-semibold hover:text-[#424242]">
                                Política de Privacidade
                              </Link>
                            </FormLabel>
                            <FormMessage className="text-[#D32F2F]" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 bg-[#212121] hover:bg-[#424242] font-heading font-bold text-white rounded-lg mt-2"
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
                  <p className="text-[#9E9E9E] text-sm font-body">
                    Já tem uma conta?{" "}
                    <Button
                      variant="link"
                      className="p-0 text-[#212121] font-heading font-bold"
                      onClick={() => setTab("login")}
                    >
                      Faça login
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-[#9E9E9E] text-sm font-body">
          <p>&copy; 2025 VitaView AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}