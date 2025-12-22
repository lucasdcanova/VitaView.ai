import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    description: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="sidebar-logo"]',
        title: 'Bem-vindo ao VitaView AI! 👋',
        description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades da plataforma.',
        placement: 'right',
    },
    {
        id: 'patient-selector',
        target: '[data-tour="patient-selector"]',
        title: 'Selecione um Paciente',
        description: 'Use este seletor para criar novos pacientes ou alternar entre os existentes. Cada paciente tem seu próprio histórico de exames e consultas.',
        placement: 'right',
    },
    {
        id: 'dashboard',
        target: '[data-tour="nav-dashboard"]',
        title: 'Dashboard',
        description: 'Sua página inicial com resumo de atividades, ações rápidas e próximas consultas.',
        placement: 'right',
    },
    {
        id: 'agenda',
        target: '[data-tour="nav-agenda"]',
        title: 'Agenda',
        description: 'Gerencie suas consultas, agende novos atendimentos e visualize seu calendário.',
        placement: 'right',
    },
    {
        id: 'timeline',
        target: '[data-tour="nav-timeline"]',
        title: 'Vita Timeline',
        description: 'Visualize a evolução clínica do paciente com gráficos interativos de todas as métricas laboratoriais.',
        placement: 'right',
    },
    {
        id: 'upload',
        target: '[data-tour="nav-upload"]',
        title: 'Enviar Exames',
        description: 'Faça upload de PDFs de exames laboratoriais. Nossa IA extrai automaticamente os resultados e organiza no histórico do paciente.',
        placement: 'right',
    },
    {
        id: 'quick-actions',
        target: '[data-tour="quick-actions"]',
        title: 'Ações Rápidas',
        description: 'Acesse rapidamente as funções mais usadas: cadastrar paciente, agendar consulta, enviar exame ou visualizar timeline.',
        placement: 'bottom',
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
