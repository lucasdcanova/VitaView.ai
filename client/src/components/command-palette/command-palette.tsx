import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    User,
    FileText,
    Calendar,
    Plus,
    Upload,
    Heart,
    ArrowRight,
    Command,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';

interface SearchResult {
    id: string;
    type: 'patient' | 'exam' | 'appointment' | 'action';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
}

interface CommandPaletteProps {
    onPatientCreate?: () => void;
}

export function CommandPalette({ onPatientCreate }: CommandPaletteProps) {
    const [, setLocation] = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Quick actions (always available)
    const quickActions: SearchResult[] = [
        {
            id: 'action-new-patient',
            type: 'action',
            title: 'Novo Paciente',
            subtitle: 'Cadastrar um novo paciente',
            icon: <Plus className="h-4 w-4 text-green-500" />,
            action: () => {
                setIsOpen(false);
                onPatientCreate?.();
            },
        },
        {
            id: 'action-upload',
            type: 'action',
            title: 'Enviar Exame',
            subtitle: 'Upload de PDF de exame laboratorial',
            icon: <Upload className="h-4 w-4 text-blue-500" />,
            action: () => {
                setIsOpen(false);
                setLocation('/upload');
            },
        },
        {
            id: 'action-timeline',
            type: 'action',
            title: 'Vita Timeline',
            subtitle: 'Visualizar evolução clínica do paciente',
            icon: <Heart className="h-4 w-4 text-red-500" />,
            action: () => {
                setIsOpen(false);
                setLocation('/health-trends');
            },
        },
        {
            id: 'action-agenda',
            type: 'action',
            title: 'Agenda',
            subtitle: 'Ver e gerenciar consultas',
            icon: <Calendar className="h-4 w-4 text-purple-500" />,
            action: () => {
                setIsOpen(false);
                setLocation('/agenda');
            },
        },
    ];

    // Search patients
    const { data: patients = [] } = useQuery({
        queryKey: ['/api/profiles'],
        queryFn: async () => {
            const res = await fetch('/api/profiles', { credentials: 'include' });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen && query.length > 0,
    });

    // Search exams
    const { data: exams = [] } = useQuery({
        queryKey: ['/api/exams'],
        queryFn: async () => {
            const res = await fetch('/api/exams', { credentials: 'include' });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen && query.length > 0,
    });

    // Filter results based on query
    const filteredResults: SearchResult[] = React.useMemo(() => {
        if (!query.trim()) {
            return quickActions;
        }

        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        // Filter patients
        const filteredPatients = patients
            .filter((p: any) => p.name?.toLowerCase().includes(lowerQuery))
            .slice(0, 5)
            .map((p: any) => ({
                id: `patient-${p.id}`,
                type: 'patient' as const,
                title: p.name,
                subtitle: p.email || 'Paciente',
                icon: <User className="h-4 w-4 text-blue-500" />,
                action: () => {
                    setIsOpen(false);
                    setLocation('/health-trends');
                },
            }));
        results.push(...filteredPatients);

        // Filter exams
        const filteredExams = exams
            .filter((e: any) =>
                e.name?.toLowerCase().includes(lowerQuery) ||
                e.laboratoryName?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map((e: any) => ({
                id: `exam-${e.id}`,
                type: 'exam' as const,
                title: e.name,
                subtitle: e.laboratoryName || e.examDate || 'Exame',
                icon: <FileText className="h-4 w-4 text-orange-500" />,
                action: () => {
                    setIsOpen(false);
                    setLocation(`/results/${e.id}`);
                },
            }));
        results.push(...filteredExams);

        // Filter quick actions
        const filteredActions = quickActions.filter(
            a => a.title.toLowerCase().includes(lowerQuery) ||
                a.subtitle?.toLowerCase().includes(lowerQuery)
        );
        results.push(...filteredActions);

        return results;
    }, [query, patients, exams, quickActions, setLocation]);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
            e.preventDefault();
            filteredResults[selectedIndex].action();
        }
    }, [filteredResults, selectedIndex]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[9998]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[9999]"
                    >
                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                            {/* Search input */}
                            <div className="flex items-center px-4 py-3 border-b">
                                <Search className="h-5 w-5 text-gray-400 mr-3" />
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Buscar pacientes, exames ou ações..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                                />
                                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto">
                                {filteredResults.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500">
                                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p>Nenhum resultado encontrado</p>
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {!query && (
                                            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Ações Rápidas
                                            </div>
                                        )}
                                        {filteredResults.map((result, index) => (
                                            <motion.button
                                                key={result.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                onClick={result.action}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                                                        ? 'bg-[#212121] text-white'
                                                        : 'hover:bg-gray-100'
                                                    }`}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                            >
                                                <div className={`flex-shrink-0 p-1.5 rounded-lg ${index === selectedIndex ? 'bg-white/10' : 'bg-gray-100'
                                                    }`}>
                                                    {result.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                        {result.title}
                                                    </p>
                                                    {result.subtitle && (
                                                        <p className={`text-sm truncate ${index === selectedIndex ? 'text-white/70' : 'text-gray-500'
                                                            }`}>
                                                            {result.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className={`h-4 w-4 flex-shrink-0 ${index === selectedIndex ? 'text-white/70' : 'text-gray-300'
                                                    }`} />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↑↓</kbd>
                                        navegar
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↵</kbd>
                                        selecionar
                                    </span>
                                </div>
                                <span className="flex items-center gap-1">
                                    <Command className="h-3 w-3" />
                                    <span>+</span>
                                    <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">K</kbd>
                                    buscar
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
