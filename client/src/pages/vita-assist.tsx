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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    MessageSquare,
    Send,
    Plus,
    Trash2,
    User,
    Bot,
    Sparkles,
    UserCircle,
    History,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { apiRequest } from "@/lib/queryClient";
import { BrandLoader } from "@/components/ui/brand-loader";
import { useProfiles } from "@/hooks/use-profiles";

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

interface Profile {
    id: number;
    name: string;
}

export default function VitaAssistPage() {
    const queryClient = useQueryClient();
    const { profiles, activeProfile } = useProfiles();
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch conversations
    const { data: conversations = [], isLoading: loadingConversations } = useQuery<AIConversation[]>({
        queryKey: ["/api/vita-assist/conversations"],
    });

    // Fetch current conversation with messages
    const { data: currentConversation, isLoading: loadingConversation } = useQuery<AIConversation>({
        queryKey: ["/api/vita-assist/conversations", selectedConversationId],
        queryFn: async () => {
            if (!selectedConversationId) return null;
            const res = await fetch(`/api/vita-assist/conversations/${selectedConversationId}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Erro ao carregar conversa");
            return res.json();
        },
        enabled: !!selectedConversationId,
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await apiRequest("POST", "/api/vita-assist/chat", {
                message,
                conversationId: selectedConversationId,
                profileId: selectedProfileId,
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (!selectedConversationId && data.conversationId) {
                setSelectedConversationId(data.conversationId);
            }
            queryClient.invalidateQueries({ queryKey: ["/api/vita-assist/conversations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vita-assist/conversations", selectedConversationId || data.conversationId] });
            setInputMessage("");
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation?.messages]);

    // Keep Vita Assist aligned with the globally selected patient.
    useEffect(() => {
        setSelectedProfileId(activeProfile?.id ?? null);
    }, [activeProfile?.id]);

    const handleSendMessage = useCallback(() => {
        if (!inputMessage.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(inputMessage);
    }, [inputMessage, sendMessageMutation]);

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
        setShowHistory(false);
    };

    const selectConversation = (id: number) => {
        setSelectedConversationId(id);
        const conversation = conversations.find((item) => item.id === id);
        setSelectedProfileId(conversation?.profileId ?? activeProfile?.id ?? null);
        setShowHistory(false);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 p-4 md:p-6 supports-[backdrop-filter]:backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A5F]">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Vita Assist</h1>
                        <p className="text-xs text-muted-foreground">Consultor Médico de IA</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 sm:flex">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedProfileId?.toString() || "none"}
                            onValueChange={(value) => setSelectedProfileId(value === "none" ? null : parseInt(value))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Contexto do paciente" />
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
                    </div>

                    <Button
                        variant={showHistory ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="gap-2"
                    >
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">Histórico</span>
                    </Button>

                    <Button
                        onClick={startNewConversation}
                        size="sm"
                        className="gap-2 bg-[#1E3A5F] text-white hover:bg-[#2A4F7C]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nova Conversa</span>
                    </Button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {showHistory && (
                    <aside className="flex w-72 flex-col border-r border-border bg-card">
                        <div className="border-b border-border p-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Conversas Anteriores</h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="space-y-1 p-2">
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
                                            className={`group flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors ${
                                                selectedConversationId === conv.id
                                                    ? "border border-primary/20 bg-primary/10"
                                                    : "hover:bg-muted"
                                            }`}
                                            onClick={() => selectConversation(conv.id)}
                                        >
                                            <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
                    </aside>
                )}

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <ScrollArea className="flex-1 p-4">
                        {!selectedConversationId && !currentConversation?.messages?.length ? (
                            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E3A5F]">
                                    <Sparkles className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-foreground">Bem-vindo ao Vita Assist</h2>
                                <p className="mb-8 max-w-lg px-2 text-muted-foreground">
                                    Seu consultor médico de IA. Tire dúvidas sobre diagnósticos, tratamentos e
                                    guidelines médicos com respostas baseadas em evidências.
                                </p>
                                <div className="grid w-full max-w-lg gap-3 px-2">
                                    {[
                                        "Quais são as diretrizes atuais para tratamento de hipertensão?",
                                        "Como investigar anemia ferropriva?",
                                        "Diagnóstico diferencial de dor torácica",
                                    ].map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            className="h-auto justify-start whitespace-normal border-border px-4 py-3 text-left text-foreground hover:border-primary/30 hover:bg-muted"
                                            onClick={() => {
                                                setInputMessage(suggestion);
                                                textareaRef.current?.focus();
                                            }}
                                        >
                                            <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0 text-[#448C9B]" />
                                            <span className="text-left text-sm leading-snug text-foreground">
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
                            <div className="mx-auto max-w-5xl space-y-4 pb-4">
                                {currentConversation?.messages?.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                                message.role === "user"
                                                    ? "bg-[#1E3A5F] text-white"
                                                    : "border border-border bg-card text-foreground shadow-sm"
                                            }`}
                                        >
                                            {message.role === "assistant" ? (
                                                <div className="prose prose-sm max-w-none overflow-hidden prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:bg-muted prose-a:text-primary dark:prose-invert">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                            )}
                                            <p
                                                className={`mt-2 text-xs ${
                                                    message.role === "user" ? "text-white/70" : "text-muted-foreground"
                                                }`}
                                            >
                                                {format(new Date(message.createdAt), "HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                        {message.role === "user" && (
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {sendMessageMutation.isPending && (
                                    <div className="flex justify-start gap-3">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <BrandLoader className="h-4 w-4 animate-spin text-[#448C9B]" />
                                                <span className="text-sm text-muted-foreground">Analisando...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </ScrollArea>

                    <div className="flex-shrink-0 border-t border-border bg-card p-4">
                        <div className="mx-auto flex max-w-5xl gap-2">
                            <Textarea
                                ref={textareaRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Faça uma pergunta médica..."
                                className="max-h-32 min-h-[52px] resize-none"
                                disabled={sendMessageMutation.isPending}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                className="h-[52px] w-[52px] bg-[#1E3A5F] hover:bg-[#2A4F7C]"
                            >
                                {sendMessageMutation.isPending ? (
                                    <BrandLoader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            Vita Assist é uma ferramenta de apoio. Decisões clínicas são responsabilidade do profissional.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
