
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
import { useAuth } from "@/hooks/use-auth";

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
    ({ children, ...props }, ref) => {
        const [, setLocation] = useLocation();
        const { user } = useAuth();
        const { data: subscriptionData, isLoading } = useQuery<UserSubscription>({
            queryKey: ['/api/user-subscription'],
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        });

        // Determine if user has access (Plan is NOT "Gratuito" and subscription is active) OR user is admin
        const isVitaPlan =
            (subscriptionData?.subscription?.status === 'active' &&
                subscriptionData?.plan?.name !== 'Gratuito') ||
            user?.role === 'admin';

        if (isVitaPlan || isLoading) {
            // Unlocked state: Forward ref and spread props using Slot to merge with children
            if (isLoading) return <Slot ref={ref} {...props}>{children}</Slot>;
            return <Slot ref={ref} {...props}>{children}</Slot>;
        }

        // If Free Plan -> Render logic
        return (
            <HoverCard openDelay={0} closeDelay={100}>
                <HoverCardTrigger asChild>
                    {/* Locked state wrapper receives the ref (for positioning/triggering) and props (like onClick from parent triggers) */}
                    <div
                        ref={ref}
                        {...props}
                        className="relative inline-block cursor-not-allowed opacity-70 grayscale-[0.3]"
                    >
                        {/* Transparent overlay to capture and block clicks */}
                        <div
                            className="absolute inset-0 z-50 bg-transparent"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Stop event from bubbling to parent triggers (like DialogTrigger)
                            }}
                        />
                        <div className="pointer-events-none">
                            {children}
                        </div>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 bg-[#212121] text-white border-none p-4 shadow-xl">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-semibold text-lg text-white">
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
    }
);
FeatureGate.displayName = 'FeatureGate';
