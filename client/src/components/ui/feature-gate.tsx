
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

export const FeatureGate = ({ children }: FeatureGateProps) => {
    const [, setLocation] = useLocation();
    const { data: subscriptionData, isLoading } = useQuery<UserSubscription>({
        queryKey: ['/api/user-subscription'],
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Determine if user has access (Plan is NOT "Gratuito" and subscription is active)
    const isVitaPlan =
        subscriptionData?.subscription?.status === 'active' &&
        subscriptionData?.plan?.name !== 'Gratuito';

    // If loading or user has access, render children normally
    // (Loading usually defaults to showing content or a skeleton, but here we can just show content to avoid layout shift, 
    // checking access is fast if cached. Or we can block if unsure. Let's be permissive during load or use checks.)
    // Better: if loading, assume restricted? Or assume allowed?
    // Let's assume restricted to be safe, or just render children if loading.

    if (isVitaPlan || isLoading) {
        if (isLoading) return <>{children}</>; // Avoid flicker, maybe restricted items are visible for a split second. Ideally we'd show skeleton.
        return <>{children}</>;
    }

    // If Free Plan -> Render logic
    // "assinantes do plano gratuito devem poder visualizar as ferramentas dos outros planos, mas ao tentarem utilizá-las deve ser bloqueado"
    // "e aparecer um popup ao passar o mouse em cima (disponível nos planos Vita)"

    // We wrap children in a div that captures all events?
    return (
        <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div className="relative inline-block cursor-not-allowed opacity-70 grayscale-[0.3]">
                    {/* Transparent overlay to capture clicks */}
                    <div
                        className="absolute inset-0 z-50 bg-transparent"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    />
                    <div className="pointer-events-none">
                        {children}
                    </div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-[#212121] text-white border-none p-4 shadow-xl">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold text-lg text-[#00E5FF]">
                        <Lock className="h-5 w-5" />
                        <span>Recurso Premium</span>
                    </div>
                    <p className="text-sm text-gray-300">
                        Esta funcionalidade está disponível exclusivamente nos planos <strong>Vita</strong>.
                    </p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2 bg-white text-[#212121] hover:bg-gray-200"
                        onClick={() => setLocation('/subscription')}
                    >
                        Fazer Upgrade Agora
                    </Button>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};
