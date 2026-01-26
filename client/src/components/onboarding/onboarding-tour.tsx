import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useOnboarding, OnboardingStep } from '@/hooks/use-onboarding';
import { useLocation } from 'wouter';
import { preloadRoutes } from '@/lib/route-utils';

interface TooltipPosition {
    top: number;
    left: number;
    arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

function calculatePosition(
    targetRect: DOMRect,
    placement: OnboardingStep['placement'],
    tooltipWidth: number = 320,
    tooltipHeight: number = 180
): TooltipPosition {
    const gap = 12;
    let top = 0;
    let left = 0;
    let arrowPosition: TooltipPosition['arrowPosition'] = 'left';

    switch (placement) {
        case 'right':
            top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
            left = targetRect.right + gap;
            arrowPosition = 'left';
            break;
        case 'left':
            top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
            left = targetRect.left - tooltipWidth - gap;
            arrowPosition = 'right';
            break;
        case 'bottom':
            top = targetRect.bottom + gap;
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            arrowPosition = 'top';
            break;
        case 'top':
            top = targetRect.top - tooltipHeight - gap;
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            arrowPosition = 'bottom';
            break;
    }

    // Keep tooltip within viewport
    const maxLeft = window.innerWidth - tooltipWidth - 20;
    const maxTop = window.innerHeight - tooltipHeight - 20;
    left = Math.max(20, Math.min(left, maxLeft));
    top = Math.max(20, Math.min(top, maxTop));

    return { top, left, arrowPosition };
}

export function OnboardingTour() {
    const {
        steps,
        currentStep,
        currentStepData,
        isActive,
        totalSteps,
        nextStep,
        prevStep,
        skipTour,
    } = useOnboarding();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrowPosition: 'left' });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [_, setLocation] = useLocation();

    // Preload routes when tour starts
    useEffect(() => {
        if (isActive) {
            preloadRoutes();
        }
    }, [isActive]);

    // Navigate to step route if needed
    useEffect(() => {
        if (isActive && currentStepData?.route) {
            setLocation(currentStepData.route);
        }
    }, [isActive, currentStepData, setLocation]);

    // Find and highlight the target element
    useEffect(() => {
        if (!isActive || !currentStepData) return;

        const findTarget = () => {
            const target = document.querySelector(currentStepData.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);
                setPosition(calculatePosition(rect, currentStepData.placement));

                // Scroll target into view if needed
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(findTarget, 300); // Increased delay slightly to allow for route transition
        window.addEventListener('resize', findTarget);
        window.addEventListener('scroll', findTarget);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', findTarget);
            window.removeEventListener('scroll', findTarget);
        };
    }, [isActive, currentStep, currentStepData]);

    if (!isActive || !currentStepData) return null;

    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998]"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            // Create a "hole" for the target element
                            ...(targetRect && {
                                clipPath: `polygon(
                  0% 0%,
                  0% 100%,
                  ${targetRect.left - 8}px 100%,
                  ${targetRect.left - 8}px ${targetRect.top - 8}px,
                  ${targetRect.right + 8}px ${targetRect.top - 8}px,
                  ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                  ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
                  ${targetRect.left - 8}px 100%,
                  100% 100%,
                  100% 0%
                )`,
                            }),
                        }}
                        onClick={skipTour}
                    />

                    {/* Highlight ring around target */}
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed z-[9999] pointer-events-none"
                            style={{
                                top: targetRect.top - 8,
                                left: targetRect.left - 8,
                                width: targetRect.width + 16,
                                height: targetRect.height + 16,
                                border: '2px solid #212121',
                                borderRadius: '12px',
                                boxShadow: '0 0 0 4px rgba(33, 33, 33, 0.3), 0 0 20px rgba(33, 33, 33, 0.4)',
                            }}
                        />
                    )}

                    {/* Tooltip */}
                    <motion.div
                        ref={tooltipRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed z-[10000] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                        style={{
                            top: position.top,
                            left: position.left,
                        }}
                    >
                        {/* Header */}
                        <div className="bg-[#212121] text-white px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Passo {currentStep + 1} de {totalSteps}
                                </span>
                            </div>
                            <button
                                onClick={skipTour}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-heading font-bold text-lg text-[#212121] mb-2">
                                {currentStepData.title}
                            </h3>
                            <p className="text-sm text-[#757575] leading-relaxed">
                                {currentStepData.description}
                            </p>
                        </div>

                        {/* Footer */}
                        {/* Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between flex-wrap gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={skipTour}
                                className="text-[#9E9E9E] hover:text-[#212121] text-xs h-8"
                            >
                                Pular
                            </Button>
                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={prevStep}
                                        className="h-8 px-3"
                                    >
                                        <ChevronLeft className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Anterior</span>
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={nextStep}
                                    className="bg-[#212121] hover:bg-[#424242] text-white h-8 px-4 min-w-[90px]"
                                >
                                    {currentStep === totalSteps - 1 ? (
                                        <span className="text-xs font-medium">Concluir</span>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <span className="text-xs font-medium">Próximo</span>
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Progress dots */}
                        <div className="px-4 pb-3 flex justify-center gap-1">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all ${index === currentStep
                                        ? 'w-4 bg-[#212121]'
                                        : index < currentStep
                                            ? 'w-1.5 bg-[#9E9E9E]'
                                            : 'w-1.5 bg-[#E0E0E0]'
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
