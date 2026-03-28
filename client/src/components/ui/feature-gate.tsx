
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Slot } from "@radix-ui/react-slot";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { isAppStoreRestrictedIOSAppShell } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
    children: React.ReactNode;
    feature?: string; // Optional feature name for analytics/logging
}

// Reuse the interface from subscription page (defining locally or importing if available)
interface Subscription {
    status: string;
    planId: number;
}
interface SubscriptionPlan {
    name: string;
    id: number;
}
interface UserSubscription {
    subscription: Subscription | null;
    plan: SubscriptionPlan | null;
}

export const FeatureGate = React.forwardRef<HTMLDivElement, FeatureGateProps>(
    ({ children, feature: _feature, ...props }, ref) => {
        const [, setLocation] = useLocation();
        const iosBillingRestricted = isAppStoreRestrictedIOSAppShell();
        const [dialogOpen, setDialogOpen] = React.useState(false);
        const { data: subscriptionData, isLoading } = useQuery<UserSubscription>({
            queryKey: ['/api/user-subscription'],
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        });

        // Determine if user has access (Plan is NOT "Gratuito" and subscription is active) OR user is admin
        const isVitaPlan =
            (subscriptionData?.subscription?.status === 'active' &&
                subscriptionData?.plan?.name !== 'Gratuito');

        if (isVitaPlan || isLoading) {
            // Unlocked state: Forward ref and spread props using Slot to merge with children
            if (isLoading) return <Slot ref={ref} {...props}>{children}</Slot>;
            return <Slot ref={ref} {...props}>{children}</Slot>;
        }

        const lockedContent = (
            <div
                ref={ref}
                {...props}
                className={cn(
                    "relative block opacity-70 grayscale-[0.3]",
                    iosBillingRestricted ? "cursor-pointer" : "cursor-not-allowed",
                    (props as React.HTMLAttributes<HTMLDivElement>).className
                )}
            >
                <Badge
                    variant="default"
                    className="absolute right-2 top-2 z-20 gap-1 bg-charcoal/95 text-pureWhite shadow-md backdrop-blur-sm"
                >
                    <Lock className="h-3 w-3" />
                    <span>Recurso Premium</span>
                </Badge>

                <div className="pointer-events-none">
                    {children}
                </div>
            </div>
        );

        const upgradeContent = (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <Lock className="h-5 w-5" />
                    <span>Recurso Premium</span>
                </div>
                <p className="text-sm">
                    Esta funcionalidade está disponível exclusivamente nos planos <strong>Vita</strong>.
                </p>
                {iosBillingRestricted ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setLocation('/subscription')}
                    >
                        Ver preços no iOS
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setLocation('/subscription')}
                    >
                        Fazer Upgrade Agora
                    </Button>
                )}
            </div>
        );

        if (iosBillingRestricted) {
            return (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDialogOpen(true);
                        }}
                    >
                        {lockedContent}
                    </div>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Recurso Premium</DialogTitle>
                            <DialogDescription>
                                Este recurso está bloqueado no plano atual. No iOS, o catálogo de assinatura foi preparado para a App Store.
                            </DialogDescription>
                        </DialogHeader>
                        {upgradeContent}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Fechar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            );
        }

        // If Free Plan -> Render logic
        return (
            <HoverCard openDelay={0} closeDelay={100}>
                <HoverCardTrigger asChild>
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        {lockedContent}
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 bg-[#212121] text-white border-none p-4 shadow-xl">
                    <div className="text-white [&_p]:text-gray-300 [&_.text-muted-foreground]:text-gray-400 [&_button]:bg-white [&_button]:text-[#212121] [&_button]:hover:bg-gray-200">
                        {upgradeContent}
                    </div>
                </HoverCardContent>
            </HoverCard>
        );
    }
);
FeatureGate.displayName = 'FeatureGate';
