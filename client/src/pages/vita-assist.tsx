import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Loader2,
    Sparkles,
    UserCircle,
    History,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { apiRequest } from "@/lib/queryClient";

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

    // Fetch profiles for context selection
    const { data: profiles = [] } = useQuery<Profile[]>({
        queryKey: ["/api/profiles"],
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
        setShowHistory(false);
    };

    const selectConversation = (id: number) => {
        setSelectedConversationId(id);
        setShowHistory(false);
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <MobileHeader />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                    {/* Page Header */}
                    <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Vita Assist</h1>
                                <p className="text-xs text-gray-500">Consultor Médico de IA</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Patient Context Selector */}
                            <div className="hidden sm:flex items-center gap-2">
                                <UserCircle className="w-4 h-4 text-gray-400" />
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

                            {/* History Toggle */}
                            <Button
                                variant={showHistory ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                                className="gap-2"
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">Histórico</span>
                            </Button>

                            {/* New Chat Button */}
                            <Button
                                onClick={startNewConversation}
                                size="sm"
                                className="bg-[#1E3A5F] hover:bg-[#2A4F7C] text-white gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nova Conversa</span>
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Conversation History Panel */}
                        {showHistory && (
                            <aside className="w-72 border-r bg-white flex flex-col">
                                <div className="p-3 border-b">
                                    <h3 className="font-semibold text-sm text-gray-500">Conversas Anteriores</h3>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-1">
                                        {loadingConversations ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                            </div>
                                        ) : conversations.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-8">
                                                Nenhuma conversa ainda
                                            </p>
                                        ) : (
                                            conversations.map((conv) => (
                                                <div
                                                    key={conv.id}
                                                    className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${selectedConversationId === conv.id
                                                        ? "bg-[#1E3A5F]/10 border border-[#1E3A5F]/20"
                                                        : "hover:bg-gray-100"
                                                        }`}
                                                    onClick={() => selectConversation(conv.id)}
                                                >
                                                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate text-gray-800">
                                                            {conv.title || "Nova conversa"}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {format(new Date(conv.updatedAt), "dd MMM", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 h-8 w-8"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
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

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4">
                                {!selectedConversationId && !currentConversation?.messages?.length ? (
                                    // Empty State
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                        <div className="w-20 h-20 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mb-6">
                                            <Sparkles className="w-10 h-10 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao Vita Assist</h2>
                                        <p className="text-gray-500 max-w-md mb-8">
                                            Seu consultor médico de IA. Tire dúvidas sobre diagnósticos, tratamentos e
                                            guidelines médicos com respostas baseadas em evidências.
                                        </p>
                                        <div className="grid gap-3 w-full max-w-md">
                                            {[
                                                "Quais são as diretrizes atuais para tratamento de hipertensão?",
                                                "Como investigar anemia ferropriva?",
                                                "Diagnóstico diferencial de dor torácica",
                                            ].map((suggestion) => (
                                                <Button
                                                    key={suggestion}
                                                    variant="outline"
                                                    className="text-left h-auto py-3 px-4 justify-start hover:bg-[#1E3A5F]/5 hover:border-[#1E3A5F]/30"
                                                    onClick={() => {
                                                        setInputMessage(suggestion);
                                                        textareaRef.current?.focus();
                                                    }}
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0 text-[#448C9B]" />
                                                    <span className="text-sm text-gray-700">{suggestion}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ) : loadingConversation ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#448C9B]" />
                                    </div>
                                ) : (
                                    // Messages
                                    <div className="max-w-5xl mx-auto space-y-4 pb-4">
                                        {currentConversation?.messages?.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                {message.role === "assistant" && (
                                                    <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                                                        <Bot className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user"
                                                        ? "bg-[#1E3A5F] text-white"
                                                        : "bg-white border border-gray-200 shadow-sm"
                                                        }`}
                                                >
                                                    {message.role === "assistant" ? (
                                                        <div className="prose prose-sm max-w-none text-gray-800">
                                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    )}
                                                    <p
                                                        className={`text-xs mt-2 ${message.role === "user" ? "text-white/70" : "text-gray-400"
                                                            }`}
                                                    >
                                                        {format(new Date(message.createdAt), "HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                                {message.role === "user" && (
                                                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {sendMessageMutation.isPending && (
                                            <div className="flex gap-3 justify-start">
                                                <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#448C9B]" />
                                                        <span className="text-sm text-gray-500">Analisando...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Input Area - Sticky at bottom */}
                            <div className="flex-shrink-0 p-4 border-t bg-white">
                                <div className="max-w-5xl mx-auto flex gap-2">
                                    <Textarea
                                        ref={textareaRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Faça uma pergunta médica..."
                                        className="min-h-[52px] max-h-32 resize-none"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                                        className="h-[52px] w-[52px] bg-[#1E3A5F] hover:bg-[#2A4F7C]"
                                    >
                                        {sendMessageMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Vita Assist é uma ferramenta de apoio. Decisões clínicas são responsabilidade do profissional.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
