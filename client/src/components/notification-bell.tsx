import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Loader2, AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePWA } from "@/hooks/use-pwa";
import { getNotificationSettings } from "@shared/notification-preferences";
import type { Notification as AppNotification } from "@shared/schema";

type Invitation = {
    id: number;
    clinicId: number;
    clinicName: string;
    email: string;
    role: string;
    status: string;
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

const pushableNotificationTitles = new Set([
    "Paciente aguardando",
    "Análise Completa",
    "Análise completa disponível",
    "Transcrição concluída",
    "Assinatura prestes a expirar",
]);

const formatNotificationDate = (value: string | Date) => {
    const notificationDate = new Date(value);
    if (!Number.isFinite(notificationDate.getTime())) {
        return "";
    }

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Agora";
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)}h atrás`;
    if (diffMinutes < 48 * 60) return "Ontem";

    return notificationDate.toLocaleDateString("pt-BR");
};

const isPushableAppNotification = (notification: AppNotification) =>
    pushableNotificationTitles.has(notification.title);

export function NotificationBell() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { actions } = usePWA();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const pushNotificationsEnabled = getNotificationSettings(user?.preferences).pushNotifications;
    const knownNotificationIdsRef = useRef<Set<number>>(new Set());
    const initializedNotificationsRef = useRef(false);
    const knownInvitationTokensRef = useRef<Set<string>>(new Set());
    const initializedInvitationsRef = useRef(false);

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

    const { data: invitationData, isLoading: isLoadingInvitations } = useQuery<{ invitations: Invitation[] }>({
        queryKey: ["/api/my-invitations"],
        staleTime: 0,
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery<AppNotification[]>({
        queryKey: ["/api/notifications"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/notifications");
            return res.json();
        },
        staleTime: 0,
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    const invitations = invitationData?.invitations || [];
    const unreadNotifications = notifications.filter((notification) => !notification.read);
    const hasUnreadItems = invitations.length > 0 || unreadNotifications.length > 0;

    useEffect(() => {
        if (!initializedNotificationsRef.current) {
            notifications.forEach((notification) => {
                knownNotificationIdsRef.current.add(notification.id);
            });
            initializedNotificationsRef.current = true;
            return;
        }

        const newPushNotifications = notifications.filter(
            (notification) =>
                !knownNotificationIdsRef.current.has(notification.id) &&
                !notification.read &&
                isPushableAppNotification(notification),
        );

        notifications.forEach((notification) => {
            knownNotificationIdsRef.current.add(notification.id);
        });

        if (
            !pushNotificationsEnabled ||
            newPushNotifications.length === 0 ||
            typeof Notification === "undefined" ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        newPushNotifications
            .slice()
            .reverse()
            .forEach((notification) => {
                void actions.showNotification(notification.title, {
                    body: notification.message,
                    tag: `notification-${notification.id}`,
                });
            });
    }, [actions, notifications, pushNotificationsEnabled]);

    useEffect(() => {
        const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

        if (!initializedInvitationsRef.current) {
            pendingInvitations.forEach((invitation) => {
                knownInvitationTokensRef.current.add(invitation.token);
            });
            initializedInvitationsRef.current = true;
            return;
        }

        const newInvitations = pendingInvitations.filter(
            (invitation) => !knownInvitationTokensRef.current.has(invitation.token),
        );

        pendingInvitations.forEach((invitation) => {
            knownInvitationTokensRef.current.add(invitation.token);
        });

        if (
            !pushNotificationsEnabled ||
            newInvitations.length === 0 ||
            typeof Notification === "undefined" ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        newInvitations
            .slice()
            .reverse()
            .forEach((invitation) => {
                const roleLabel = invitation.role === "secretary" ? "Secretária(o)" : "Profissional";

                void actions.showNotification("Convite de clínica recebido", {
                    body: `${invitation.clinicName} convidou você para atuar como ${roleLabel}.`,
                    tag: `invitation-${invitation.token}`,
                });
            });
    }, [actions, invitations, pushNotificationsEnabled]);

    const refreshAfterMutation = async () => {
        // refetchQueries (em vez de invalidateQueries) garante o pull imediato
        // e ignora o staleTime de 5min do queryClient global.
        await Promise.all([
            queryClient.refetchQueries({ queryKey: ["/api/my-invitations"] }),
            queryClient.refetchQueries({ queryKey: ["/api/my-clinic"] }),
            queryClient.refetchQueries({ queryKey: ["/api/user"] }),
            queryClient.refetchQueries({ queryKey: ["/api/notifications"] }),
        ]);
    };

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
            return res.json();
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const acceptMutation = useMutation({
        mutationFn: async (token: string) => {
            setInvitationFeedback(token, { type: "accepting" });
            await apiRequest("POST", `/api/clinic-invitations/${token}/accept`, {});
            return token;
        },
        onSuccess: async (token) => {
            setInvitationFeedback(token, { type: "accepted" });
            await refreshAfterMutation();
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
            void refreshAfterMutation();
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
            void refreshAfterMutation();
        },
    });

    if (isLoadingInvitations || isLoadingNotifications) {
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
                    {hasUnreadItems && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="z-[100] w-80 p-0">
                <div className="px-4 py-3 border-b border-border font-medium">Notificações</div>

                {notifications.length === 0 && invitations.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground p-4">
                        Nenhuma notificação no momento.
                    </div>
                ) : (
                    <div className="max-h-[380px] overflow-y-auto w-full">
                        {notifications.length > 0 && (
                            <>
                                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground border-b border-border/70">
                                    Avisos do App
                                </div>
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        className={cn(
                                            "w-full p-4 border-b border-border text-left transition-colors hover:bg-muted/40",
                                            !notification.read && "bg-primary/5",
                                        )}
                                        onClick={() => {
                                            if (!notification.read) {
                                                markAsReadMutation.mutate(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-muted-foreground">
                                                {formatNotificationDate(notification.date)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}

                        {invitations.length > 0 && (
                            <>
                                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground border-b border-border/70">
                                    Convites Pendentes
                                </div>
                                {invitations.map((inv) => {
                                    const state = feedback[inv.token];
                                    const inviteExpiresAt = new Date(inv.expiresAt);
                                    const hasValidExpiry = Number.isFinite(inviteExpiresAt.getTime());
                                    const isExpired =
                                        inv.status === "expired" ||
                                        (hasValidExpiry && inviteExpiresAt.getTime() <= Date.now());
                                    const isBusy = state?.type === "accepting" || state?.type === "rejecting";
                                    const isDone = state?.type === "accepted" || state?.type === "rejected";
                                    const expirationLabel = hasValidExpiry
                                        ? inviteExpiresAt.toLocaleDateString("pt-BR")
                                        : null;

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

                                            {isExpired ? (
                                                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    <span className="leading-snug">
                                                        {expirationLabel
                                                            ? `Este convite expirou em ${expirationLabel}.`
                                                            : "Este convite expirou."}
                                                    </span>
                                                </div>
                                            ) : expirationLabel ? (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Expira em {expirationLabel}
                                                </p>
                                            ) : null}

                                            {state?.type === "error" && (
                                                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    <span className="leading-snug">{state.message}</span>
                                                </div>
                                            )}

                                            {!isExpired && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        className="h-8 flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-70"
                                                        disabled={isBusy || isDone}
                                                        onClick={() => {
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
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
