import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Invitation = {
    id: number;
    clinicId: number;
    clinicName: string;
    email: string;
    role: string;
    token: string;
    createdAt: string;
    expiresAt: string;
};

import { useLocation } from "wouter";

export function NotificationBell() {
    const [, setLocation] = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch pending invitations
    const { data, isLoading } = useQuery<{ invitations: Invitation[] }>({
        queryKey: ["/api/my-invitations"],
    });

    const invitations = data?.invitations || [];
    const hasInvitations = invitations.length > 0;

    // Accept invitation mutation
    const acceptMutation = useMutation({
        mutationFn: async (token: string) => {
            await apiRequest("POST", `/api/clinic-invitations/${token}/accept`, {});
        },
        onSuccess: () => {
            toast({
                title: "Convite aceito!",
                description: "Você entrou na clínica com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/my-invitations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/my-clinic"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            setLocation("/minha-clinica");
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao aceitar convite",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Reject invitation mutation
    const rejectMutation = useMutation({
        mutationFn: async (token: string) => {
            await apiRequest("POST", `/api/clinic-invitations/${token}/reject`, {});
        },
        onSuccess: () => {
            toast({
                title: "Convite recusado",
                description: "O convite foi removido.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/my-invitations"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao recusar convite",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="relative text-charcoal opacity-50">
                <Bell className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-charcoal hover:bg-lightGray/80">
                    <Bell className="h-5 w-5" />
                    {hasInvitations && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="z-[100] w-80 p-0">
                <div className="px-4 py-3 border-b border-border font-medium">Notificações</div>

                {invitations.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground p-4">
                        Nenhuma notificação no momento.
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto w-full">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="p-4 border-b border-border last:border-0 flex flex-col gap-3">
                                <div>
                                    <p className="text-sm font-medium">Convite para clínica</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Você foi convidado para ser{" "}
                                        <span className="font-semibold text-foreground">
                                            {inv.role === "secretary" ? "Secretária(o)" : "Profissional"}
                                        </span>{" "}
                                        na clínica <span className="font-semibold text-foreground">{inv.clinicName}</span>.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="h-8 flex-1 text-xs bg-primary hover:bg-primary/90 text-white cursor-pointer"
                                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                                        onClick={(e) => {
                                            console.log("Accept clicked for token:", inv.token);
                                            acceptMutation.mutate(inv.token);
                                        }}
                                    >
                                        <Check className="mr-1 h-3 w-3" /> Aceitar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 flex-1 text-xs cursor-pointer"
                                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                                        onClick={(e) => {
                                            console.log("Reject clicked for token:", inv.token);
                                            rejectMutation.mutate(inv.token);
                                        }}
                                    >
                                        <X className="mr-1 h-3 w-3" /> Recusar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
