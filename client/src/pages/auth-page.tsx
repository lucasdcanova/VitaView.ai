import {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import {
  useLocation,
  Link,
  useRoute
} from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  ArrowLeft,
  Moon,
  Sun,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { isRestrictedAppShell } from "@/lib/app-shell";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";

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
  email: z.string().trim().email({ message: "Digite um email válido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = z.object({
  fullName: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres" }),
  email: z.string().trim().email({ message: "Digite um email válido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string(),
  isSecretaryInviteRegistration: z.boolean().default(false),
  clinicInvitationCode: z.string().optional(),
  clinicInvitationToken: z.string().optional(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os Termos de Uso para continuar",
  }),
  acceptedHealthData: z.boolean().refine(val => val === true, {
    message: "O aceite para processamento de dados é obrigatório (LGPD)",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (!data.isSecretaryInviteRegistration) return true;
  return !!data.clinicInvitationCode?.trim() || !!data.clinicInvitationToken?.trim();
}, {
  message: "Informe o código do convite da clínica",
  path: ["clinicInvitationCode"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  const [acceptInvitationMatch, acceptInvitationParams] = useRoute("/accept-invitation/:token");
  const { loginMutation, registerMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const loginEmailInputRef = useRef<HTMLInputElement | null>(null);
  const loginPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const hideLandingBackButton = isRestrictedAppShell();
  const isDarkMode = theme === "dark";

  // Redirect logic removed to enforce manual login as requested
  // useEffect(() => {
  //   if (user) {
  //     navigate("/agenda");
  //   }
  // }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      isSecretaryInviteRegistration: false,
      clinicInvitationCode: "",
      clinicInvitationToken: "",
      acceptedTerms: false,
      acceptedHealthData: false,
    },
  });

  const isSecretaryInviteRegistration = registerForm.watch("isSecretaryInviteRegistration");
  const prefilledInvitationToken = registerForm.watch("clinicInvitationToken");
  const invitationTokenFromPath = ((acceptInvitationParams as { token?: string } | null)?.token ?? "").trim();

  const syncLoginFieldFromDom = useCallback((fieldName: keyof LoginFormValues, input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }

    const nextValue = input.value ?? "";
    if (nextValue === loginForm.getValues(fieldName)) {
      return;
    }

    loginForm.setValue(fieldName, nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
  }, [loginForm]);

  const syncLoginFormFromDom = useCallback(() => {
    syncLoginFieldFromDom("email", loginEmailInputRef.current);
    syncLoginFieldFromDom("password", loginPasswordInputRef.current);
  }, [syncLoginFieldFromDom]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    const inviteCodeParam = (searchParams.get("inviteCode") || searchParams.get("clinicInvitationCode") || "").trim();
    const inviteTokenParam = (searchParams.get("inviteToken") || searchParams.get("clinicInvitationToken") || "").trim();
    const inviteEmailParam = (searchParams.get("email") || "").trim();
    const roleParam = (searchParams.get("role") || "").trim().toLowerCase();
    const effectiveInvitationToken = invitationTokenFromPath || inviteTokenParam;
    const hasSecretaryInviteContext = !!inviteCodeParam || !!effectiveInvitationToken || roleParam === "secretary" || !!acceptInvitationMatch;

    if (tabParam === "register" || hasSecretaryInviteContext) {
      setTab("register");
    }

    if (hasSecretaryInviteContext) {
      registerForm.setValue("isSecretaryInviteRegistration", true, { shouldValidate: false });
    }

    if (inviteCodeParam && !registerForm.getValues("clinicInvitationCode")) {
      registerForm.setValue("clinicInvitationCode", inviteCodeParam.toUpperCase(), { shouldValidate: false });
    }

    if (effectiveInvitationToken && !registerForm.getValues("clinicInvitationToken")) {
      registerForm.setValue("clinicInvitationToken", effectiveInvitationToken, { shouldValidate: false });
    }

    if (inviteEmailParam && !registerForm.getValues("email")) {
      registerForm.setValue("email", inviteEmailParam, { shouldValidate: false });
    }
  }, [acceptInvitationMatch, invitationTokenFromPath, location, registerForm]);

  useEffect(() => {
    if (tab !== "login" || typeof window === "undefined") {
      return;
    }

    const syncSoon = () => {
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => {
          syncLoginFormFromDom();
        });
        return;
      }

      window.setTimeout(() => {
        syncLoginFormFromDom();
      }, 0);
    };

    const timeoutIds = [0, 250, 800].map((delay) => window.setTimeout(syncSoon, delay));
    const handlePageShow = () => syncSoon();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSoon();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncLoginFormFromDom, tab]);

  const onLoginSubmit = useCallback((values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  }, [loginMutation]);

  const handleLoginSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    syncLoginFormFromDom();

    const isValid = await loginForm.trigger(["email", "password"], { shouldFocus: true });
    if (!isValid) {
      if (loginForm.getFieldState("email").error) {
        loginEmailInputRef.current?.focus();
      } else if (loginForm.getFieldState("password").error) {
        loginPasswordInputRef.current?.focus();
      }
      return;
    }

    onLoginSubmit(loginForm.getValues());
  }, [loginForm, onLoginSubmit, syncLoginFormFromDom]);

  const onRegisterSubmit = (values: RegisterFormValues) => {
    const {
      confirmPassword,
      acceptedTerms,
      acceptedHealthData,
      isSecretaryInviteRegistration,
      clinicInvitationCode,
      clinicInvitationToken,
      ...registerData
    } = values;

    // LGPD Consents Payload
    const consents = [
      {
        consentType: 'terms_and_privacy',
        granted: true,
        purpose: 'Registration and basic service usage',
        legalBasis: 'consent',
        version: '1.0'
      },
      {
        consentType: 'health_data_processing',
        granted: true,
        purpose: 'Clinical analysis and AI processing of health records',
        legalBasis: 'consent',
        version: '1.0'
      }
    ];

    const dataWithTerms = {
      ...registerData,
      consents,
      ...(isSecretaryInviteRegistration ? {
        registrationIntent: "secretary" as const,
        clinicInvitationCode: clinicInvitationCode?.trim() || undefined,
        clinicInvitationToken: clinicInvitationToken?.trim() || undefined,
      } : {}),
    };
    registerMutation.mutate(dataWithTerms);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-black/[0.05] blur-3xl dark:bg-white/[0.08]" />
        <div className="absolute bottom-[-16%] right-[-8%] h-80 w-80 rounded-full bg-black/[0.06] blur-3xl dark:bg-slate-400/10" />
      </div>

      {!hideLandingBackButton && (
        <Button
          variant="outline"
          type="button"
          className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border-border/70 bg-background/85 p-0 shadow-sm backdrop-blur-sm hover:bg-background"
          onClick={() => navigate("/")}
          aria-label="Voltar para a landing page"
        >
          <ArrowLeft size={18} />
        </Button>
      )}

      <div className="absolute right-4 top-4 z-50">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/85 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <div className="hidden text-left sm:block">
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Aparência
              </p>
              <p className="font-body text-sm text-foreground">
                {isDarkMode ? "Modo escuro" : "Modo claro"}
              </p>
            </div>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label={isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro"}
          />
        </div>
      </div>

      {/* Main Content - Centered Form */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 py-16 sm:py-12">
        <div className="mb-2 flex w-full max-w-md flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2 flex items-center gap-3"
          >
            <div className="my-1 flex w-full justify-center">
              <Logo
                size="xl"
                showText={false}
                variant="full"
                className="flex-col items-center"
              />
            </div>
          </motion.div>
        </div>

        <Card className="relative mt-3 w-full max-w-md overflow-hidden rounded-[28px] border-border/80 bg-card/95 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm">
          {/* Banner de branding no topo do card */}
          <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
            <span className="font-heading text-sm font-bold tracking-wide">
              O Prontuário que Pensa com Você
            </span>
          </div>

          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="flex items-center justify-center gap-2 font-heading text-2xl font-bold text-foreground">
              <span>Acesse sua conta</span>
            </CardTitle>
            <CardDescription className="mt-2 text-center font-body text-muted-foreground">
              Bem-vindo ao VitaView AI
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg font-heading font-bold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg font-heading font-bold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={handleLoginSubmit} autoComplete="on" noValidate className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Email</FormLabel>
                          <FormControl>
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="Digite seu email"
                              value={field.value ?? ""}
                              onChange={(event) => {
                                field.onChange(event);
                                syncLoginFieldFromDom("email", event.currentTarget);
                              }}
                              onInput={(event) => {
                                syncLoginFieldFromDom("email", event.currentTarget);
                              }}
                              onBlur={(event) => {
                                field.onBlur();
                                syncLoginFieldFromDom("email", event.currentTarget);
                              }}
                              name={field.name}
                              ref={(node) => {
                                field.ref(node);
                                loginEmailInputRef.current = node;
                              }}
                              autoComplete="username"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              inputMode="email"
                              enterKeyHint="next"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Senha</FormLabel>
                          <FormControl>
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="Digite sua senha"
                              value={field.value ?? ""}
                              onChange={(event) => {
                                field.onChange(event);
                                syncLoginFieldFromDom("password", event.currentTarget);
                              }}
                              onInput={(event) => {
                                syncLoginFieldFromDom("password", event.currentTarget);
                              }}
                              onBlur={(event) => {
                                field.onBlur();
                                syncLoginFieldFromDom("password", event.currentTarget);
                              }}
                              name={field.name}
                              ref={(node) => {
                                field.ref(node);
                                loginPasswordInputRef.current = node;
                              }}
                              autoComplete="current-password"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              enterKeyHint="go"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="px-0 font-body text-sm text-foreground hover:text-foreground/80 hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>

                    {loginMutation.isError && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive">
                          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-heading font-bold text-destructive">Falha no login</p>
                          <p className="mt-0.5 font-body text-xs text-destructive/85">
                            {loginMutation.error?.message || "Email ou senha incorretos. Verifique seus dados e tente novamente."}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <BrandLoader className="mr-2 h-5 w-5 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "ENTRAR"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="font-body text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Button
                      variant="link"
                      type="button"
                      className="p-0 font-heading font-bold text-foreground hover:text-foreground/80"
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
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Nome Completo</FormLabel>
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
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Email</FormLabel>
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
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Crie uma senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading font-bold text-foreground">Confirme a Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirme sua senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="isSecretaryInviteRegistration"
                      render={({ field }) => (
                        <FormItem className="mt-1 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-sm text-muted-foreground">
                              Estou me cadastrando como <span className="font-bold text-foreground">secretária(o) por convite</span>
                            </FormLabel>
                            <p className="font-body text-xs text-muted-foreground">
                              Secretárias(os) só podem ser cadastradas(os) com convite da clínica (email ou código).
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {isSecretaryInviteRegistration && (
                      <>
                        <FormField
                          control={registerForm.control}
                          name="clinicInvitationCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-heading font-bold text-foreground">Código do Convite</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: A1B2C3D4E5"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  autoComplete="off"
                                  className="h-11 uppercase tracking-wider"
                                  maxLength={10}
                                />
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />

                        {prefilledInvitationToken ? (
                          <div className="rounded-xl border border-border bg-muted/35 p-3">
                            <p className="font-body text-xs text-muted-foreground">
                              Convite detectado por link. Você também pode concluir o cadastro usando apenas o código acima.
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}

                    <FormField
                      control={registerForm.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <FormItem className="mt-2 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-sm text-muted-foreground">
                              Li e aceito os{" "}
                              <Link href="/termos" target="_blank" className="font-semibold text-foreground underline hover:text-foreground/80">
                                Termos de Uso
                              </Link>{" "}
                              e a{" "}
                              <Link href="/privacidade" target="_blank" className="font-semibold text-foreground underline hover:text-foreground/80">
                                Política de Privacidade
                              </Link>
                            </FormLabel>
                            <FormMessage className="text-destructive" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="acceptedHealthData"
                      render={({ field }) => (
                        <FormItem className="mt-2 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-sm text-muted-foreground">
                              Concordo com o <span className="font-bold text-foreground">processamento de meus dados de saúde</span> para fins de análise clínica e uso de Inteligência Artificial, conforme descrito na Política de Privacidade.
                            </FormLabel>
                            <FormMessage className="text-destructive" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="mt-2 h-12 w-full rounded-xl bg-primary font-heading font-bold text-primary-foreground hover:bg-primary/90"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <BrandLoader className="mr-2 h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="font-body text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Button
                      variant="link"
                      type="button"
                      className="p-0 font-heading font-bold text-foreground hover:text-foreground/80"
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

        <div className="mt-8 text-center font-body text-sm text-muted-foreground">
          <p>&copy; 2025 VitaView AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
