import { type FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Calculator, CheckCircle2, Clock3, FileText, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

type OfferVariant = "trial" | "checklist" | "modelo" | "calculadora";

type OfferConfig = {
  variant: OfferVariant;
  slug: string;
  lpId: string;
  offer: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  eventName: "sign_up" | "generate_lead";
  sourceDetail: string;
  defaultCampaign: string;
  routeToSales: boolean;
  intent: string;
  redirectTo?: string;
  trustPoints: string[];
  featureCards: Array<{ title: string; description: string }>;
  checklistPreview?: string[];
  modelPreview?: Array<{ title: string; body: string }>;
};

type LeadState = {
  name: string;
  email: string;
  phone: string;
  crm: string;
  specialty: string;
};

const OFFER_CONFIGS: Record<OfferVariant, OfferConfig> = {
  trial: {
    variant: "trial",
    slug: "/trial-vita-assist",
    lpId: "LP-2026-04-01",
    offer: "trial",
    badge: "7 dias gratis, sem cartao",
    title: "Veja o Vita Assist escrever o prontuario enquanto voce atende.",
    description:
      "Teste a rotina completa da VitaView por 7 dias. Grave a consulta, revise em segundos e corte o retrabalho antes que ele vire hora extra invisivel.",
    cta: "Testar gratis por 7 dias",
    eventName: "sign_up",
    sourceDetail: "trial principal",
    defaultCampaign: "leadgen_meta",
    routeToSales: true,
    intent: "trial",
    redirectTo: "https://vitaview.ai/auth",
    trustPoints: [
      "Fluxo orientado para medicos e clinicas",
      "Prescricao, anamnese e agenda no mesmo ambiente",
      "LGPD, historico e contexto do paciente no mesmo lugar",
    ],
    featureCards: [
      {
        title: "Consulta em foco",
        description: "Enquanto voce conversa com o paciente, o Vita Assist organiza os pontos clinicos em estrutura de prontuario.",
      },
      {
        title: "Revisao curta",
        description: "A proposta nao e remover seu criterio. E encurtar o trecho repetitivo para sobrar tempo na decisao clinica.",
      },
      {
        title: "Primeiro valor rapido",
        description: "O trial foi desenhado para voce sentir ganho ja na primeira consulta, nao so depois de configurar a plataforma inteira.",
      },
    ],
  },
  checklist: {
    variant: "checklist",
    slug: "/checklist-prontuario-5-min",
    lpId: "LP-2026-04-02",
    offer: "checklist",
    badge: "material de captura",
    title: "Checklist para fechar um prontuario completo em menos tempo.",
    description:
      "Uma estrutura simples para reduzir esquecimentos, acelerar a revisao e deixar o registro clinico mais consistente mesmo em dias puxados.",
    cta: "Liberar checklist agora",
    eventName: "generate_lead",
    sourceDetail: "checklist principal",
    defaultCampaign: "seo_consultorio",
    routeToSales: false,
    intent: "lead-magnet",
    trustPoints: [
      "Pensado para medicos em rotina real, nao para auditoria de escritorio",
      "Pode ser aplicado no papel, em prontuario digital ou com IA",
      "Funciona como ponte natural para testar o Vita Assist depois",
    ],
    featureCards: [
      {
        title: "Campos que travam menos",
        description: "Prioriza o que realmente nao pode ficar de fora e corta excesso de preenchimento que so cria atrito.",
      },
      {
        title: "Uso rapido em celular",
        description: "O checklist cabe em uma consulta corrida e funciona como referencia de bolso para a rotina do consultorio.",
      },
      {
        title: "Pronto para treinar equipe",
        description: "Ajuda a alinhar secretario, medico e fluxo de atendimento em torno do mesmo padrao minimo.",
      },
    ],
    checklistPreview: [
      "Queixa principal clara e sem ambiguidade",
      "Historia da doenca atual em ordem temporal",
      "Medicacoes, alergias e red flags confirmados",
      "Conduta, orientacoes e retorno registrados antes de encerrar",
      "Checklist final de prescricoes, exames e anexos",
    ],
  },
  modelo: {
    variant: "modelo",
    slug: "/modelo-prontuario-com-ia",
    lpId: "LP-2026-04-03",
    offer: "modelo",
    badge: "comparativo pronto",
    title: "Veja como um prontuario fica quando o Vita Assist entra no fluxo.",
    description:
      "Um modelo-base para comparar registro manual vs. estrutura assistida por IA, com foco em clareza, velocidade e continuidade do caso.",
    cta: "Ver o modelo agora",
    eventName: "generate_lead",
    sourceDetail: "modelo principal",
    defaultCampaign: "seo_modelo",
    routeToSales: false,
    intent: "lead-magnet",
    trustPoints: [
      "Modelo focado em consulta real, nao em texto generico",
      "Mostra a passagem de fala para estrutura clinica",
      "Ajuda a visualizar o ganho antes de abrir trial",
    ],
    featureCards: [
      {
        title: "Estrutura legivel",
        description: "Separacao limpa entre queixa, HDA, exame, hipotese e conduta para reduzir retrabalho na revisao posterior.",
      },
      {
        title: "Comparacao direta",
        description: "Facilita enxergar onde a digitacao manual consome tempo e onde a IA pode entrar sem perder controle clinico.",
      },
      {
        title: "Material para equipe",
        description: "Serve como referencia para padronizar a escrita clinica antes mesmo de expandir o uso da ferramenta.",
      },
    ],
    modelPreview: [
      {
        title: "Queixa principal",
        body: "Paciente refere cefaleia frontal ha 3 dias, piora ao final do expediente e melhora parcial com analgesico comum.",
      },
      {
        title: "Historia da doenca atual",
        body: "Relata aumento recente de plantao, reducao de sono e maior sensibilidade a luz. Nega febre, rigidez de nuca e trauma.",
      },
      {
        title: "Conduta",
        body: "Orientada hidratacao, ajuste de rotina, analgesia de resgate, diario de sintomas e retorno em 7 dias ou antes em caso de piora.",
      },
    ],
  },
  calculadora: {
    variant: "calculadora",
    slug: "/calculadora-tempo-prontuario",
    lpId: "LP-2026-04-04",
    offer: "calculadora",
    badge: "diagnostico de rotina",
    title: "Descubra quanto tempo o prontuario consome da sua semana.",
    description:
      "Informe seu volume medio de consultas e o tempo gasto por registro. A conta mostra a carga oculta que vai embora em prontuario, nao em cuidado.",
    cta: "Receber meu resultado",
    eventName: "generate_lead",
    sourceDetail: "calculadora principal",
    defaultCampaign: "meta_tempo_perdido",
    routeToSales: false,
    intent: "lead-magnet",
    trustPoints: [
      "Conta simples, sem dependencia de planilha",
      "Ajuda a quantificar dor de rotina antes de trocar de sistema",
      "Cria o argumento certo para testar automatizacao com critico",
    ],
    featureCards: [
      {
        title: "Dor quantificada",
        description: "Em vez de impressao vaga, voce sai com uma estimativa objetiva de horas gastas por semana e por ano.",
      },
      {
        title: "Serve para decidir",
        description: "A conta ajuda a avaliar se seu gargalo esta em digitacao, revisao, busca de historico ou interrupcoes entre consultas.",
      },
      {
        title: "Ponto de partida",
        description: "Depois do calculo, a transicao para trial fica concreta: voce sabe exatamente o que quer recuperar de tempo.",
      },
    ],
  },
};

function currentVariant(pathname: string): OfferVariant {
  if (pathname.includes("checklist-prontuario-5-min")) return "checklist";
  if (pathname.includes("modelo-prontuario-com-ia")) return "modelo";
  if (pathname.includes("calculadora-tempo-prontuario")) return "calculadora";
  return "trial";
}

function trackMarketingEvent(
  eventName: string,
  params: Record<string, string | number>,
  afterTrack?: () => void,
) {
  const gtag = typeof window !== "undefined" ? (window as Window & { gtag?: (...args: any[]) => void }).gtag : undefined;

  if (!gtag) {
    afterTrack?.();
    return;
  }

  let settled = false;
  const safeAfter = () => {
    if (settled) return;
    settled = true;
    afterTrack?.();
  };

  gtag("event", eventName, {
    ...params,
    event_timeout: 1200,
    event_callback: safeAfter,
  });

  window.setTimeout(safeAfter, 500);
}

function setMetaTag(selector: string, attribute: "content" | "href", value: string) {
  const tag = document.querySelector(selector);
  if (tag) {
    tag.setAttribute(attribute, value);
  }
}

function useLandingMeta(config: OfferConfig) {
  useEffect(() => {
    const title = `${config.title} | VitaView AI`;
    const canonical = `https://vitaview.ai${config.slug}`;

    document.title = title;
    setMetaTag('meta[name="description"]', "content", config.description);
    setMetaTag('meta[property="og:title"]', "content", title);
    setMetaTag('meta[property="og:description"]', "content", config.description);
    setMetaTag('meta[property="og:url"]', "content", canonical);
    setMetaTag('meta[name="twitter:title"]', "content", title);
    setMetaTag('meta[name="twitter:description"]', "content", config.description);
    setMetaTag('link[rel="canonical"]', "href", canonical);
  }, [config]);
}

function buildPayload(
  config: OfferConfig,
  lead: LeadState,
  search: string,
  calculatorData?: {
    consultationsPerDay: number;
    minutesPerProntuario: number;
    hoursPerWeek: number;
    hoursPerYear: number;
  },
) {
  const params = new URLSearchParams(search);

  return {
    name: lead.name.trim(),
    email: lead.email.trim(),
    phone: lead.phone.trim(),
    crm: lead.crm.trim(),
    specialty: lead.specialty.trim(),
    lp_id: config.lpId,
    offer: config.offer,
    source: "Landing Page",
    source_detail: config.sourceDetail,
    utm_campaign: params.get("utm_campaign") || config.defaultCampaign,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
    route_to_sales: String(config.routeToSales),
    intent: config.intent,
    redirect_to: config.redirectTo || "",
    response_mode: "json",
    consultations_per_day: calculatorData ? String(calculatorData.consultationsPerDay) : "",
    minutes_per_prontuario: calculatorData ? String(calculatorData.minutesPerProntuario) : "",
    hours_per_week: calculatorData ? calculatorData.hoursPerWeek.toFixed(1) : "",
    hours_per_year: calculatorData ? calculatorData.hoursPerYear.toFixed(1) : "",
  };
}

function formatHours(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function OfferSuccessContent({ config }: { config: OfferConfig }) {
  if (config.variant === "checklist" && config.checklistPreview) {
    return (
      <div className="space-y-4 rounded-[28px] border border-[#d8dee5] bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <h3 className="font-heading text-2xl font-bold text-slate-900">Checklist liberado</h3>
        <p className="text-sm leading-6 text-slate-600">
          Use esta estrutura como referencia rapida no consultorio e compare depois com o fluxo assistido da VitaView.
        </p>
        <ul className="space-y-3">
          {config.checklistPreview.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (config.variant === "modelo" && config.modelPreview) {
    return (
      <div className="space-y-4 rounded-[28px] border border-[#d8dee5] bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <h3 className="font-heading text-2xl font-bold text-slate-900">Modelo liberado</h3>
        <p className="text-sm leading-6 text-slate-600">
          Abaixo esta a estrutura-base de um prontuario organizado para revisao rapida e continuidade do cuidado.
        </p>
        <div className="space-y-3">
          {config.modelPreview.map((section) => (
            <div key={section.title} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-[#d8dee5] bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <h3 className="font-heading text-2xl font-bold text-slate-900">Pedido registrado</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Seu contato entrou no fluxo da VitaView. Se fizer sentido avancar agora, siga direto para o ambiente de acesso.
      </p>
      <div className="mt-5">
        <Button asChild size="lg">
          <a href="/auth">
            Ir para o acesso
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function MarketingOfferPage() {
  const [location] = useLocation();
  const config = OFFER_CONFIGS[currentVariant(location)];
  useLandingMeta(config);

  const [lead, setLead] = useState<LeadState>({
    name: "",
    email: "",
    phone: "",
    crm: "",
    specialty: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consultationsPerDay, setConsultationsPerDay] = useState("12");
  const [minutesPerProntuario, setMinutesPerProntuario] = useState("8");
  const [calculatorReady, setCalculatorReady] = useState(false);

  const consultationsNumber = Number(consultationsPerDay || 0);
  const minutesNumber = Number(minutesPerProntuario || 0);
  const hoursPerWeek = (consultationsNumber * minutesNumber * 5) / 60;
  const hoursPerYear = hoursPerWeek * 48;

  function updateLead<K extends keyof LeadState>(key: K, value: LeadState[K]) {
    setLead((current) => ({ ...current, [key]: value }));
  }

  function handleCalculator() {
    setCalculatorReady(true);
    trackMarketingEvent("calculator_complete", {
      lp_id: config.lpId,
      offer: config.offer,
      hours_per_week: Number(hoursPerWeek.toFixed(1)),
      hours_per_year: Number(hoursPerYear.toFixed(1)),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = buildPayload(
        config,
        lead,
        window.location.search,
        config.variant === "calculadora"
          ? {
              consultationsPerDay: consultationsNumber,
              minutesPerProntuario: minutesNumber,
              hoursPerWeek,
              hoursPerYear,
            }
          : undefined,
      );

      const response = await fetch("/api/intake/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Falha ao registrar lead");
      }

      trackMarketingEvent(config.eventName, {
        lp_id: config.lpId,
        offer: config.offer,
      }, () => {
        if (config.redirectTo) {
          window.location.assign(config.redirectTo!);
        }
      });

      if (!config.redirectTo) {
        setSubmitted(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao registrar lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-slate-900">
      <header className="border-b border-black/5 bg-[#f4f2ed]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" aria-label="VitaView AI">
            <Logo variant="full" size="md" showText={false} />
          </a>
          <div className="hidden items-center gap-3 md:flex">
            <a href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
              Voltar para o site
            </a>
            <Button asChild variant="outline">
              <a href="/auth">Entrar</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(68,140,155,0.18),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.12),_transparent_32%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-[#448c9b]" />
                {config.badge}
              </div>
              <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold leading-[1.02] text-slate-950 md:text-6xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {config.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {config.trustPoints.map((point) => (
                  <div key={point} className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                    <p className="text-sm leading-6 text-slate-700">{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-[#111827] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                    <Clock3 className="h-4 w-4" />
                    Rotina
                  </div>
                  <p className="mt-3 text-2xl font-bold">30s</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Tempo de revisao que a comunicacao da marca usa como referencia de valor.</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#448c9b]" />
                    Fluxo
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-950">1 LP</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Uma pagina, uma oferta, um CTA canonico, exatamente como o marketing ops foi desenhado.</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <HeartPulse className="h-4 w-4 text-[#448c9b]" />
                    Público
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-950">Medicos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Mensagem centrada em ganho de tempo, qualidade do prontuario e continuidade do atendimento.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] md:p-8">
              {submitted && !config.redirectTo ? (
                <OfferSuccessContent config={config} />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#e7f3f5] p-3 text-[#448c9b]">
                      {config.variant === "calculadora" ? <Calculator className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lead capture</p>
                      <h2 className="font-heading text-2xl font-bold text-slate-950">{config.cta}</h2>
                    </div>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    {config.variant === "calculadora" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Consultas por dia</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                            inputMode="numeric"
                            min="1"
                            value={consultationsPerDay}
                            onChange={(event) => setConsultationsPerDay(event.target.value)}
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Minutos por prontuario</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                            inputMode="numeric"
                            min="1"
                            value={minutesPerProntuario}
                            onChange={(event) => setMinutesPerProntuario(event.target.value)}
                            required
                          />
                        </label>
                        <div className="sm:col-span-2">
                          <Button className="w-full" type="button" variant="secondary" size="lg" onClick={handleCalculator}>
                            Calcular meu tempo perdido
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {config.variant !== "calculadora" || calculatorReady ? (
                      <>
                        {config.variant === "calculadora" ? (
                          <div className="rounded-3xl bg-slate-950 p-5 text-white">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resultado estimado</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">Horas por semana</p>
                                <p className="mt-2 text-3xl font-bold">{formatHours(hoursPerWeek)}h</p>
                              </div>
                              <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-sm text-slate-300">Horas por ano</p>
                                <p className="mt-2 text-3xl font-bold">{formatHours(hoursPerYear)}h</p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block sm:col-span-2">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Nome</span>
                            <input
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                              value={lead.name}
                              onChange={(event) => updateLead("name", event.target.value)}
                              placeholder="Seu nome"
                              required
                            />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                            <input
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                              type="email"
                              value={lead.email}
                              onChange={(event) => updateLead("email", event.target.value)}
                              placeholder="voce@clinica.com"
                              required
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Telefone</span>
                            <input
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                              value={lead.phone}
                              onChange={(event) => updateLead("phone", event.target.value)}
                              placeholder="Opcional"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Especialidade</span>
                            <input
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                              value={lead.specialty}
                              onChange={(event) => updateLead("specialty", event.target.value)}
                              placeholder="Opcional"
                            />
                          </label>
                          {config.variant === "trial" ? (
                            <label className="block sm:col-span-2">
                              <span className="mb-2 block text-sm font-medium text-slate-700">CRM</span>
                              <input
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-950"
                                value={lead.crm}
                                onChange={(event) => updateLead("crm", event.target.value)}
                                placeholder="Opcional"
                              />
                            </label>
                          ) : null}
                        </div>

                        {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

                        <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
                          {isSubmitting ? "Registrando..." : config.cta}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        Preencha a calculadora acima para liberar o formulario e registrar o resultado no seu fluxo.
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-5 md:grid-cols-3">
            {config.featureCards.map((card) => (
              <article key={card.title} className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Stethoscope className="h-4 w-4 text-[#448c9b]" />
                  VitaView AI
                </div>
                <h3 className="mt-4 font-heading text-2xl font-bold text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
