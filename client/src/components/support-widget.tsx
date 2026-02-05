
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, User, Bot, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
    role: 'user' | 'bot';
    content: string;
    suggestedActions?: string[];
};

export function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Olá! Sou o Vitabot. Como posso ajudar você hoje?' }
    ]);
    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const chatMutation = useMutation({
        mutationFn: async (msg: string) => {
            const response = await apiRequest('POST', '/api/support/chat', { message: msg });
            return response.json();
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.response,
                suggestedActions: data.suggestedActions
            }]);
        },
        onError: () => {
            setMessages(prev => [...prev, { role: 'bot', content: 'Desculpe, tive um erro ao processar sua mensagem.' }]);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');

        chatMutation.mutate(userMsg);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!user) return null;

    return (
        <>
            {/* Floating Button (Above Bug Button) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group"
                aria-label="Suporte"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed bottom-40 right-6 z-50 w-[350px] h-[500px] flex flex-col shadow-2xl border-none ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-lg flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1 rounded-full">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Suporte VitaView</h3>
                                <p className="text-xs text-blue-100">IA Online • Resposta imediata</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 bg-slate-50">
                        <div className="space-y-4" ref={scrollRef}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                        {msg.suggestedActions?.includes('open_ticket') && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full text-xs h-8 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    onClick={() => alert('Abrir ticket - Implementação futura')}
                                                >
                                                    <Ticket className="h-3 w-3 mr-2" />
                                                    Falar com Humano
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {chatMutation.isPending && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t rounded-b-lg">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Digite sua dúvida..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={!input.trim() || chatMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </>
    );
}
