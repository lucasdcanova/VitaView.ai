import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
    route?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'agenda',
        target: '[data-tour="nav-agenda"]',
        title: '1. Agenda',
        description: 'Comece organizando seus atendimentos. Aqui você visualiza e gerencia todas as suas consultas agendadas do dia e da semana.',
        placement: 'right',
        route: '/agenda'
    },
    {
        id: 'anamnesis',
        target: '[data-tour="nav-pacientes"]',
        title: '2. Anamnese',
        description: 'Gerencie sua base de pacientes. Ao acessar um paciente, você poderá registrar toda a anamnese, histórico clínico e evoluções de forma detalhada e segura.',
        placement: 'right',
        route: '/pacientes'
    },
    {
        id: 'prescription',
        target: '[data-tour="patient-selector"]',
        title: '3. Prescrição',
        description: 'Selecione um paciente ativo aqui para iniciar o atendimento. Utilize nossa IA para gerar prescrições inteligentes, receitas de controle especial e atestados em segundos.',
        placement: 'right',
        route: '/agenda'
    },
    {
        id: 'reports',
        target: '[data-tour="nav-relatorios"]',
        title: '4. Relatórios',
        description: 'Acompanhe métricas detalhadas da sua clínica ou consultório. Visualize dados financeiros, volume de atendimentos e estatísticas de saúde dos seus pacientes.',
        placement: 'right',
        route: '/reports'
    },
    {
        id: 'settings',
        target: '[data-tour="nav-configuracoes"]',
        title: '5. Configurações',
        description: 'Personalize sua experiência. IMPORTANTE: Acesse esta área agora para completar seu perfil profissional, adicionar seu CRM e configurar suas preferências de atendimento para um perfil mais completo.',
        placement: 'right',
        route: '/profile'
    },
    {
        id: 'subscription',
        target: '[data-tour="nav-assinatura"]',
        title: '6. Minha Assinatura',
        description: 'Gerencie seu plano, faturas e métodos de pagamento. Acompanhe o status da sua assinatura e faça upgrades conforme sua necessidade.',
        placement: 'right',
        route: '/subscription'
    },
];

const ONBOARDING_STORAGE_KEY = 'vitaview_onboarding_completed';

export function useOnboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(true); // Default true to prevent flash

    // Check localStorage on mount
    useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsCompleted(completed === 'true');
    }, []);

    // Start the tour
    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    // Complete the tour
    const completeTour = useCallback(() => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        setIsCompleted(true);
        setIsActive(false);
    }, []);

    // Go to next step
    const nextStep = useCallback(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTour();
        }
    }, [currentStep, completeTour]);

    // Go to previous step
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    // Skip the tour
    const skipTour = useCallback(() => {
        completeTour();
    }, [completeTour]);

    // Auto-start tour for new users (only once)
    useEffect(() => {
        if (!isCompleted) {
            // Small delay to let the page render first
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isCompleted]);

    return {
        steps: ONBOARDING_STEPS,
        currentStep,
        currentStepData: ONBOARDING_STEPS[currentStep],
        isActive,
        isCompleted,
        totalSteps: ONBOARDING_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
    };
}
