import React, { useState } from 'react';
import { Bug, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export function FloatingBugButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();

    const submitBugReport = useMutation({
        mutationFn: async (data: { description: string; pageUrl: string; userAgent: string }) => {
            const response = await apiRequest('POST', '/api/bug-reports', data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: 'Relatório enviado',
                description: 'Obrigado por nos ajudar a melhorar o sistema!',
            });
            setDescription('');
            setIsOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao enviar',
                description: error.message || 'Tente novamente mais tarde.',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = () => {
        if (!description.trim()) {
            toast({
                title: 'Descrição obrigatória',
                description: 'Por favor, descreva o problema encontrado.',
                variant: 'destructive',
            });
            return;
        }

        submitBugReport.mutate({
            description: description.trim(),
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
        });
    };

    // Only show for authenticated users
    if (!user) return null;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group"
                aria-label="Relatar um bug"
            >
                <Bug className="h-6 w-6 group-hover:animate-pulse" />
            </button>

            {/* Bug Report Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5 text-amber-600" />
                            Relatar um Problema
                        </DialogTitle>
                        <DialogDescription>
                            Encontrou um bug ou erro no sistema? Descreva o problema abaixo e nossa equipe irá analisar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Descreva o problema que encontrou... (Ex: Ao clicar no botão X, a página fica em branco)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Informações como a página atual e navegador serão enviadas automaticamente para ajudar na análise.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitBugReport.isPending || !description.trim()}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {submitBugReport.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar Relatório
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
