import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Loader2, AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { useLocation } from "wouter";

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

type InvitationFeedback =
    | { type: "accepting" }
    | { type: "rejecting" }
    | { type: "accepted" }
    | { type: "rejected" }
    | { type: "error"; message: string };

export function NotificationBell() {
    const [, setLocation] = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Feedback inline por convite — necessario porque o <Toaster/> global esta
    // desabilitado por decisao de produto. Sem isso, mutations falhavam ou
    // sucediam silenciosamente e o usuario nao tinha feedback nenhum.
    const [feedback, setFeedback] = useState<Record<string, InvitationFeedback>>({});

    const setInvitationFeedback = (token: string, value: InvitationFeedback | null) => {
        setFeedback((prev) => {
            const next = { ...prev };
            if (value === null) {
                delete next[token];
            } else {
                next[token] = value;
            }
            return next;
        });
    };

    // Fetch pending invitations
    const { data, isLoading } = useQuery<{ invitations: Invitation[] }>({
        queryKey: ["/api/my-invitations"],
    });

    const invitations = data?.invitations || [];
    const hasInvitations = invitations.length > 0;

    const refreshAfterMutation = async () => {
        // refetchQueries (em vez de invalidateQueries) garante o pull imediato
        // e ignora o staleTime de 5min do queryClient global.
        await Promise.all([
            queryClient.refetchQueries({ queryKey: ["/api/my-invitations"] }),
            queryClient.refetchQueries({ queryKey: ["/api/my-clinic"] }),
            queryClient.refetchQueries({ queryKey: ["/api/user"] }),
        ]);
    };

    const acceptMutation = useMutation({
        mutationFn: async (token: string) => {
            setInvitationFeedback(token, { type: "accepting" });
            await apiRequest("POST", `/api/clinic-invitations/${token}/accept`, {});
            return token;
        },
        onSuccess: async (token) => {
            setInvitationFeedback(token, { type: "accepted" });
            await refreshAfterMutation();
            // Pequeno delay para o usuario ver o "Aceito" antes do redirect
            setTimeout(() => {
                setInvitationFeedback(token, null);
                setIsOpen(false);
                setLocation("/minha-clinica");
            }, 700);
        },
        onError: (error: Error, token) => {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error?.message || "Erro inesperado ao aceitar o convite.";
            setInvitationFeedback(token, { type: "error", message });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async (token: string) => {
            setInvitationFeedback(token, { type: "rejecting" });
            await apiRequest("POST", `/api/clinic-invitations/${token}/reject`, {});
            return token;
        },
        onSuccess: async (token) => {
            setInvitationFeedback(token, { type: "rejected" });
            await refreshAfterMutation();
            setTimeout(() => {
                setInvitationFeedback(token, null);
            }, 500);
        },
        onError: (error: Error, token) => {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error?.message || "Erro inesperado ao recusar o convite.";
            setInvitationFeedback(token, { type: "error", message });
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
                        {invitations.map((inv) => {
                            const state = feedback[inv.token];
                            const isBusy = state?.type === "accepting" || state?.type === "rejecting";
                            const isDone = state?.type === "accepted" || state?.type === "rejected";

                            return (
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

                                    {state?.type === "error" && (
                                        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span className="leading-snug">{state.message}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            type="button"
                                            className="h-8 flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-70"
                                            disabled={isBusy || isDone}
                                            onClick={() => {
                                                console.log("[NotificationBell] Accept clicked", inv.token);
                                                acceptMutation.mutate(inv.token);
                                            }}
                                        >
                                            {state?.type === "accepting" ? (
                                                <>
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Aceitando...
                                                </>
                                            ) : state?.type === "accepted" ? (
                                                <>
                                                    <Check className="mr-1 h-3 w-3" /> Aceito
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="mr-1 h-3 w-3" /> Aceitar
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                            className="h-8 flex-1 text-xs cursor-pointer disabled:opacity-70"
                                            disabled={isBusy || isDone}
                                            onClick={() => {
                                                console.log("[NotificationBell] Reject clicked", inv.token);
                                                rejectMutation.mutate(inv.token);
                                            }}
                                        >
                                            {state?.type === "rejecting" ? (
                                                <>
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Recusando...
                                                </>
                                            ) : state?.type === "rejected" ? (
                                                <>
                                                    <X className="mr-1 h-3 w-3" /> Recusado
                                                </>
                                            ) : (
                                                <>
                                                    <X className="mr-1 h-3 w-3" /> Recusar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
