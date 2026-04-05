import {
    useState,
    useRef,
    useEffect,
    useCallback
} from "react";
import {
    useQuery,
    useMutation,
    useQueryClient
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    MessageSquare,
    Plus,
    Trash2,
    User,
    Bot,
    Sparkles,
    History,
    PanelLeft,
    ArrowUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { useLocation } from "wouter";
import { ApiError, apiRequest } from "@/lib/queryClient";
import { BrandLoader } from "@/components/ui/brand-loader";
import PatientHeader from "@/components/patient-header";
import { useProfiles } from "@/hooks/use-profiles";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIMessage {
    id: number;
    conversationId: number;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

interface AIConversation {
    id: number;
    userId: number;
    profileId: number | null;
    title: string | null;
    createdAt: string;
    updatedAt: string;
    messages?: AIMessage[];
}

interface OptimisticMessage {
    id: string;
    role: "user";
    content: string;
    createdAt: string;
    conversationId: number | null;
    pending: true;
}

interface LocalAssistantMessage {
    id: string;
    role: "assistant";
    content: string;
    createdAt: string;
    conversationId: number | null;
    local: true;
}

export default function VitaAssistPage() {
    const queryClient = useQueryClient();
    const { profiles, activeProfile } = useProfiles();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    const isMobile = useIsMobile();
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
    const [localAssistantMessages, setLocalAssistantMessages] = useState<LocalAssistantMessage[]>([]);
    const authRedirectedRef = useRef(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleVitaAssistError = useCallback((error: unknown, options?: {
        title?: string;
        fallbackDescription?: string;
    }) => {
        const title = options?.title || "Falha no Vita Assist";
        const fallbackDescription = options?.fallbackDescription || "Tente novamente em instantes.";

        if (error instanceof ApiError) {
            if (error.status === 401) {
                toast({
                    title: "Sessão expirada",
                    description: "Faça login novamente para continuar usando o Vita Assist.",
                    variant: "destructive",
                });

                if (!authRedirectedRef.current) {
                    authRedirectedRef.current = true;
                    navigate(`/auth?next=${encodeURIComponent("/vita-assist")}`);
                }
                return;
            }

            if (error.status === 503) {
                toast({
                    title: "Vita Assist indisponível",
                    description: error.message || "O serviço de IA está temporariamente indisponível.",
                    variant: "destructive",
                });
                return;
            }

            if (error.status === 429) {
                toast({
                    title: "Cota da IA esgotada",
                    description: error.message || "A conta OpenAI configurada para o Vita Assist está sem cota disponível.",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title,
                description: error.message || fallbackDescription,
                variant: "destructive",
            });
            return;
        }

        toast({
            title,
            description: error instanceof Error ? error.message : fallbackDescription,
            variant: "destructive",
        });
    }, [navigate, toast]);

    // Fetch conversations
    const { data: conversations = [], isLoading: loadingConversations, error: conversationsError } = useQuery<AIConversation[], Error>({
        queryKey: ["/api/vita-assist/conversations"],
        retry: false,
    });

    // Fetch current conversation with messages
    const { data: currentConversation, isLoading: loadingConversation, error: currentConversationError } = useQuery<AIConversation | null, Error>({
        queryKey: ["/api/vita-assist/conversations", selectedConversationId],
        queryFn: async () => {
            if (!selectedConversationId) return null;
            const res = await apiRequest("GET", `/api/vita-assist/conversations/${selectedConversationId}`, undefined, 0);
            return res.json();
        },
        enabled: !!selectedConversationId,
        retry: false,
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({
            message,
            conversationId,
            profileId,
        }: {
            message: string;
            conversationId: number | null;
            profileId: number | null;
            optimisticId: string;
        }) => {
            const res = await apiRequest("POST", "/api/vita-assist/chat", {
                message,
                conversationId,
                profileId,
            }, 0);
            return res.json();
        },
        onSuccess: (data, variables) => {
            setOptimisticMessages((current) => current.filter((message) => message.id !== variables.optimisticId));
            setLocalAssistantMessages((current) =>
                current.filter((message) => message.conversationId !== (selectedConversationId || data.conversationId))
            );
            if (!selectedConversationId && data.conversationId) {
                setSelectedConversationId(data.conversationId);
            }
            queryClient.invalidateQueries({ queryKey: ["/api/vita-assist/conversations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vita-assist/conversations", selectedConversationId || data.conversationId] });
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
            });
        },
        onError: (error, variables) => {
            setOptimisticMessages((current) => current.filter((message) => message.id !== variables.optimisticId));
            setInputMessage(variables.message);
            const fallbackMessage =
                error instanceof ApiError && error.status === 429
                    ? "A conta OpenAI configurada para o Vita Assist está sem cota disponível no momento. Verifique billing e limites da API para voltar a gerar respostas clínicas."
                    : error instanceof ApiError
                      ? error.message || "Não foi possível gerar a resposta clínica agora. Tente novamente em instantes."
                      : error instanceof Error
                        ? error.message
                        : "Não foi possível gerar a resposta clínica agora. Tente novamente em instantes.";

            setLocalAssistantMessages((current) => [
                ...current.filter((message) => message.conversationId !== variables.conversationId),
                {
                    id: `local-assistant-${Date.now()}`,
                    role: "assistant",
                    content: fallbackMessage,
                    createdAt: new Date().toISOString(),
                    conversationId: variables.conversationId,
                    local: true,
                },
            ]);
            handleVitaAssistError(error, {
                title: "Falha ao enviar mensagem",
                fallbackDescription: "Tente novamente em instantes.",
            });
        },
    });

    // Delete conversation mutation
    const deleteConversationMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/vita-assist/conversations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vita-assist/conversations"] });
            if (selectedConversationId) {
                setSelectedConversationId(null);
            }
        },
    });

    // Scroll to bottom when messages change
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
        });
    }, [currentConversation?.messages, optimisticMessages]);

    // Keep Vita Assist aligned with the globally selected patient.
    useEffect(() => {
        setSelectedProfileId(activeProfile?.id ?? null);
    }, [activeProfile?.id]);

    const resizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "0px";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }, []);

    useEffect(() => {
        resizeTextarea();
    }, [inputMessage, resizeTextarea]);

    useEffect(() => {
        if (!conversationsError) return;

        handleVitaAssistError(conversationsError, {
            title: "Falha ao carregar histórico",
            fallbackDescription: "Não foi possível carregar as conversas do Vita Assist.",
        });
    }, [conversationsError, handleVitaAssistError]);

    useEffect(() => {
        if (!currentConversationError) return;

        handleVitaAssistError(currentConversationError, {
            title: "Falha ao carregar conversa",
            fallbackDescription: "Não foi possível abrir esta conversa.",
        });
    }, [currentConversationError, handleVitaAssistError]);

    const handleSendMessage = useCallback(() => {
        const trimmedMessage = inputMessage.trim();
        if (!trimmedMessage || sendMessageMutation.isPending) return;

        const optimisticId = `optimistic-${Date.now()}`;
        const nextConversationId = selectedConversationId;

        setOptimisticMessages((current) => [
            ...current,
            {
                id: optimisticId,
                role: "user",
                content: trimmedMessage,
                createdAt: new Date().toISOString(),
                conversationId: nextConversationId,
                pending: true,
            },
        ]);
        setInputMessage("");
        sendMessageMutation.mutate({
            message: trimmedMessage,
            conversationId: nextConversationId,
            profileId: selectedProfileId,
            optimisticId,
        });
    }, [inputMessage, selectedConversationId, selectedProfileId, sendMessageMutation]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const startNewConversation = () => {
        setSelectedConversationId(null);
        setInputMessage("");
        setSelectedProfileId(activeProfile?.id ?? null);
        setOptimisticMessages([]);
        setLocalAssistantMessages([]);
        setShowHistory(false);
    };

    const selectConversation = (id: number) => {
        setSelectedConversationId(id);
        const conversation = conversations.find((item) => item.id === id);
        setSelectedProfileId(conversation?.profileId ?? activeProfile?.id ?? null);
        setShowHistory(false);
    };

    const visibleOptimisticMessages = optimisticMessages.filter(
        (message) => message.conversationId === selectedConversationId
    );

    const visibleLocalAssistantMessages = localAssistantMessages.filter(
        (message) => message.conversationId === selectedConversationId
    );

    const displayedMessages = [
        ...(currentConversation?.messages ?? []),
        ...visibleOptimisticMessages,
        ...visibleLocalAssistantMessages,
    ];

    const HistoryList = (
        <div className="flex h-full flex-col">
            <div className="border-b border-border px-4 py-4 md:px-5">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-foreground">
                        <History className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Conversas
                        </p>
                        <h3 className="font-heading text-base font-bold text-foreground">Histórico clínico</h3>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-2 p-3 md:p-4">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-8">
                            <BrandLoader className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Nenhuma conversa ainda
                        </p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={cn(
                                    "group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all duration-200",
                                    selectedConversationId === conv.id
                                        ? "border-primary/25 bg-primary/8 shadow-sm"
                                        : "border-transparent bg-background hover:border-border hover:bg-muted/45"
                                )}
                                onClick={() => selectConversation(conv.id)}
                            >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {conv.title || "Nova conversa"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(conv.updatedAt), "dd MMM", { locale: ptBR })}
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. Todas as mensagens serão perdidas.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => deleteConversationMutation.mutate(conv.id)}
                                                className="bg-red-600 text-white hover:bg-red-700"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-muted/20 via-background to-background">
            <PatientHeader
                title="Vita Assist"
                description={isMobile ? undefined : "IA para raciocínio clínico, conduta e interpretação de contexto do atendimento."}
                showTitleAsMain={true}
                fullWidth={true}
                compact={true}
                icon={<Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />}
            >
                <div className="flex w-full flex-col gap-1.5 sm:gap-2.5 md:w-auto md:min-w-[340px] md:items-stretch lg:min-w-[420px] lg:items-end">
                    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:flex-wrap sm:items-center md:justify-start lg:justify-end">
                        <Button
                            variant={showHistory ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                            className="h-9 w-full justify-center gap-1.5 rounded-xl border-border/80 bg-background/80 px-2.5 text-xs hover:bg-muted/60 sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-3 sm:text-sm sm:w-auto"
                        >
                            {isMobile ? <PanelLeft className="h-3.5 w-3.5" /> : <History className="h-4 w-4" />}
                            <span>Histórico</span>
                        </Button>

                        <Select
                            value={selectedProfileId?.toString() || "none"}
                            onValueChange={(value) => setSelectedProfileId(value === "none" ? null : parseInt(value))}
                        >
                            <SelectTrigger className="h-9 w-full rounded-xl border-border/70 bg-background text-xs shadow-sm sm:h-11 sm:rounded-2xl sm:text-sm sm:max-w-[320px]">
                                <SelectValue placeholder="Paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sem contexto</SelectItem>
                                {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id.toString()}>
                                        {profile.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={startNewConversation}
                            size="sm"
                            className="h-9 w-full justify-center gap-1.5 rounded-xl bg-[#1E3A5F] px-2.5 text-xs text-white shadow-sm hover:bg-[#2A4F7C] sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-3 sm:text-sm sm:w-auto"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Nova</span>
                        </Button>
                    </div>
                </div>
            </PatientHeader>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {!isMobile && showHistory && (
                    <aside className="flex w-72 flex-col border-r border-border bg-card/80 backdrop-blur-sm xl:w-80">
                        {HistoryList}
                    </aside>
                )}

                {isMobile && (
                    <Sheet open={showHistory} onOpenChange={setShowHistory}>
                        <SheetContent side="left" className="w-[88vw] max-w-[360px] border-border bg-background p-0">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Histórico de conversas</SheetTitle>
                                <SheetDescription>Selecione uma conversa anterior do Vita Assist.</SheetDescription>
                            </SheetHeader>
                            {HistoryList}
                        </SheetContent>
                    </Sheet>
                )}

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto overscroll-contain"
                    >
                        {!selectedConversationId && displayedMessages.length === 0 ? (
                            <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 py-4 text-center sm:py-10 md:px-6">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E3A5F] shadow-lg shadow-[#1E3A5F]/15 sm:mb-5 sm:h-20 sm:w-20 sm:rounded-[28px]">
                                    <Sparkles className="h-5 w-5 text-white sm:h-10 sm:w-10" />
                                </div>
                                <h2 className="mb-4 text-lg font-heading font-bold tracking-tight text-foreground sm:mb-8 sm:text-3xl">
                                    Como posso ajudar?
                                </h2>
                                <div className="grid w-full max-w-3xl gap-2 px-1 sm:gap-3 sm:px-2 md:grid-cols-2 xl:grid-cols-3">
                                    {[
                                        "Diretrizes atuais para hipertensão",
                                        "Investigação de anemia ferropriva",
                                        "Diagnóstico diferencial de dor torácica",
                                    ].map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            className="h-auto min-h-0 justify-start whitespace-normal rounded-xl border-border/70 bg-background px-3 py-2.5 text-left text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/40 hover:shadow-md sm:min-h-[96px] sm:rounded-2xl sm:px-4 sm:py-4"
                                            onClick={() => {
                                                setInputMessage(suggestion);
                                                textareaRef.current?.focus();
                                            }}
                                        >
                                            <MessageSquare className="mr-2 mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#448C9B] sm:h-4 sm:w-4" />
                                            <span className="text-left text-xs leading-4 text-foreground sm:text-sm sm:leading-6">
                                                {suggestion}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : loadingConversation ? (
                            <div className="flex h-full items-center justify-center">
                                <BrandLoader className="h-8 w-8 animate-spin text-[#448C9B]" />
                            </div>
                        ) : (
                            <div className="mx-auto max-w-5xl space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6 md:px-6">
                                {displayedMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 sm:gap-3",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1E3A5F] shadow-sm sm:h-9 sm:w-9">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[90%] rounded-[22px] px-3.5 py-3 shadow-sm sm:max-w-[84%] sm:rounded-[24px] sm:px-4 md:max-w-[80%]",
                                                message.role === "user"
                                                    ? "bg-[#1E3A5F] text-white"
                                                    : "border border-border/70 bg-card text-foreground"
                                            )}
                                        >
                                            {message.role === "assistant" ? (
                                                <div className="prose prose-sm max-w-none overflow-hidden prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:bg-muted prose-a:text-primary dark:prose-invert">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                                            )}
                                            <div className="mt-2 flex items-center gap-2">
                                                <p
                                                    className={cn(
                                                        "text-xs",
                                                        message.role === "user" ? "text-white/70" : "text-muted-foreground"
                                                    )}
                                                >
                                                {format(new Date(message.createdAt), "HH:mm", { locale: ptBR })}
                                                </p>
                                                {"pending" in message && message.pending && (
                                                    <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                                                        Enviando
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {message.role === "user" && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-muted sm:h-9 sm:w-9">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {sendMessageMutation.isPending && (
                                    <div className="flex justify-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 sm:gap-3">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1E3A5F] sm:h-9 sm:w-9">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="rounded-[24px] border border-border/70 bg-card px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <BrandLoader className="h-4 w-4 animate-spin text-[#448C9B]" />
                                                <span className="text-sm text-muted-foreground">Construindo resposta clínica...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 border-t border-border bg-card/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 supports-[backdrop-filter]:backdrop-blur-xl sm:px-4 sm:pt-4 md:px-6 md:pb-4">
                        <div className="mx-auto max-w-5xl">
                            <div className="rounded-xl border border-border/70 bg-background p-2 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] sm:rounded-[28px] sm:p-3">
                                <div className="flex items-end gap-2">
                                    <Textarea
                                        ref={textareaRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Pergunte ao Vita Assist..."
                                        className="min-h-[40px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 sm:min-h-[56px] sm:py-3 sm:text-base"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                        className="mb-0.5 h-9 rounded-xl bg-[#1E3A5F] px-3 hover:bg-[#2A4F7C] sm:mb-1 sm:h-12 sm:rounded-2xl sm:px-4"
                                    >
                                        {sendMessageMutation.isPending ? (
                                            <BrandLoader className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <ArrowUp className="h-4 w-4" />
                                                <span className="hidden sm:inline">Enviar</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <p className="mt-2 text-center text-[10px] leading-tight text-muted-foreground sm:mt-3 sm:text-xs">
                            Ferramenta de apoio. Decisões clínicas são responsabilidade do profissional.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
