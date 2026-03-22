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
import { isNativeIOSApp, isRestrictedAppShell } from "@/lib/app-shell";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

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
  const isNativeIOSShell = isNativeIOSApp();
  const isDarkMode = theme === "dark";
  const hasCompactMobileHeader = hideLandingBackButton || isNativeIOSShell;
  const loginAutocomplete = isNativeIOSShell ? "off" : "on";
  const loginEmailAutocomplete = isNativeIOSShell ? "off" : "username";
  const loginPasswordAutocomplete = isNativeIOSShell ? "off" : "current-password";

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
    if (isNativeIOSShell || !input) {
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
  }, [isNativeIOSShell, loginForm]);

  const syncLoginFormFromDom = useCallback(() => {
    if (isNativeIOSShell) {
      return;
    }

    syncLoginFieldFromDom("email", loginEmailInputRef.current);
    syncLoginFieldFromDom("password", loginPasswordInputRef.current);
  }, [isNativeIOSShell, syncLoginFieldFromDom]);

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
    if (isNativeIOSShell || tab !== "login" || typeof window === "undefined") {
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
  }, [isNativeIOSShell, syncLoginFormFromDom, tab]);

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
      if (!isNativeIOSShell && loginForm.getFieldState("email").error) {
        loginEmailInputRef.current?.focus();
      } else if (!isNativeIOSShell && loginForm.getFieldState("password").error) {
        loginPasswordInputRef.current?.focus();
      }
      return;
    }

    onLoginSubmit(loginForm.getValues());
  }, [isNativeIOSShell, loginForm, onLoginSubmit, syncLoginFormFromDom]);

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
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="h-9 w-9 rounded-full border border-transparent bg-background/30 p-0 text-muted-foreground opacity-75 shadow-none backdrop-blur-[2px] hover:border-border/50 hover:bg-background/55 hover:text-foreground hover:opacity-100"
          onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          aria-pressed={isDarkMode}
          title={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -12, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </Button>
      </div>

      {/* Main Content - Centered Form */}
      <div
        className={cn(
          "relative z-10 flex min-h-[100svh] w-full flex-col items-center px-4 pb-8 sm:min-h-screen sm:justify-center sm:py-12",
          hasCompactMobileHeader ? "justify-start pt-8" : "justify-start pt-16",
        )}
      >
        <div className="mb-0.5 flex w-full max-w-md flex-col items-center sm:mb-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-1 flex items-center gap-3 sm:mb-2"
          >
            <div className="my-0.5 flex w-full justify-center sm:my-1">
              <Logo
                size="lg"
                showText={false}
                variant="full"
                className="flex-col items-center"
              />
            </div>
          </motion.div>
        </div>

        <Card className="relative mt-1 w-full max-w-md overflow-hidden rounded-[24px] border-border/80 bg-card/95 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:mt-3 sm:rounded-[28px]">
          {/* Banner de branding no topo do card */}
          <div className="bg-primary px-4 py-2.5 text-center text-primary-foreground sm:py-3">
            <span className="font-heading text-[11px] font-bold tracking-[0.08em] sm:text-sm sm:tracking-wide">
              O Prontuário que Pensa com Você
            </span>
          </div>

          <CardHeader className="pb-3 pt-5 text-center sm:pb-4 sm:pt-8">
            <CardTitle className="flex items-center justify-center gap-2 font-heading text-[1.75rem] font-bold leading-tight text-foreground sm:text-2xl">
              <span>Acesse sua conta</span>
            </CardTitle>
            <CardDescription className="mt-1 text-center font-body text-sm text-muted-foreground sm:mt-2">
              Bem-vindo ao VitaView AI
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
            <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as "login" | "register")}>
              <TabsList className="mb-5 grid h-10 w-full grid-cols-2 rounded-xl bg-muted/80 p-1 sm:mb-6">
                <TabsTrigger
                  value="login"
                  className="rounded-lg font-heading text-[13px] font-bold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg font-heading text-[13px] font-bold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={handleLoginSubmit} autoComplete={loginAutocomplete} noValidate className="space-y-4 sm:space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Email</FormLabel>
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
                              autoComplete={loginEmailAutocomplete}
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              inputMode="email"
                              enterKeyHint="next"
                              className="h-10 rounded-xl px-3.5"
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
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Senha</FormLabel>
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
                              autoComplete={loginPasswordAutocomplete}
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              enterKeyHint="go"
                              className="h-10 rounded-xl px-3.5"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="px-0 font-body text-[13px] text-foreground hover:text-foreground/80 hover:underline sm:text-sm">
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
                      className="h-11 w-full rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 sm:h-12 sm:text-lg"
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

                <div className="mt-5 text-center sm:mt-6">
                  <p className="font-body text-[13px] text-muted-foreground sm:text-sm">
                    Não tem uma conta?{" "}
                    <Button
                      variant="link"
                      type="button"
                      className="h-auto p-0 font-heading font-bold text-foreground hover:text-foreground/80"
                      onClick={() => setTab("register")}
                    >
                      Cadastre-se
                    </Button>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5 sm:space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Nome Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite seu nome completo"
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              autoComplete="name"
                              className="h-10 rounded-xl px-3.5"
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
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Email</FormLabel>
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
                              className="h-10 rounded-xl px-3.5"
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
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Crie uma senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-10 rounded-xl px-3.5"
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
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Confirme a Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirme sua senha"
                              {...field}
                              autoComplete="new-password"
                              className="h-10 rounded-xl px-3.5"
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
                        <FormItem className="mt-1 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-3.5 sm:p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-[13px] text-muted-foreground sm:text-sm">
                              Estou me cadastrando como <span className="font-bold text-foreground">secretária(o) por convite</span>
                            </FormLabel>
                            <p className="font-body text-[11px] text-muted-foreground sm:text-xs">
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
                              <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Código do Convite</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: A1B2C3D4E5"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  autoComplete="off"
                                  className="h-10 rounded-xl px-3.5 uppercase tracking-wider"
                                  maxLength={10}
                                />
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />

                        {prefilledInvitationToken ? (
                          <div className="rounded-xl border border-border bg-muted/35 p-3">
                            <p className="font-body text-[11px] text-muted-foreground sm:text-xs">
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
                        <FormItem className="mt-2 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-3.5 sm:p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-[13px] text-muted-foreground sm:text-sm">
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
                        <FormItem className="mt-2 flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-background/40 p-3.5 sm:p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-body text-[13px] text-muted-foreground sm:text-sm">
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
                      className="mt-2 h-11 w-full rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground hover:bg-primary/90 sm:h-12"
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

                <div className="mt-5 text-center sm:mt-6">
                  <p className="font-body text-[13px] text-muted-foreground sm:text-sm">
                    Já tem uma conta?{" "}
                    <Button
                      variant="link"
                      type="button"
                      className="h-auto p-0 font-heading font-bold text-foreground hover:text-foreground/80"
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

        <div className="mt-5 text-center font-body text-xs text-muted-foreground sm:mt-8 sm:text-sm">
          <p>&copy; 2025 VitaView AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
