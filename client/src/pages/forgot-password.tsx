import { useState } from "react";
import { Link } from "wouter";
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
import { ArrowLeft,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandLoader } from "@/components/ui/brand-loader";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao enviar email de recuperação");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar solicitação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F4F4]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-black/[0.05] blur-3xl" />
        <div className="absolute bottom-[-16%] right-[-8%] h-80 w-80 rounded-full bg-black/[0.06] blur-3xl" />
      </div>

      <Link href="/auth" className="absolute top-4 left-4 z-10">
        <Button
          variant="outline"
          className="flex h-10 w-10 items-center justify-center rounded-full border-border/70 bg-background/85 p-0 shadow-sm backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft size={18} />
        </Button>
      </Link>

      <div className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-start px-4 pb-8 pt-16 sm:min-h-screen sm:justify-center sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-2 flex justify-center sm:mb-3">
            <Logo
              size="lg"
              showText={false}
              variant="full"
              className="flex-col items-center"
            />
          </div>

          <Card className="relative overflow-hidden rounded-[24px] border-border/80 bg-card/95 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:rounded-[28px]">
            <div className="bg-primary px-4 py-2.5 text-center text-primary-foreground sm:py-3">
              <span className="font-heading text-[11px] font-bold tracking-[0.08em] sm:text-sm sm:tracking-wide">
                Recuperação de acesso
              </span>
            </div>

            <CardHeader className="pb-3 pt-5 text-center sm:pb-4 sm:pt-8">
              <CardTitle className="flex items-center justify-center gap-2 font-heading text-[1.75rem] font-bold leading-tight text-foreground sm:text-2xl">
                <Mail className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <span>Recuperar senha</span>
              </CardTitle>
              <CardDescription className="mt-1 text-center font-body text-sm text-muted-foreground sm:mt-2">
                {submitted
                  ? "Verifique seu email para continuar"
                  : "Digite seu email para receber as instruções de recuperação"}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
            {!submitted ? (
              <>
                {error && (
                  <Alert variant="destructive" className="mb-4 rounded-xl border-destructive/20 bg-destructive/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-heading text-[13px] font-bold text-foreground sm:text-sm">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Digite seu email"
                              {...field}
                              disabled={isSubmitting}
                              className="h-10 rounded-xl px-3.5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 w-full rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 sm:h-12 sm:text-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <BrandLoader className="mr-2 h-5 w-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar instruções por email"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-5 text-center sm:mt-6">
                  <Link href="/auth">
                    <Button variant="link" className="h-auto p-0 font-heading text-sm font-bold text-foreground hover:text-foreground/80">
                      Voltar para o login
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <Alert className="rounded-xl border-emerald-200 bg-emerald-50">
                  <AlertDescription className="text-green-800">
                    Um email com instruções para redefinir sua senha foi enviado para <strong>{form.getValues("email")}</strong>
                  </AlertDescription>
                </Alert>

                <p className="text-sm text-gray-600">
                  Não recebeu o email? Verifique sua pasta de spam ou{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 font-heading font-bold text-primary"
                    onClick={() => {
                      setSubmitted(false);
                      setError(null);
                    }}
                  >
                    tente novamente
                  </Button>
                </p>

                <Link href="/auth">
                  <Button variant="outline" className="mt-4 h-11 rounded-xl border-border bg-transparent px-6 font-heading font-bold hover:bg-muted/60">
                    Voltar para o login
                  </Button>
                </Link>
              </motion.div>
            )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
