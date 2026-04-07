import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Sparkles, Lightbulb, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomMedication } from "@shared/schema";

// Helper function to render prescription type badge with appropriate colors
export const PrescriptionTypeBadge = ({ type }: { type?: 'common' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' }) => {
    if (!type || type === 'common') return null;

    const badgeConfig: Record<string, { label: string; className: string }> = {
        'A': {
            label: 'A',
            className: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100'
        },
        'B1': {
            label: 'B1',
            className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100'
        },
        'B2': {
            label: 'B2',
            className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100'
        },
        'C': {
            label: 'C',
            className: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100'
        },
        'C1': {
            label: 'C1',
            className: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100'
        },
        'especial': {
            label: 'Controle Especial',
            className: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100'
        },
    };

    const config = badgeConfig[type];
    if (!config) return null;

    return (
        <Badge variant="outline" className={cn("text-xs font-semibold", config.className)}>
            {config.label}
        </Badge>
    );

};

// Helper function to get medication icon based on format
export const getMedicationIcon = (format: string) => {
    const formatLower = (format || "").toLowerCase();

    if (formatLower.includes("injecao") || formatLower.includes("injeção") || formatLower.includes("ampola") || formatLower.includes("refil") || formatLower.includes("caneta")) {
        return "💉";
    }
    if (formatLower.includes("pomada") || formatLower.includes("creme") || formatLower.includes("gel") || formatLower.includes("locao") || formatLower.includes("loção")) {
        return "🧴";
    }
    if (formatLower.includes("gotas") || formatLower.includes("xarope") || formatLower.includes("elixir") || formatLower.includes(" po ") || formatLower.includes("pó") || formatLower.includes("solucao") || formatLower.includes("solução") || formatLower.includes("suspensao") || formatLower.includes("suspensão") || formatLower.includes("colirio") || formatLower.includes("colírio")) {
        return "💧";
    }
    if (formatLower.includes("spray") || formatLower.includes("aerosol") || formatLower.includes("inalatoria") || formatLower.includes("jato")) {
        return "💨";
    }
    if (formatLower.includes("capsula") || formatLower.includes("cápsula") || formatLower.includes("sache") || formatLower.includes("sachê") || formatLower.includes("supositorio") || formatLower.includes("supositório")) {
        return "💊";
    }

    if (formatLower.includes("enema") || formatLower.includes("clister")) {
        return "🧴";
    }

    // Default to pill for tablets and others
    return "💊";
};

export const medicationSchema = z.object({
    name: z.string().min(1, "Nome do medicamento é obrigatório"),
    format: z.string().default("comprimido"),
    dosage: z.string().min(1, "Dosagem é obrigatória"),
    dosageUnit: z.string().default("mg"),
    frequency: z.string().min(1, "Frequência é obrigatória"),
    doseAmount: z.coerce.number().min(1).default(1),
    prescriptionType: z.string().default("padrao"), // padrao, especial, A, B1, B2, C
    quantity: z.string().optional(),
    administrationRoute: z.string().default("oral"),
    startDate: z.string().min(1, "Data de início é obrigatória"),
    notes: z.string().optional(),
});

export type MedicationFormData = z.infer<typeof medicationSchema>;

interface MedicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<MedicationFormData>;
    onSubmit: (data: MedicationFormData) => void;
    isPending: boolean;
    mode: "create" | "edit";
    onRemove?: () => void;
    isRemovePending?: boolean;
}

// Tipos para o banco de medicamentos
interface AgeRange {
    minAge: number; // Idade mínima em anos
    maxAge: number; // Idade máxima em anos
    dose: number; // Dose para essa faixa etária
    unit: string; // Unidade (ex: "ml", "gotas")
    frequency: string; // Frequência (ex: "8/8h", "6-8h")
    indication?: string; // Descrição da faixa (ex: "2-5 anos")
}

interface MedicationPresentation {
    dosage: string;
    unit: string;
    format: string;
    commonDose?: string;
    indication?: string;
    // Campos para cálculo de dose por peso (uso pediátrico)
    isPediatric?: boolean;
    dosePerKg?: number; // Dose em mg/kg
    dosePerKgMax?: number; // Dose máxima em mg/kg (para faixa)
    concentration?: number; // Concentração em mg/ml
    maxDailyDose?: number; // Dose máxima diária em mg
    frequency?: number; // Número de doses por dia
    suggestedDose?: string; // Dose sugerida para preencher o campo (ex: "5", "30")
    suggestedUnit?: string; // Unidade sugerida (ex: "ml", "gotas")
    // Campos para dosagem baseada em idade (não peso)
    isAgeBased?: boolean; // Se true, usa faixas etárias em vez de peso
    ageRanges?: AgeRange[]; // Faixas etárias com doses específicas
    duration?: number; // Duração do tratamento em dias
}

interface MedicationInfo {
    name: string;
    presentations: MedicationPresentation[];
    category: string;
    route: string;
    isControlled?: boolean;
    prescriptionType?: 'common' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1'; // Tipo de receituário (C1 = Especial)
    commonFrequencies?: string[];
    notes?: string;
}

// Banco de dados de medicamentos com apresentações
export const MEDICATION_DATABASE: MedicationInfo[] = [
    // ANTI-HIPERTENSIVOS
    {
        name: "Losartana",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30, indication: "HAS leve a moderada" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30, indication: "HAS moderada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Enalapril",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1-2x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1-2x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Anlodipino",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5-5mg 1x/dia", duration: 30, indication: "Idosos" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30, indication: "HAS leve a moderada" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroclorotiazida",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "12.5-25mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Propranolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-40mg 2-3x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 2-3x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    // ANTIDIABÉTICOS
    {
        name: "Metformina",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1-2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "850", unit: "mg", format: "Comprimido", commonDose: "850mg 1-3x/dia", duration: 30, indication: "Dose habitual" },
            { dosage: "1000", unit: "mg", format: "Comprimido", commonDose: "1000mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Tomar junto às refeições",
    },
    {
        name: "Metformina XR",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido Lib. Prol.", commonDose: "500-1000mg 1x/dia", duration: 30, indication: "Glifage XR 500" },
            { dosage: "750", unit: "mg", format: "Comprimido Lib. Prol.", commonDose: "750-1500mg 1x/dia", duration: 30, indication: "Glifage XR 750" },
            { dosage: "1000", unit: "mg", format: "Comprimido Lib. Prol.", commonDose: "1000-2000mg 1x/dia", duration: 30, indication: "Glifage XR 1000" },
        ],
        commonFrequencies: ["1x ao dia (noturno)"],
        notes: "Tomar no jantar. Não partir/mastigar",
    },
    // HIPOLIPEMIANTES
    {
        name: "Sinvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Atorvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1x/dia", duration: 30, indication: "Alto risco CV" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Rosuvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDEPRESSIVOS
    {
        name: "Fluoxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20-40mg 1x/dia", duration: 30, indication: "Depressão, TOC" },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40-60mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Sertralina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Escitalopram",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Amitriptilina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-75mg 1x/dia", duration: 30, indication: "Depressão, dor crônica" },
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75-150mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Duloxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30-60mg 1x/dia", duration: 30, indication: "Depressão, fibromialgia" },
            { dosage: "60", unit: "mg", format: "Cápsula", commonDose: "60mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANSIOLÍTICOS / SEDATIVOS
    {
        name: "Clonazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "0.25", unit: "mg", format: "Comprimido", commonDose: "0.25-0.5mg 2-3x/dia", duration: 30 },
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-1mg 2-3x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "1-2mg 2-3x/dia", duration: 30 },
            { dosage: "2.5", unit: "mg/ml", format: "Gotas", commonDose: "5-10 gotas 2-3x/dia", duration: 30, suggestedDose: "5", suggestedUnit: "gotas" },
            // Apresentação pediátrica (convulsões)
            {
                dosage: "2.5", unit: "mg/ml", format: "Gotas",
                commonDose: "0.01-0.05mg/kg/dia dividido 2-3x/dia", duration: 30,
                indication: "Crianças (convulsões) - 1 gota = 0.1mg",
                isPediatric: true,
                dosePerKg: 0.01,
                dosePerKgMax: 0.05,
                concentration: 2.5, // 2.5mg/ml (1 gota ≈ 0.1mg)
                maxDailyDose: 6,
                frequency: 2
            },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia", "Quando necessário"],
        notes: "Receita B1 (azul). 1 gota = 0.1mg",
    },
    {
        name: "Alprazolam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "0.25", unit: "mg", format: "Comprimido", commonDose: "0.25-0.5mg 2-3x/dia", duration: 30 },
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-1mg 2-3x/dia", duration: 30 },
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 2-3x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul) - Controle especial",
    },
    {
        name: "Zolpidem",
        category: "Hipnótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg à noite", duration: 30, indication: "Idosos" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar imediatamente antes de deitar",
    },
    // GASTROPROTETORES
    {
        name: "Omeprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20mg 1x/dia", duration: 30, indication: "Proteção gástrica" },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40mg 1x/dia", duration: 30, indication: "DRGE, úlcera" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum, 30min antes da refeição",
    },
    {
        name: "Pantoprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum",
    },
    // ANALGÉSICOS / ANTI-INFLAMATÓRIOS
    {
        name: "Paracetamol",
        category: "Analgésico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 4-6x/dia", duration: 5 },
            { dosage: "750", unit: "mg", format: "Comprimido", commonDose: "750mg 4-6x/dia", duration: 5 },
            { dosage: "200", unit: "mg/ml", format: "Gotas", commonDose: "35-55 gotas 4-6x/dia", suggestedDose: "35", suggestedUnit: "gotas", duration: 5 },
            // Apresentação pediátrica
            {
                dosage: "200", unit: "mg/ml", format: "Gotas",
                commonDose: "10-15mg/kg/dose 4-6x/dia", duration: 5,
                indication: "Uso pediátrico (1 gota = 10mg)",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 15,
                concentration: 200, // 200mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
            {
                dosage: "100", unit: "mg/ml", format: "Suspensão",
                commonDose: "10-15mg/kg/dose 4-6x/dia", duration: 5,
                indication: "Uso pediátrico (Bebê - Seringa)",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 15,
                concentration: 100, // 100mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
            {
                dosage: "32", unit: "mg/ml", format: "Suspensão",
                commonDose: "10-15mg/kg/dose 4-6x/dia", duration: 5,
                indication: "Uso pediátrico (Criança)",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 15,
                concentration: 32, // 32mg/ml
                maxDailyDose: 3000,
                frequency: 4,
            },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h", "Quando necessário"],
        notes: "Dose máxima: 4g/dia. 1 gota = 10mg",
    },
    {
        name: "Dipirona",
        category: "Analgésico",
        route: "oral",
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "1 gota = 25mg",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 4x/dia", duration: 5 },
            { dosage: "1000", unit: "mg", format: "Comprimido", commonDose: "1000mg 4x/dia", duration: 5 },
            { dosage: "500", unit: "mg/ml", format: "Gotas", commonDose: "20-40 gotas 4x/dia", suggestedDose: "30", suggestedUnit: "gotas", duration: 5 },
            { dosage: "1000", unit: "mg/2ml", format: "Ampola", commonDose: "1 ampola IM/IV 6/6h", duration: 5 },
            // Apresentação pediátrica
            {
                dosage: "500", unit: "mg/ml", format: "Gotas",
                commonDose: "12.5-25mg/kg/dose 4x/dia", duration: 5,
                indication: "Uso pediátrico (1 gota = 25mg)",
                isPediatric: true,
                dosePerKg: 12.5,
                dosePerKgMax: 25,
                concentration: 500, // 500mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
        ],
    },
    {
        name: "Ibuprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 3-4x/dia", duration: 5 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 3-4x/dia", duration: 5 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 3x/dia", duration: 5 },
            // Apresentações pediátricas
            {
                dosage: "50", unit: "mg/ml", format: "Suspensão",
                commonDose: "5-10mg/kg/dose 3-4x/dia", duration: 5,
                indication: "Uso pediátrico",
                isPediatric: true,
                suggestedDose: "5",
                suggestedUnit: "ml",
                dosePerKg: 5,
                dosePerKgMax: 10,
                frequency: 3,
            },
            {
                dosage: "100", unit: "mg/ml", format: "Suspensão", // Alivium 100mg/ml
                commonDose: "5-10mg/kg/dose 3-4x/dia", duration: 5,
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 5,
                dosePerKgMax: 10,
                frequency: 3,
            },
            {
                dosage: "30", unit: "mg/ml", format: "Suspensão", // Alivium 30mg/ml
                commonDose: "5-10mg/kg/dose 3-4x/dia", duration: 5,
                indication: "Uso pediátrico (Criança)",
                isPediatric: true,
                dosePerKg: 5,
                dosePerKgMax: 10,
                frequency: 3,
            },
        ],
        commonFrequencies: ["8h em 8h", "6h em 6h"],
        notes: "Tomar após as refeições",
    },
    {
        name: "Nimesulida",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 2x/dia", duration: 5 },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "⚠️ CONTRAINDICADO em menores de 12 anos. Uso máximo: 15 dias",
    },
    {
        name: "Prednisona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-60mg 1x/dia", duration: 5 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã, após café da manhã",
    },
    // ANTIBIÓTICOS
    {
        name: "Amoxicilina",
        category: "Antibiótico",
        prescriptionType: 'especial',
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Cápsula", commonDose: "500mg 8/8h", duration: 7 },
            { dosage: "875", unit: "mg", format: "Comprimido", commonDose: "875mg 12/12h", duration: 7 },
            // Apresentações líquidas pediátricas
            {
                dosage: "250", unit: "mg/5ml", format: "Suspensão",
                commonDose: "25-50mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico",
                isPediatric: true,
                suggestedDose: "5",
                suggestedUnit: "ml",
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 50, // 250mg/5ml = 50mg/ml
                maxDailyDose: 3000,
                frequency: 3,
                duration: 7
            },
            {
                dosage: "500", unit: "mg/5ml", format: "Suspensão",
                commonDose: "25-50mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico - concentração alta",
                isPediatric: true,
                suggestedDose: "5",
                suggestedUnit: "ml",
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 100, // 500mg/5ml = 100mg/ml
                maxDailyDose: 3000,
                frequency: 3,
                duration: 7
            },
        ],
        commonFrequencies: ["8h em 8h", "12h em 12h"],
    },
    {
        name: "Azitromicina",
        category: "Antibiótico",
        prescriptionType: 'especial',
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1x/dia por 3-5 dias", duration: 5 },
            // Apresentação pediátrica
            {
                dosage: "200", unit: "mg/5ml", format: "Suspensão",
                commonDose: "10mg/kg/dia 1x/dia por 3-5 dias",
                indication: "Uso pediátrico",
                isPediatric: true,
                suggestedDose: "5",
                suggestedUnit: "ml",
                dosePerKg: 10,
                dosePerKgMax: 10,
                concentration: 40, // 200mg/5ml = 40mg/ml
                maxDailyDose: 500,
                frequency: 1,
                duration: 5
            },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ciprofloxacino",
        category: "Antibiótico",
        prescriptionType: 'especial',
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 12/12h", duration: 7 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-750mg 12/12h", duration: 7 },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "⚠️ Evitar em <18 anos (risco de lesão osteoarticular), exceto infecções graves sem alternativas",
    },
    // TIREOIDE
    {
        name: "Levotiroxina",
        category: "Hormônio Tireoidiano",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mcg", format: "Comprimido", commonDose: "25-50mcg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mcg", format: "Comprimido", commonDose: "50-100mcg 1x/dia", duration: 30 },
            { dosage: "75", unit: "mcg", format: "Comprimido", commonDose: "75-125mcg 1x/dia", duration: 30 },
            { dosage: "88", unit: "mcg", format: "Comprimido", commonDose: "88mcg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mcg", format: "Comprimido", commonDose: "100-150mcg 1x/dia", duration: 30 },
            { dosage: "112", unit: "mcg", format: "Comprimido", commonDose: "112mcg 1x/dia", duration: 30 },
            { dosage: "125", unit: "mcg", format: "Comprimido", commonDose: "125-175mcg 1x/dia", duration: 30 },
            { dosage: "150", unit: "mcg", format: "Comprimido", commonDose: "150-200mcg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum, 30-60min antes do café",
    },
    // ANTIALÉRGICOS
    {
        name: "Loratadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 5 },
            // Apresentação pediátrica
            {
                dosage: "1", unit: "mg/ml", format: "Xarope",
                commonDose: "2-12a: 5mg (5ml); >30kg: 10mg (10ml) 1x/dia", duration: 5,
                indication: "Uso pediátrico (>2 anos)",
                isPediatric: true,
                suggestedDose: "5",
                suggestedUnit: "ml",
                dosePerKg: 0.2,
                dosePerKgMax: 0.3,
                concentration: 1, // 1mg/ml
                maxDailyDose: 10,
                frequency: 1,
            },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // OUTROS
    {
        name: "Ácido Acetilsalicílico",
        category: "Antiagregante/Analgésico",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", indication: "Prevenção CV" },
            { dosage: "325", unit: "mg", format: "Comprimido", commonDose: "325mg 1x/dia", indication: "Analgésico" },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 4-6x/dia", indication: "Dor/Febre" },
        ],
        commonFrequencies: ["1x ao dia", "6h em 6h"],
        notes: "Aspirina. Tomar após refeição. Dose baixa = antiagregante; dose alta = analgésico",
    },
    // ANTI-HIPERTENSIVOS ADICIONAIS
    {
        name: "Captopril",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "12.5", unit: "mg", format: "Comprimido", commonDose: "12.5-25mg 2-3x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2-3x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Atenolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Metoprolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 2x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Nifedipino",
        category: "Bloqueador de Canal de Cálcio",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 3x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 2-3x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-60mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },
    {
        name: "Valsartana",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80-160mg 1x/dia", duration: 30 },
            { dosage: "160", unit: "mg", format: "Comprimido", commonDose: "160-320mg 1x/dia", duration: 30 },
            { dosage: "320", unit: "mg", format: "Comprimido", commonDose: "320mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Furosemida",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 1-2x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1-2x/dia", duration: 30 },
            { dosage: "20", unit: "mg/2ml", format: "Ampola", commonDose: "20-40mg EV/IM", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Espironolactona",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDIABÉTICOS ADICIONAIS
    {
        name: "Glibenclamida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5-5mg 1-2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar antes das refeições",
    },
    {
        name: "Glimepirida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar no café da manhã",
    },
    {
        name: "Glicazida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-60mg 1x/dia", duration: 30, indication: "Liberação modificada" },
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60-120mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80-160mg 2x/dia", duration: 30, indication: "Liberação imediata" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Insulina NPH",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Injeção", commonDose: "10-40 UI 1-2x/dia", duration: 30, indication: "Dose conforme glicemia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Ajustar dose conforme glicemia",
    },
    {
        name: "Insulina Regular",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Injeção", commonDose: "Conforme glicemia", duration: 30, indication: "Ação rápida" },
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "Conforme glicemia", duration: 30, indication: "Caneta" },
        ],
        commonFrequencies: ["Antes das refeições"],
        notes: "Aplicar 30min antes das refeições",
    },
    {
        name: "Insulina Glargina",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "10-20 UI 1x/dia", duration: 30, indication: "Lantus/Basaglar (Caneta)" },
            { dosage: "300", unit: "UI/ml", format: "Refil", commonDose: "10-20 UI 1x/dia", duration: 30, indication: "Toujeo (Caneta)" },
            { dosage: "100", unit: "UI/ml", format: "Injeção", commonDose: "10-20 UI 1x/dia", duration: 30, indication: "Frasco" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Insulina basal de longa duração. Horário fixo.",
    },
    {
        name: "Insulina Detemir",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "0.1-0.2 UI/kg 1-2x/dia", duration: 30, indication: "Levemir (Caneta)" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Insulina basal.",
    },
    {
        name: "Insulina Degludeca",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "10 UI 1x/dia", duration: 30, indication: "Tresiba (Caneta)" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Insulina basal ultra-longa. Tresiba.",
    },
    {
        name: "Insulina Asparte",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "Conforme contagem carboidratos", duration: 30, indication: "NovoRapid (Caneta)" },
        ],
        commonFrequencies: ["Antes das refeições"],
        notes: "Ação ultrarrápida.",
    },
    {
        name: "Insulina Lispro",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "Refil", commonDose: "Conforme refeição", duration: 30, indication: "Humalog (Caneta)" },
        ],
        commonFrequencies: ["Antes das refeições"],
        notes: "Ação ultrarrápida.",
    },
    {
        name: "Dapagliflozina",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Pode ser tomado com ou sem alimentos",
    },
    // HIPOLIPEMIANTES ADICIONAIS
    {
        name: "Pravastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Fenofibrato",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "160", unit: "mg", format: "Comprimido", commonDose: "160mg 1x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Cápsula", commonDose: "200mg 1x/dia", duration: 30 },
            { dosage: "250", unit: "mg", format: "Cápsula", commonDose: "250mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar com as refeições",
    },
    {
        name: "Ezetimiba",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDEPRESSIVOS ADICIONAIS
    {
        name: "Paroxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30, indication: "Dose habitual" },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Venlafaxina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "37.5", unit: "mg", format: "Cápsula", commonDose: "37.5-75mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 1x/dia", duration: 30 },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150-225mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Nortriptilina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "10", unit: "mg", format: "Cápsula", commonDose: "10-25mg 1-3x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "Cápsula", commonDose: "25-75mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50-150mg 1x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Clomipramina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-25mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-150mg 1x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75-250mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Bupropiona",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 1-2x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Não tomar à noite (pode causar insônia)",
    },
    {
        name: "Trazodona",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30, indication: "Insônia/dose inicial" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-300mg 1x/dia", duration: 30 },
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150-400mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Mirtazapina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15-30mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-45mg 1x/dia", duration: 30 },
            { dosage: "45", unit: "mg", format: "Comprimido", commonDose: "45mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    // ANSIOLÍTICOS ADICIONAIS
    {
        name: "Diazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 2-3x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul) - Controle especial",
    },
    {
        name: "Lorazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 2-3x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul) - Controle especial",
    },
    {
        name: "Bromazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "1.5-3mg 2-3x/dia", duration: 30 },
            { dosage: "6", unit: "mg", format: "Comprimido", commonDose: "6mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul) - Controle especial",
    },
    // ANTIPSICÓTICOS
    {
        name: "Quetiapina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30, indication: "Insônia/dose baixa" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-300mg 1x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 1x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300-600mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Risperidona",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 1-2x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1-2x/dia", duration: 30 },
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-6mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Olanzapina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5-5mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Aripiprazol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-15mg 1x/dia", duration: 30 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15-30mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-30mg 1x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Brexpiprazol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-1mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 1x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30, indication: "Dose máxima" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Clozapina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1-2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-300mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Monitorar leucograma semanalmente no início do tratamento."
    },
    {
        name: "Paliperidona",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-6mg 1x/dia", duration: 30 },
            { dosage: "6", unit: "mg", format: "Comprimido", commonDose: "6-9mg 1x/dia", duration: 30 },
            { dosage: "9", unit: "mg", format: "Comprimido", commonDose: "9-12mg 1x/dia", duration: 30 },
            { dosage: "12", unit: "mg", format: "Comprimido", commonDose: "12mg 1x/dia", duration: 30, indication: "Dose máxima" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ziprasidona",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20-40mg 2x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40-80mg 2x/dia", duration: 30 },
            { dosage: "60", unit: "mg", format: "Cápsula", commonDose: "60-80mg 2x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Cápsula", commonDose: "80mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        notes: "Tomar com alimentos para melhor absorção."
    },
    {
        name: "Lurasidona",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar com alimentos (mínimo 350 kcal)."
    },
    {
        name: "Haloperidol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-5mg 2-3x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 2-3x/dia", duration: 30 },
            { dosage: "2", unit: "mg/ml", format: "Gotas", commonDose: "5-15 gotas 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    // ANTICONVULSIVANTES
    {
        name: "Carbamazepina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 2-3x/dia", duration: 30 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Valproato de Sódio",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 2-3x/dia", duration: 30 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Fenitoína",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },

    {
        name: "Topiramato",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 2x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Gabapentina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "300", unit: "mg", format: "Cápsula", commonDose: "300mg 3x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "400", unit: "mg", format: "Cápsula", commonDose: "400mg 3x/dia", duration: 30 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Pregabalina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75mg 2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150mg 2x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Cápsula", commonDose: "300mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    // ANTI-INFLAMATÓRIOS ADICIONAIS
    {
        name: "Diclofenaco",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2-3x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75mg 2x/dia", duration: 30, indication: "Liberação prolongada" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Tomar após as refeições",
    },
    {
        name: "Cetoprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50mg 3x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 2x/dia", duration: 30 },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Meloxicam",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "7.5", unit: "mg", format: "Comprimido", commonDose: "7.5-15mg 1x/dia", duration: 30 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Piroxicam",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Prednisolona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-60mg 1x/dia", duration: 5 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 5 },
            // Apresentação pediátrica
            {
                dosage: "3", unit: "mg/ml", format: "Solução",
                commonDose: "1-2mg/kg/dia 1x/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 1,
                dosePerKgMax: 2,
                concentration: 3, // 3mg/ml
                maxDailyDose: 10,
                frequency: 1,
                duration: 5
            },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Dexametasona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-4mg 1x/dia" },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4-8mg 1x/dia" },
            {
                dosage: "0.1", unit: "mg/ml", format: "Elixir",
                commonDose: "0.1-0.3mg/kg/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 0.1,
                dosePerKgMax: 0.3,
                concentration: 0.1, // 0.1mg/ml
                maxDailyDose: 16,
                frequency: 1
            },
            { dosage: "0.1%", unit: "", format: "Creme", commonDose: "Aplicar 2-3x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Betametasona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-2mg 1x/dia" },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ANTIBIÓTICOS ADICIONAIS
    {
        name: "Amoxicilina + Clavulanato",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500+125", unit: "mg", format: "Comprimido", commonDose: "500+125mg 8/8h", duration: 7 },
            { dosage: "875+125", unit: "mg", format: "Comprimido", commonDose: "875+125mg 12/12h", duration: 7 },
            // Apresentações pediátricas
            {
                dosage: "250+62.5", unit: "mg/5ml", format: "Suspensão",
                commonDose: "25-45mg/kg/dia (Amox) dividido 12/12h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 45,
                concentration: 50, // 250mg/5ml = 50mg/ml (Amoxicilina)
                maxDailyDose: 1750,
                frequency: 2
            },
            {
                dosage: "400+57", unit: "mg/5ml", format: "Suspensão",
                commonDose: "25-45mg/kg/dia (Amox) dividido 12/12h",
                indication: "Uso pediátrico - alta concentração",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 45,
                concentration: 80, // 400mg/5ml = 80mg/ml (Amoxicilina)
                maxDailyDose: 1750,
                frequency: 2
            },
        ],
        commonFrequencies: ["8h em 8h", "12h em 12h"],
    },
    {
        name: "Levofloxacino",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1x/dia", duration: 7 },
            { dosage: "750", unit: "mg", format: "Comprimido", commonDose: "750mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Cefalexina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Cápsula", commonDose: "500mg 6/6h", duration: 7 },
            { dosage: "1000", unit: "mg", format: "Comprimido", commonDose: "1g 12/12h", duration: 7 },
            // Apresentação pediátrica
            {
                dosage: "250", unit: "mg/5ml", format: "Suspensão",
                commonDose: "25-50mg/kg/dia dividido 6/6h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 50, // 250mg/5ml = 50mg/ml
                maxDailyDose: 4000,
                frequency: 4,
                duration: 7
            },
        ],
        commonFrequencies: ["6h em 6h", "12h em 12h"],
    },
    {
        name: "Ceftriaxona",
        category: "Antibiótico",
        route: "injetavel",
        presentations: [
            { dosage: "500", unit: "mg", format: "Injeção", commonDose: "500mg-1g 1x/dia IM/IV" },
            { dosage: "1000", unit: "mg", format: "Injeção", commonDose: "1-2g 1x/dia IM/IV" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfametoxazol + Trimetoprima",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "400+80", unit: "mg", format: "Comprimido", commonDose: "800+160mg 12/12h", duration: 10 },
            { dosage: "800+160", unit: "mg", format: "Comprimido", commonDose: "800+160mg 12/12h", duration: 10 },
            // Apresentação pediátrica
            {
                dosage: "200+40", unit: "mg/5ml", format: "Suspensão",
                commonDose: "40-50mg/kg/dia (SMZ) dividido 12/12h",
                indication: "Uso pediátrico (>2 meses)",
                isPediatric: true,
                dosePerKg: 40,
                dosePerKgMax: 50,
                concentration: 40, // 200mg SMZ/5ml = 40mg/ml
                maxDailyDose: 1600,
                frequency: 2,
                duration: 10
            },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "Contraindicado em menores de 2 meses",
    },
    {
        name: "Metronidazol",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 8/8h", duration: 7 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 8/8h", duration: 7 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 8/8h", duration: 7 },
            // Apresentação pediátrica
            {
                dosage: "40", unit: "mg/ml", format: "Suspensão",
                commonDose: "30-40mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 30,
                dosePerKgMax: 40,
                concentration: 40, // 40mg/ml
                maxDailyDose: 2000,
                frequency: 3,
                duration: 7
            },
        ],
        commonFrequencies: ["8h em 8h"],
        notes: "Evitar álcool durante o tratamento",
    },
    {
        name: "Clindamicina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150-300mg 6/6h", duration: 7 },
            { dosage: "300", unit: "mg", format: "Cápsula", commonDose: "300-600mg 6/6h", duration: 7 },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
    },
    // GASTROPROTETORES ADICIONAIS
    {
        name: "Esomeprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Lansoprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "15", unit: "mg", format: "Cápsula", commonDose: "15mg 1x/dia" },
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Ranitidina",
        category: "Antagonista H2",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 2x/dia" },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Domperidona",
        category: "Procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia" },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Tomar 15-30min antes das refeições",
    },
    {
        name: "Metoclopramida",
        category: "Procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia" },
            {
                dosage: "4", unit: "mg/ml", format: "Gotas",
                commonDose: "10-15 gotas 3x/dia",
                isPediatric: true,
                dosePerKg: 0.5,
                concentration: 4,
                frequency: 3
            },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Tomar 30min antes das refeições",
    },
    // TIREOIDE ADICIONAL
    {
        name: "Propiltiouracil",
        category: "Antitireoidiano",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-150mg 3x/dia", duration: 30, indication: "Hipertireoidismo" },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Metimazol",
        category: "Antitireoidiano",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-20mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-30mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIALÉRGICOS ADICIONAIS
    {
        name: "Desloratadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 5 },
            {
                dosage: "0.5", unit: "mg/ml", format: "Xarope",
                commonDose: "2.5-5ml 1x/dia", duration: 5,
                suggestedDose: "2.5", suggestedUnit: "ml",
                isPediatric: true
            },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Cetirizina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Fexofenadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "120", unit: "mg", format: "Comprimido", commonDose: "120mg 1x/dia", duration: 5 },
            { dosage: "180", unit: "mg", format: "Comprimido", commonDose: "180mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroxizina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2-3x/dia", duration: 5 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2-3x/dia", duration: 5 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Pode causar sonolência",
    },
    {
        name: "Prometazina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 1-3x/dia", duration: 5 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia"],
        notes: "Causa sonolência",
    },
    // ANTICOAGULANTES/ANTIAGREGANTES
    {
        name: "Clopidogrel",
        category: "Antiagregante",
        route: "oral",
        presentations: [
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Varfarina",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "Conforme INR", duration: 30 },
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "Conforme INR", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "2.5-10mg 1x/dia conforme INR", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Monitorar INR regularmente",
    },
    {
        name: "Rivaroxabana",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30, indication: "Profilaxia TVP" },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15mg 2x/dia", duration: 30, indication: "TEV fase aguda" },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30, indication: "FA, TEV manutenção" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar com alimentos",
    },
    {
        name: "Apixabana",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5mg 2x/dia", duration: 30, indication: "Dose reduzida" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    // UROLOGIA
    {
        name: "Sildenafila",
        category: "Disfunção Erétil",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg quando necessário", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg quando necessário", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg quando necessário", duration: 30 },
        ],
        commonFrequencies: ["Quando necessário"],
        notes: "Tomar 30-60min antes da atividade sexual",
    },
    {
        name: "Tadalafila",
        category: "Disfunção Erétil",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "Uso diário" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg quando necessário", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg quando necessário", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "Quando necessário"],
    },
    {
        name: "Finasterida",
        category: "Urologia",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30, indication: "Calvície" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "HPB" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Tansulosina",
        category: "Urologia",
        route: "oral",
        presentations: [
            { dosage: "0.4", unit: "mg", format: "Cápsula", commonDose: "0.4mg 1x/dia", duration: 30, indication: "HPB" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar após o café da manhã",
    },
    {
        name: "Doxazosina",
        category: "Urologia/Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4-8mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar ao deitar (pode causar hipotensão postural)",
    },
    // SUPLEMENTOS
    {
        name: "Carbonato de Cálcio",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 1-2x/dia", duration: 30 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 1-2x/dia", duration: 30 },
            { dosage: "1250", unit: "mg", format: "Comprimido", commonDose: "1250mg 1x/dia", duration: 30, indication: "= 500mg Ca elemento" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar com as refeições",
    },
    {
        name: "Vitamina D",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "1000", unit: "UI", format: "Comprimido", commonDose: "1000-2000 UI 1x/dia", duration: 30 },
            { dosage: "2000", unit: "UI", format: "Cápsula", commonDose: "2000 UI 1x/dia", duration: 30 },
            { dosage: "5000", unit: "UI", format: "Cápsula", commonDose: "5000 UI 1x/dia", duration: 30, indication: "Deficiência moderada" },
            { dosage: "7000", unit: "UI", format: "Cápsula", commonDose: "7000 UI 1x/semana", duration: 30 },
            { dosage: "50000", unit: "UI", format: "Cápsula", commonDose: "50000 UI 1x/semana", duration: 30, indication: "Deficiência grave" },
        ],
        commonFrequencies: ["1x ao dia", "1x por semana"],
    },
    {
        name: "Vitamina B12",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "1000", unit: "mcg", format: "Comprimido", commonDose: "1000mcg 1x/dia", duration: 30 },
            { dosage: "2500", unit: "mcg", format: "Comprimido", commonDose: "2500mcg 1x/dia", duration: 30 },
            { dosage: "5000", unit: "mcg", format: "Comprimido", commonDose: "5000mcg 1x/dia", duration: 30, indication: "Deficiência" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ácido Fólico",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "0.4", unit: "mg", format: "Comprimido", commonDose: "0.4mg 1x/dia", duration: 30, indication: "Gestação" },
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "Deficiência" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfato Ferroso",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg Fe", format: "Comprimido", commonDose: "40-80mg Fe 1-2x/dia", duration: 30 },
            { dosage: "60", unit: "mg Fe", format: "Comprimido", commonDose: "60mg Fe 1-2x/dia", duration: 30 },
            { dosage: "25", unit: "mg/ml", format: "Gotas", commonDose: "20-40 gotas 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum com vitamina C para melhor absorção",
    },
    // BENZODIAZEPÍNICOS ADICIONAIS
    {
        name: "Midazolam",
        category: "Ansiolítico/Sedativo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "7.5", unit: "mg", format: "Comprimido", commonDose: "7.5-15mg à noite", duration: 30 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15mg à noite", duration: 30 },
            { dosage: "5", unit: "mg/ml", format: "Ampola", commonDose: "Sedação/Indução (Hospitalar)", duration: 30 },
            { dosage: "1", unit: "mg/ml", format: "Ampola", commonDose: "Sedação leve", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Usar antes de procedimentos ou para insônia",
    },
    {
        name: "Diazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 2-3x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia", "Quando necessário"],
        notes: "Receita B1 (azul)",
    },
    {
        name: "Lorazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 2-3x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul)",
    },
    // ANTIPSICÓTICOS
    {
        name: "Clorpromazina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-100mg 2-3x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 2-3x/dia", duration: 30 },
            { dosage: "40", unit: "mg/ml", format: "Gotas", commonDose: "20-40 gotas 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita Especial (branca 2 vias). Causa fotossensibilidade",
    },
    {
        name: "Haloperidol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-5mg 2-3x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 2-3x/dia", duration: 30 },
            {
                dosage: "2", unit: "mg/ml", format: "Gotas",
                commonDose: "10-20 gotas 2-3x/dia", duration: 30,
                isPediatric: true,
                dosePerKg: 0.05,
                dosePerKgMax: 0.15,
                concentration: 2,
                frequency: 2
            },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita Especial (branca 2 vias)",
    },
    {
        name: "Risperidona",
        category: "Antipsicótico Atípico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 1-2x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1-2x/dia", duration: 30 },
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-6mg 1x/dia", duration: 30 },
            { dosage: "1", unit: "mg/ml", format: "Gotas", commonDose: "10-20 gotas 1-2x/dia", duration: 30, isPediatric: true },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Receita B1 (azul)",
    },
    {
        name: "Quetiapina",
        category: "Antipsicótico Atípico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1-2x/dia", duration: 30, indication: "Insônia, ansiedade" },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-300mg 2x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Receita B1 (azul)",
    },
    {
        name: "Olanzapina",
        category: "Antipsicótico Atípico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Pode causar ganho de peso",
    },
    // ANTICONVULSIVANTES
    {
        name: "Carbamazepina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 2-3x/dia", duration: 30 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 2-3x/dia", duration: 30 },
            {
                dosage: "20", unit: "mg/ml", format: "Suspensão",
                commonDose: "10-20ml 2-3x/dia", duration: 30,
                isPediatric: true,
                dosePerKg: 15,
                dosePerKgMax: 20,
                concentration: 20,
                frequency: 2
            },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1. Monitorar hemograma e função hepática",
    },
    {
        name: "Fenitoína",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 3x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Receita B1. Monitorar níveis séricos",
    },
    {
        name: "Ácido Valproico",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "250", unit: "mg", format: "Cápsula", commonDose: "250-500mg 2-3x/dia", duration: 30 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1. Evitar na gestação",
    },
    // ANTIEMÉTICOS E OUTROS
    {
        name: "Prometazina",
        category: "Anti-histamínico/Antiemético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1-3x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia", "Quando necessário"],
        notes: "Causa sonolência",
    },
    {
        name: "Metoclopramida",
        category: "Antiemético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 5 },
            {
                dosage: "4", unit: "mg/ml", format: "Gotas",
                commonDose: "20-40 gotas 3x/dia", duration: 5,
                isPediatric: true,
                dosePerKg: 0.5,
                concentration: 4,
                frequency: 3
            },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Tomar 30min antes das refeições",
    },
    {
        name: "Ondansetrona",
        category: "Antiemético",
        route: "oral",
        presentations: [
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4-8mg 2-3x/dia", duration: 5 },
            { dosage: "8", unit: "mg", format: "Comprimido", commonDose: "8mg 2-3x/dia", duration: 5 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    // CORTICOIDES


    // RELAXANTES MUSCULARES
    {
        name: "Ciclobenzaprina",
        category: "Relaxante Muscular",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 3x/dia", duration: 5 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 5 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Pode causar sonolência",
    },
    // OPIOIDES (Receita A)
    {
        name: "Tramadol",
        category: "Analgésico Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50-100mg 4-6x/dia", duration: 5 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 2-3x/dia", duration: 5, indication: "Liberação prolongada" },
            { dosage: "100", unit: "mg/ml", format: "Gotas", commonDose: "20-40 gotas 4-6x/dia", duration: 5 },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "Receita de Controle Especial (Branca 2 vias). Dose máxima 400mg/dia",
    },
    {
        name: "Codeína",
        category: "Analgésico Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-60mg 4-6x/dia", duration: 5 },
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 4-6x/dia", duration: 5 },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "Receita A (amarela)",
    },
    // MEDICAMENTOS PARA TDAH (Receita A)
    {
        name: "Metilfenidato",
        category: "Psicoestimulante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1-3x/dia", duration: 30, indication: "Ritalina" },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1-2x/dia", duration: 30, indication: "Liberação imediata" },
            { dosage: "18", unit: "mg", format: "Comprimido", commonDose: "18-54mg 1x/dia", duration: 30, indication: "Concerta LA" },
            { dosage: "36", unit: "mg", format: "Comprimido", commonDose: "36-54mg 1x/dia", duration: 30, indication: "Concerta LA" },
            { dosage: "54", unit: "mg", format: "Comprimido", commonDose: "54mg 1x/dia", duration: 30, indication: "Concerta LA" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Receita A (amarela). Tomar pela manhã. Evitar após 16h",
    },
    {
        name: "Lisdexanfetamina",
        category: "Psicoestimulante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30-70mg 1x/dia", duration: 30, indication: "Venvanse" },
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50-70mg 1x/dia", duration: 30 },
            { dosage: "70", unit: "mg", format: "Cápsula", commonDose: "70mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita A (amarela). Tomar pela manhã",
    },
    // OUTROS PSICOTRÓPICOS B1
    {
        name: "Clonazepam",
        category: "Benzodiazepínico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-2mg 1-2x/dia", duration: 30, indication: "Rivotril" },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 1-2x/dia", duration: 30 },
            { dosage: "2.5", unit: "mg/ml", format: "Gotas", commonDose: "5-20 gotas 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Receita B1 (azul). 1 gota = 0.1mg",
    },
    {
        name: "Bupropiona",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150-300mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Tomar pela manhã. Risco de convulsão em doses altas",
    },
    {
        name: "Venlafaxina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "37.5", unit: "mg", format: "Cápsula", commonDose: "37.5-75mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 1x/dia", duration: 30 },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150-225mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Liberação prolongada (XR). Tomar com alimento",
    },
    {
        name: "Duloxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30-60mg 1x/dia", duration: 30, indication: "Depressão, dor neuropática" },
            { dosage: "60", unit: "mg", format: "Cápsula", commonDose: "60-120mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul)",
    },
    {
        name: "Pregabalina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 2x/dia", duration: 30, indication: "Lyrica" },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150-300mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        notes: "Receita B1 (azul). Dor neuropática, fibromialgia",
    },
    {
        name: "Gabapentina",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "300", unit: "mg", format: "Cápsula", commonDose: "300-600mg 3x/dia", duration: 30 },
            { dosage: "400", unit: "mg", format: "Cápsula", commonDose: "400mg 3x/dia", duration: 30 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Dor neuropática, epilepsia",
    },
    {
        name: "Topiramato",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1-2x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 2x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Epilepsia, enxaqueca. Aumentar dose gradualmente",
    },
    {
        name: "Lamotrigina",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1-2x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Epilepsia, transtorno bipolar. Aumentar lentamente (risco de rash)",
    },
    {
        name: "Oxcarbazepina",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300-600mg 2x/dia", duration: 30 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600-1200mg 2x/dia", duration: 30 },
            {
                dosage: "60", unit: "mg/ml", format: "Suspensão",
                commonDose: "8-10mg/kg/dia", duration: 30,
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 10,
                concentration: 60,
                frequency: 2
            },
        ],
        commonFrequencies: ["2x ao dia"],
        notes: "Alternativa à carbamazepina",
    },
    {
        name: "Lítio",
        category: "Estabilizador de Humor",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300-600mg 2-3x/dia", duration: 30 },
            { dosage: "450", unit: "mg", format: "Comprimido", commonDose: "450-900mg 1-2x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul). Monitorar litemia (0.6-1.2 mEq/L)",
    },
    {
        name: "Aripiprazol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-15mg 1x/dia", duration: 30 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15-30mg 1x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita Especial (branca 2 vias). Esquizofrenia, bipolar, adjuvante em depressão",
    },
    {
        name: "Olanzapina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5-5mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita Especial (branca 2 vias). Risco metabólico (peso, glicemia)",
    },
    {
        name: "Clonidina",
        category: "Anti-hipertensivo/TDAH",
        route: "oral",
        presentations: [
            { dosage: "0.1", unit: "mg", format: "Comprimido", commonDose: "0.1-0.2mg 2-3x/dia", duration: 30, indication: "Atensina" },
            { dosage: "0.15", unit: "mg", format: "Comprimido", commonDose: "0.15-0.3mg 2-3x/dia", duration: 30 },
            { dosage: "0.2", unit: "mg", format: "Comprimido", commonDose: "0.2mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Adjuvante no TDAH, tics, abstinência. Pode causar hipotensão",
    },
    {
        name: "Atomoxetina",
        category: "Não estimulante TDAH",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Cápsula", commonDose: "10-40mg 1x/dia", duration: 30, indication: "Dose inicial" },
            { dosage: "18", unit: "mg", format: "Cápsula", commonDose: "18-60mg 1x/dia", duration: 30 },
            { dosage: "25", unit: "mg", format: "Cápsula", commonDose: "25-80mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40-80mg 1x/dia", duration: 30 },
            { dosage: "60", unit: "mg", format: "Cápsula", commonDose: "60-80mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Cápsula", commonDose: "80mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Strattera. Alternativa não controlada para TDAH",
    },
    // OUTROS MEDICAMENTOS COMUNS
    {
        name: "Omeprazol",
        category: "Antiulceroso",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Cápsula", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum, 30 min antes do café",
    },
    {
        name: "Pantoprazol",
        category: "Antiulceroso",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Esomeprazol",
        category: "Antiulceroso",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Levotiroxina",
        category: "Hormônio Tireoidiano",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mcg", format: "Comprimido", commonDose: "25-50mcg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mcg", format: "Comprimido", commonDose: "50-100mcg 1x/dia", duration: 30 },
            { dosage: "75", unit: "mcg", format: "Comprimido", commonDose: "75-100mcg 1x/dia", duration: 30 },
            { dosage: "88", unit: "mcg", format: "Comprimido", commonDose: "88-100mcg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mcg", format: "Comprimido", commonDose: "100-150mcg 1x/dia", duration: 30 },
            { dosage: "112", unit: "mcg", format: "Comprimido", commonDose: "112-125mcg 1x/dia", duration: 30 },
            { dosage: "125", unit: "mcg", format: "Comprimido", commonDose: "125-150mcg 1x/dia", duration: 30 },
            { dosage: "150", unit: "mcg", format: "Comprimido", commonDose: "150-200mcg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum, 30-60 min antes do café",
    },
    {
        name: "Clopidogrel",
        category: "Antiplaquetário",
        route: "oral",
        presentations: [
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Plavix. Prevenção eventos CV",
    },

    {
        name: "Espironolactona",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-100mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Aldactone. Poupar potássio",
    },
    {
        name: "Carvedilol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "3.125", unit: "mg", format: "Comprimido", commonDose: "3.125-6.25mg 2x/dia", duration: 30, indication: "Dose inicial IC" },
            { dosage: "6.25", unit: "mg", format: "Comprimido", commonDose: "6.25-12.5mg 2x/dia", duration: 30 },
            { dosage: "12.5", unit: "mg", format: "Comprimido", commonDose: "12.5-25mg 2x/dia", duration: 30 },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        notes: "IC, HAS. Tomar com alimentos",
    },
    {
        name: "Bisoprolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "1.25", unit: "mg", format: "Comprimido", commonDose: "1.25-2.5mg 1x/dia", duration: 30, indication: "Dose inicial IC" },
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2.5-5mg 1x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "IC, HAS",
    },
    {
        name: "Atenolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "HAS, arritmias",
    },
    {
        name: "Montelucaste",
        category: "Antiasmático",
        route: "oral",
        presentations: [
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30, indication: "Pediátrico 2-5 anos" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "Pediátrico 6-14 anos" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30, indication: "Adultos" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Singulair. Tomar à noite",
    },
    // MEDICAMENTOS DA FARMÁCIA BÁSICA - ADICIONAIS
    {
        name: "Acebrofilina",
        category: "Mucolítico",
        route: "oral",
        presentations: [
            {
                dosage: "5", unit: "mg/ml", format: "Xarope",
                commonDose: "5ml 2-3x/dia", duration: 30,
                indication: "Infantil",
                suggestedDose: "5",
                suggestedUnit: "ml",
                isPediatric: true,
                dosePerKg: 1.25,
                dosePerKgMax: 1.25,
                concentration: 5,
                frequency: 2
            },
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Ambroxol",
        category: "Mucolítico",
        route: "oral",
        presentations: [
            {
                dosage: "3", unit: "mg/ml", format: "Xarope",
                commonDose: "2.5-5ml 3x/dia", duration: 30,
                indication: "Infantil",
                suggestedDose: "5", suggestedUnit: "ml",
                isPediatric: true,
                dosePerKg: 0.75, // Approx for 2.5ml/10kg
                dosePerKgMax: 0.75,
                concentration: 3,
                frequency: 3
            },
            { dosage: "6", unit: "mg/ml", format: "Xarope", commonDose: "5-10ml 3x/dia", duration: 30, suggestedDose: "5", suggestedUnit: "ml" },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Aciclovir",
        category: "Antiviral",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 5x/dia", duration: 5 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 3x/dia", duration: 5 },
        ],
        commonFrequencies: ["5x ao dia", "3x ao dia"],
        notes: "Herpes simples e zoster",
    },
    {
        name: "Albendazol",
        category: "Antiparasitário",
        route: "oral",
        presentations: [
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg dose única", duration: 1 },
            { dosage: "40", unit: "mg/ml", format: "Suspensão", commonDose: "10ml dose única", suggestedDose: "10", suggestedUnit: "ml", isPediatric: true, dosePerKg: 10, dosePerKgMax: 10, concentration: 40, maxDailyDose: 400, frequency: 1, duration: 1 },
        ],
        commonFrequencies: ["Dose única"],
        notes: "Vermífugo. Tomar com alimentos",
    },
    {
        name: "Alopurinol",
        category: "Antigotoso",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-300mg 1x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Gota. Tomar após refeição",
    },
    {
        name: "Amiodarona",
        category: "Antiarrítmico",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Fibrilação atrial. Monitorar função tireoidiana",
    },


    {
        name: "Biperideno",
        category: "Antiparkinsoniano",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Efeitos extrapiramidais, Parkinson",
    },
    {
        name: "Escopolamina",
        category: "Antiespasmódico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 3-4x/dia", duration: 30, indication: "Buscopan" },
            {
                dosage: "10", unit: "mg/ml", format: "Gotas",
                commonDose: "20-40 gotas 3-4x/dia", duration: 30,
                isPediatric: true,
                dosePerKg: 1.5, // 0.5mg/kg/dose * 3 ?? Approx. 1 drop/kg/dose = 0.5mg/kg/dose. Daily = 1.5
                dosePerKgMax: 2,
                concentration: 10,
                frequency: 3
            },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia", "Quando necessário"],
        notes: "Cólicas abdominais",
    },
    {
        name: "Bromoprida",
        category: "Antiemético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 30 },
            { dosage: "4", unit: "mg/ml", format: "Gotas", commonDose: "1 gota/kg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Náuseas, vômitos. Tomar antes das refeições",
    },
    {
        name: "Budesonida",
        category: "Corticoide Inalatório",
        route: "inalatória",
        presentations: [
            { dosage: "32", unit: "mcg/dose", format: "Spray Nasal", commonDose: "1-2 jatos 1-2x/dia", duration: 30 },
            { dosage: "50", unit: "mcg/dose", format: "Spray Nasal", commonDose: "1-2 jatos 1-2x/dia", duration: 30 },
            { dosage: "200", unit: "mcg/dose", format: "Aerossol", commonDose: "1-2 inalações 2x/dia", duration: 30, indication: "Asma" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Captopril",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2-3x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Tomar 1h antes das refeições",
    },
    {
        name: "Carbonato de Cálcio",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500-1000mg 1-2x/dia", duration: 30 },
            { dosage: "600", unit: "mg + Vit D", format: "Comprimido", commonDose: "1cp 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar com alimentos. Osteoporose",
    },

    {
        name: "Ciclobenzaprina",
        category: "Relaxante Muscular",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 3x/dia", duration: 5 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 5 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Miosan. Pode causar sonolência",
    },
    {
        name: "Cinarizina",
        category: "Vasodilatador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-75mg 3x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia"],
        notes: "Labirintite, vertigem",
    },
    {
        name: "Colchicina",
        category: "Antigotoso",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-1mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Crise de gota aguda",
    },
    {
        name: "Dexclorfeniramina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 3-4x/dia", duration: 5 },
            {
                dosage: "0.4", unit: "mg/ml", format: "Xarope",
                commonDose: "2-5 anos: 2,5ml 8/8h | 6-11 anos: 5ml 6-8h", duration: 5,
                suggestedDose: "2.5", suggestedUnit: "ml",
                isPediatric: true,
                isAgeBased: true,
                ageRanges: [
                    { minAge: 2, maxAge: 5, dose: 2.5, unit: "ml", frequency: "8/8h", indication: "2-5 anos" },
                    { minAge: 6, maxAge: 11, dose: 5, unit: "ml", frequency: "6-8h", indication: "6-11 anos" },
                    { minAge: 12, maxAge: 17, dose: 5, unit: "ml", frequency: "6-8h", indication: "≥12 anos (pode usar até 10ml)" }
                ],
                concentration: 0.4,
                frequency: 3
            },
        ],
        commonFrequencies: ["8h em 8h", "6h em 6h"],
        notes: "Polaramine. Dose pediátrica conforme idade. Pode causar sonolência",
    },
    {
        name: "Diclofenaco",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2-3x/dia", duration: 5 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 5, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Tomar após refeições",
    },
    {
        name: "Digoxina",
        category: "Cardiotônico",
        route: "oral",
        presentations: [
            { dosage: "0.25", unit: "mg", format: "Comprimido", commonDose: "0.125-0.25mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "IC, FA. Monitorar nível sérico",
    },
    {
        name: "Doxazosina",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4-8mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "HAS, HPB. Tomar à noite (hipotensão postural)",
    },
    {
        name: "Fenobarbital",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 30 },
            {
                dosage: "40", unit: "mg/ml", format: "Gotas",
                commonDose: "3-5mg/kg/dia", duration: 30,
                indication: "Pediátrico",
                isPediatric: true,
                dosePerKg: 4,
                dosePerKgMax: 5,
                concentration: 40,
                frequency: 2
            },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Gardenal. Tomar à noite",
    },
    {
        name: "Finasterida",
        category: "Antiandrógeno",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "HPB" },
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30, indication: "Calvície" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Fluconazol",
        category: "Antifúngico",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150mg dose única", duration: 1, indication: "Candidíase vaginal" },
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100-200mg 1x/dia", duration: 7 },
        ],
        commonFrequencies: ["Dose única", "1x ao dia"],
    },
    {
        name: "Hidralazina",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg 2-4x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 3-4x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia", "4x ao dia"],
    },
    {
        name: "Hidróxido de Alumínio",
        category: "Antiácido",
        route: "oral",
        presentations: [
            { dosage: "61.5", unit: "mg/ml", format: "Suspensão", commonDose: "10-20ml 3-4x/dia", duration: 30, suggestedDose: "5", suggestedUnit: "ml", isPediatric: true },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "Tomar 1h após refeições",
    },
    {
        name: "Imipramina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-75mg 1-3x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Comprimido", commonDose: "75-150mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia"],
        notes: "Receita Especial (branca 2 vias). Tofranil",
    },
    {
        name: "Isossorbida",
        category: "Vasodilatador",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg sublingual SOS", duration: 30, indication: "Dinitrato - sublingual" },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 2-3x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia", "Quando necessário"],
        notes: "Angina. Manter intervalo de 12h sem medicação",
    },
    {
        name: "Ivermectina",
        category: "Antiparasitário",
        route: "oral",
        presentations: [
            { dosage: "6", unit: "mg", format: "Comprimido", commonDose: "200mcg/kg dose única", duration: 30 },
        ],
        commonFrequencies: ["Dose única"],
        notes: "Escabiose, pediculose. Em jejum",
    },
    {
        name: "Loratadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
            { dosage: "1", unit: "mg/ml", format: "Xarope", commonDose: "10ml 1x/dia", duration: 30, suggestedDose: "10", suggestedUnit: "ml" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Não sedativo. Claritin",
    },
    {
        name: "Fexofenadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "120", unit: "mg", format: "Comprimido", commonDose: "120mg 1x/dia", duration: 30 },
            { dosage: "180", unit: "mg", format: "Comprimido", commonDose: "180mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Allegra. Não sedativo",
    },
    {
        name: "Metildopa",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 2-3x/dia", duration: 30 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Seguro na gestação",
    },
    {
        name: "Metoprolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-100mg 1-2x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50-100mg 1-2x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Seloken. IC, HAS",
    },
    {
        name: "Metronidazol",
        category: "Antimicrobiano",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 3x/dia", duration: 7 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1x/dia", duration: 5 },
            {
                dosage: "600", unit: "mg", format: "Suspensão",
                commonDose: "10mg/kg/dia 1x/dia", duration: 5,
                indication: "Pediátrico",
                isPediatric: true,
                dosePerKg: 30,
                concentration: 40,
                frequency: 3
            },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Flagyl. Não ingerir álcool",
    },
    {
        name: "Nifedipino",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 3x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-60mg 1x/dia", duration: 30, indication: "Retard" },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30-60mg 1x/dia", duration: 30, indication: "Retard" },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia"],
    },
    {
        name: "Nortriptilina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Cápsula", commonDose: "25-75mg 1x/dia", duration: 30 },
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50-100mg 1x/dia", duration: 30 },
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita B1 (azul). Pamelor",
    },
    {
        name: "Nitrofurantoína",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 4x/dia", duration: 7, indication: "ITU" },
        ],
        commonFrequencies: ["4x ao dia", "6h em 6h"],
        notes: "Macrodantina. Tomar com alimentos",
    },
    {
        name: "Nistatina",
        category: "Antifúngico",
        route: "oral",
        presentations: [
            { dosage: "100.000", unit: "UI/ml", format: "Suspensão", commonDose: "4-6ml 4x/dia", duration: 7, suggestedDose: "4", suggestedUnit: "ml", isPediatric: true },
        ],
        commonFrequencies: ["4x ao dia"],
        notes: "Candidíase oral. Bochechar e engolir",
    },

    {
        name: "Salbutamol",
        category: "Broncodilatador",
        route: "inalatória",
        presentations: [
            { dosage: "100", unit: "mcg/dose", format: "Aerossol", commonDose: "1-2 jatos 4-6x/dia", duration: 30 },
            { dosage: "0.4", unit: "mg/ml", format: "Xarope", commonDose: "5ml 3-4x/dia", duration: 30, suggestedDose: "5", suggestedUnit: "ml" },
        ],
        commonFrequencies: ["Quando necessário", "4x ao dia"],
        notes: "Aerolin. Broncoespasmo agudo",
    },
    // CORTICOIDES INALATÓRIOS / BRONCODILATADORES
    {
        name: "Budesonida",
        category: "Corticoide Inalatório",
        route: "inalatória",
        presentations: [
            { dosage: "32", unit: "mcg", format: "Aerossol", commonDose: "1-2 jatos 1-2x/dia (Nasal)", duration: 30, indication: "Rinite" },
            { dosage: "50", unit: "mcg", format: "Aerossol", commonDose: "1-2 jatos 1-2x/dia (Nasal)", duration: 30, indication: "Rinite" },
            { dosage: "200", unit: "mcg", format: "Cápsula Inalatória", commonDose: "1 cápsula 12/12h (Oral)", duration: 30, indication: "Asma/DPOC" },
            { dosage: "400", unit: "mcg", format: "Cápsula Inalatória", commonDose: "1 cápsula 12/12h (Oral)", duration: 30, indication: "Asma/DPOC" },
            { dosage: "0.25", unit: "mg/ml", format: "Suspensão", commonDose: "Nebulização: 1-2ml 12/12h", duration: 30, indication: "Nebulização" },
        ],
        commonFrequencies: ["12h em 12h", "1x ao dia"],
    },
    {
        name: "Beclometasona",
        category: "Corticoide Inalatório",
        route: "inalatória",
        presentations: [
            { dosage: "50", unit: "mcg", format: "Jatos", commonDose: "1-2 jatos 12/12h (Oral)", duration: 30, indication: "Asma" },
            { dosage: "250", unit: "mcg", format: "Jatos", commonDose: "1-2 jatos 12/12h (Oral)", duration: 30, indication: "Asma" },
            { dosage: "50", unit: "mcg", format: "Jatos", commonDose: "1-2 jatos em cada narina 12/12h (Nasal)", duration: 30, indication: "Rinite" },
        ],
        commonFrequencies: ["12h em 12h"],
    },
    {
        name: "Brometo de Ipratrópio",
        category: "Anticolinérgico",
        route: "inalatória",
        presentations: [
            { dosage: "0.25", unit: "mg/ml", format: "Gotas", commonDose: "20-40 gotas por nebulização 3-4x/dia", duration: 30, indication: "Atrovent Gotas" },
            { dosage: "20", unit: "mcg", format: "Jatos", commonDose: "2 jatos 4x/dia", duration: 30, indication: "Atrovent Spray" },
        ],
        commonFrequencies: ["4x ao dia", "6h em 6h"],
    },
    {
        name: "Fenoterol",
        category: "Broncodilatador",
        route: "inalatória",
        presentations: [
            { dosage: "5", unit: "mg/ml", format: "Gotas", commonDose: "5-10 gotas por nebulização", duration: 30, indication: "Berotec" },
            { dosage: "100", unit: "mcg", format: "Jatos", commonDose: "1-2 jatos se crise", duration: 30, indication: "Berotec Spray" },
        ],
        commonFrequencies: ["Quando necessário", "4x ao dia"],
        notes: "CUIDADO: risco de taquicardia. Monitorar frequência cardíaca.",
    },
    {
        name: "Formoterol + Budesonida",
        category: "Associação Inalatória",
        route: "inalatória",
        presentations: [
            { dosage: "6/200", unit: "mcg", format: "Cápsula Inalatória", commonDose: "1 cápsula 12/12h", duration: 30, indication: "Alenia 6/200" },
            { dosage: "12/400", unit: "mcg", format: "Cápsula Inalatória", commonDose: "1 cápsula 12/12h", duration: 30, indication: "Alenia 12/400" },
        ],
        commonFrequencies: ["12h em 12h"],
    },
    {
        name: "Salmeterol + Fluticasona",
        category: "Associação Inalatória",
        route: "inalatória",
        presentations: [
            { dosage: "25/125", unit: "mcg", format: "Jatos", commonDose: "2 jatos 12/12h", duration: 30, indication: "Seretide Spray" },
            { dosage: "50/250", unit: "mcg", format: "Pó Inalatório", commonDose: "1 inalação 12/12h", duration: 30, indication: "Seretide Diskus" },
        ],
        commonFrequencies: ["12h em 12h"],
    },
    {
        name: "Simeticona",
        category: "Antiflatulento",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 3-4x/dia", duration: 30 },
            { dosage: "75", unit: "mg/ml", format: "Gotas", commonDose: "8-12 gotas 3x/dia", duration: 30, isPediatric: true },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "Luftal. Gases intestinais",
    },

    {
        name: "Sulfato Ferroso",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg Fe elem.", format: "Comprimido", commonDose: "1-2cp 1x/dia", duration: 30 },
            { dosage: "25", unit: "mg/ml", format: "Gotas", commonDose: "1 gota/kg/dia", duration: 30, indication: "Pediátrico" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum com suco de laranja. Pode escurecer fezes",
    },
    {
        name: "Tiamina",
        category: "Vitamina B1",
        route: "oral",
        presentations: [
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Reposição em alcoolistas",
    },
    {
        name: "Varfarina",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "Dose conforme INR", duration: 30 },
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "Dose conforme INR", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Marevan. Monitorar INR. Mesmo horário todo dia",
    },
    {
        name: "Verapamil",
        category: "Bloqueador de Canal de Cálcio",
        route: "oral",
        presentations: [
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80-120mg 3x/dia", duration: 30 },
            { dosage: "120", unit: "mg", format: "Comprimido", commonDose: "120-240mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },
    {
        name: "Nitazoxanida",
        category: "Antiparasitário",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 12/12h", duration: 3 },
            {
                dosage: "20", unit: "mg/ml", format: "Suspensão",
                commonDose: "7.5ml 12/12h", duration: 3,
                indication: "Annita Pediátrico",
                isPediatric: true,
                dosePerKg: 15,
                concentration: 20,
                frequency: 2
            },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "Annita. Diarreias infecciosas",
    },
    {
        name: "Brometo de Ipratrópio",
        category: "Broncodilatador",
        route: "inalatória",
        presentations: [
            { dosage: "0.25", unit: "mg/ml", format: "Solução Inalação", commonDose: "20-40 gotas 3-4x/dia", duration: 30 },
            { dosage: "20", unit: "mcg/dose", format: "Aerossol", commonDose: "2 jatos 3-4x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "Atrovent. Para nebulização",
    },
    {
        name: "Fenoterol",
        category: "Broncodilatador",
        route: "inalatória",
        presentations: [
            { dosage: "5", unit: "mg/ml", format: "Gotas", commonDose: "8-10 gotas para nebulização", duration: 30 },
            { dosage: "100", unit: "mcg/dose", format: "Aerossol", commonDose: "1-2 jatos 3-4x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia", "Quando necessário"],
        notes: "Berotec. Para nebulização ou inalação",
    },
    {
        name: "Complexo B",
        category: "Vitaminas",
        route: "oral",
        presentations: [
            { dosage: "Polivitamínico", unit: "", format: "Comprimido", commonDose: "1-2cp 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // MEDICAMENTOS REMUME - ADICIONAIS
    {
        name: "Aminofilina",
        category: "Broncodilatador",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 3-4x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "DPOC, asma",
    },
    {
        name: "Bromazepam",
        category: "Benzodiazepínico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-6mg 1-3x/dia", duration: 30 },
            { dosage: "6", unit: "mg", format: "Comprimido", commonDose: "6mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul). Lexotan. Ansiedade",
    },
    {
        name: "Cetoconazol",
        category: "Antifúngico",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200-400mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Micoses sistêmicas. Tomar com alimentos",
    },
    {
        name: "Citalopram",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Receita Especial (branca 2 vias). Tomar pela manhã",
    },
    {
        name: "Claritromicina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 12/12h", duration: 7 },
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250mg 12/12h", duration: 30 },
            {
                dosage: "25", unit: "mg/ml", format: "Suspensão",
                commonDose: "7.5mg/kg 12/12h", duration: 30,
                indication: "Pediátrico",
                isPediatric: true,
                dosePerKg: 15, // 7.5 * 2
                dosePerKgMax: 15,
                concentration: 25,
                frequency: 2
            },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "Infecções respiratórias, H. pylori",
    },
    {
        name: "Escopolamina + Dipirona",
        category: "Antiespasmódico",
        route: "oral",
        presentations: [
            { dosage: "10/250", unit: "mg", format: "Comprimido", commonDose: "1cp 3-4x/dia", duration: 30, indication: "Buscopan Composto" },
            { dosage: "20/2500", unit: "mg/5ml", format: "Ampola", commonDose: "1 ampola EV lenta", duration: 30, indication: "Buscopan Composto Inj" },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia", "Quando necessário"],
        notes: "Cólicas com dor",
    },
    {
        name: "Glimepirida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1-2mg 1x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "DM2. Tomar antes do café",
    },
    {
        name: "Levodopa + Benserazida",
        category: "Antiparkinsoniano",
        route: "oral",
        presentations: [
            { dosage: "100/25", unit: "mg", format: "Cápsula", commonDose: "1cp 3-4x/dia", duration: 30, indication: "Prolopa" },
            { dosage: "200/50", unit: "mg", format: "Comprimido", commonDose: "1cp 3-4x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "Parkinson. Tomar longe de refeições proteicas",
    },
    {
        name: "Levodopa + Carbidopa",
        category: "Antiparkinsoniano",
        route: "oral",
        presentations: [
            { dosage: "250/25", unit: "mg", format: "Comprimido", commonDose: "1cp 3-4x/dia", duration: 30, indication: "Sinemet" },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia"],
        notes: "Parkinson. Tomar longe de refeições proteicas",
    },
    {
        name: "Levomepromazina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-100mg 1-3x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1-2x/dia", duration: 30 },
            {
                dosage: "40", unit: "mg/ml", format: "Gotas",
                commonDose: "15-30 gotas 1-3x/dia", duration: 30,
                isPediatric: true,
                dosePerKg: 1, // 1mg/kg/dia ? 1 gota = 1mg. 20kg -> 20mg -> 20 gotas. Correct.
                dosePerKgMax: 3,
                concentration: 40,
                frequency: 3
            },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Receita B1 (azul). Neozine. Sedativo potente",
    },
    {
        name: "Lidocaína",
        category: "Anestésico Local",
        route: "tópica",
        presentations: [
            { dosage: "2%", unit: "", format: "Gel", commonDose: "Aplicar localmente", duration: 30 },
            { dosage: "10%", unit: "", format: "Spray", commonDose: "1-3 jatos localmente", duration: 30 },
        ],
        commonFrequencies: ["Quando necessário"],
        notes: "Anestesia tópica, procedimentos",
    },
    {
        name: "Miconazol",
        category: "Antifúngico",
        route: "tópica",
        presentations: [
            { dosage: "2%", unit: "", format: "Creme Vaginal", commonDose: "1 aplicação à noite", duration: 7 },
            { dosage: "2%", unit: "", format: "Creme", commonDose: "Aplicar 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Candidíase vaginal e cutânea",
    },
    {
        name: "Neomicina + Bacitracina",
        category: "Antibiótico Tópico",
        route: "tópica",
        presentations: [
            { dosage: "5mg/250UI", unit: "/g", format: "Pomada", commonDose: "Aplicar 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Nebacetin. Feridas pequenas",
    },
    {
        name: "Óleo Mineral",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "100%", unit: "", format: "Líquido", commonDose: "15-30ml 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Constipação. Tomar à noite",
    },
    {
        name: "Permetrina",
        category: "Antiparasitário",
        route: "tópica",
        presentations: [
            { dosage: "1%", unit: "", format: "Loção", commonDose: "Aplicar do pescoço aos pés, lavar após 8-14h", duration: 30 },
            { dosage: "5%", unit: "", format: "Loção", commonDose: "Aplicar e lavar após 8-14h", duration: 30 },
        ],
        commonFrequencies: ["Dose única"],
        notes: "Escabiose, pediculose. Repetir em 7 dias se necessário",
    },
    {
        name: "Sais para Reidratação Oral",
        category: "Reidratante",
        route: "oral",
        presentations: [
            { dosage: "27.9", unit: "g", format: "Envelope", commonDose: "1 envelope em 1L de água", duration: 30 },
        ],
        commonFrequencies: ["Conforme desidratação"],
        notes: "Diarreia. Tomar em pequenas quantidades",
    },
    {
        name: "Sulfadiazina de Prata",
        category: "Antibiótico Tópico",
        route: "tópica",
        presentations: [
            { dosage: "1%", unit: "", format: "Creme", commonDose: "Aplicar 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Queimaduras. Trocar curativo diariamente",
    },
    {
        name: "Tartarato de Brimonidina",
        category: "Antiglaucomatoso",
        route: "oftálmica",
        presentations: [
            { dosage: "0.2%", unit: "", format: "Colírio", commonDose: "1 gota 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Glaucoma. Alphagan",
    },
    {
        name: "Timolol",
        category: "Antiglaucomatoso",
        route: "oftálmica",
        presentations: [
            { dosage: "0.5%", unit: "", format: "Colírio", commonDose: "1 gota 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        notes: "Glaucoma. Beta-bloqueador ocular",
    },
    {
        name: "Cetoprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50mg 3x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 2x/dia", duration: 30 },
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 1x/dia", duration: 30, indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Profenid. Tomar com alimentos",
    },
    {
        name: "Hidrocortisona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1-2x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Cortef. Insuficiência adrenal",
    },
    // CORTICOIDES E ANTIBIÓTICOS TÓPICOS

    {
        name: "Betametasona",
        category: "Corticoide Tópico",
        route: "tópica",
        presentations: [
            { dosage: "0.1%", unit: "", format: "Creme", commonDose: "Aplicar 1-2x/dia", duration: 30 },
            { dosage: "0.1%", unit: "", format: "Pomada", commonDose: "Aplicar 1-2x/dia", duration: 30 },
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0.5-2mg 1x/dia", duration: 30, indication: "Uso Oral" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Hidrocortisona",
        category: "Corticoide Tópico",
        route: "tópica",
        presentations: [
            { dosage: "1%", unit: "", format: "Creme", commonDose: "Aplicar 2-3x/dia", duration: 30 },
            { dosage: "1%", unit: "", format: "Pomada", commonDose: "Aplicar 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Dermatite leve.",
    },
    {
        name: "Mupirocina",
        category: "Antibiótico Tópico",
        route: "tópica",
        presentations: [
            { dosage: "2%", unit: "", format: "Pomada", commonDose: "Aplicar 3x/dia", duration: 7 },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Impetigo, infecções de pele.",
    },
    {
        name: "Cetoconazol",
        category: "Antifúngico Tópico",
        route: "tópica",
        presentations: [
            { dosage: "2%", unit: "", format: "Creme", commonDose: "Aplicar 1-2x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 1x/dia", duration: 30, indication: "Uso Oral" },
            { dosage: "2%", unit: "", format: "Xampu", commonDose: "Aplicar 2-3x/semana", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Micoses de pele e couro cabeludo.",
    },
    {
        name: "Morfina",
        category: "Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-30mg 4-6x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30mg 4-6x/dia", duration: 30 },
            { dosage: "10", unit: "mg/ml", format: "Solução", commonDose: "10-30mg 4-6x/dia", duration: 30 },
        ],
        commonFrequencies: ["4x ao dia", "6x ao dia", "4h em 4h"],
        notes: "Receita A (amarela). Dor severa, cuidados paliativos",
    },
    {
        name: "Epinefrina",
        category: "Simpatomimético",
        route: "parenteral",
        presentations: [
            { dosage: "1", unit: "mg/ml", format: "Ampola", commonDose: "0.3-0.5mg IM/SC", duration: 30, indication: "Adrenalina" },
        ],
        commonFrequencies: ["Emergência"],
        notes: "Anafilaxia, PCR. Via IM no vasto lateral da coxa",
    },
    {
        name: "Xarope de Guaco",
        category: "Fitoterápico",
        route: "oral",
        presentations: [
            { dosage: "7", unit: "mg/ml", format: "Xarope", commonDose: "5-10ml 3x/dia", duration: 30, suggestedDose: "5", suggestedUnit: "ml", isPediatric: true },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Tosse, bronquite",
    },
    {
        name: "Espinheira Santa",
        category: "Fitoterápico",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Cápsula", commonDose: "1-2cp 2-3x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Gastrite, dispepsia",
    },
    {
        name: "Flufenazina",
        category: "Antipsicótico",
        route: "parenteral",
        isControlled: true,
        prescriptionType: 'C1',
        presentations: [
            { dosage: "25", unit: "mg/ml", format: "Ampola", commonDose: "12.5-25mg IM a cada 2-4 semanas", duration: 30 },
        ],
        commonFrequencies: ["A cada 2-4 semanas"],
        notes: "Receita Especial (branca 2 vias). Anatensol Depot. Manutenção esquizofrenia",
    },

    // LAXANTES
    {
        name: "Bisacodil",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg à noite", duration: 30 },
            { dosage: "10", unit: "mg", format: "Supositório", commonDose: "1 supositório por dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Efeito em 6-12h (oral) ou 15-60min (retal)",
    },
    {
        name: "Lactulose",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "667", unit: "mg/ml", format: "Xarope", commonDose: "15-30ml 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Ajustar dose conforme resposta",
    },
    {
        name: "Picossulfato de Sódio",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Cápsula", commonDose: "5-10mg à noite", duration: 30, indication: "Pérolas" },
            { dosage: "7.5", unit: "mg/ml", format: "Gotas", commonDose: "10-20 gotas à noite", duration: 30, suggestedDose: "10", suggestedUnit: "gotas" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sene",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "46", unit: "mg/ml", format: "Solução", commonDose: "5-10ml à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Macrogol",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "4", unit: "g", format: "Sachê", commonDose: "1-2 sachês/dia", duration: 30, indication: "Pediátrico" },
            { dosage: "10", unit: "g", format: "Sachê", commonDose: "1-2 sachês/dia", duration: 30, indication: "Adulto" },
            { dosage: "14", unit: "g", format: "Sachê", commonDose: "1 sachê/dia", duration: 30, indication: "Muvinlax" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Dissolver em água",
    },
    {
        name: "Glicerina",
        category: "Laxante",
        route: "retal",
        presentations: [
            { dosage: "1", unit: "unidade", format: "Supositório", commonDose: "1 supositório se necessário", duration: 30 },
            { dosage: "12", unit: "%", format: "Enema", commonDose: "1 enema se necessário", duration: 30, indication: "Clister" },
        ],
        commonFrequencies: ["Quando necessário"],
    },
    {
        name: "Fosfato de Sódio",
        category: "Laxante",
        route: "retal",
        presentations: [
            { dosage: "133", unit: "ml", format: "Enema", commonDose: "1 frasco dose única", duration: 30, indication: "Fleet Enema" },
        ],
        commonFrequencies: ["Dose única"],
    },
    {
        name: "Óleo Mineral",
        category: "Laxante",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "%", format: "Solução", commonDose: "15-30ml à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Risco de aspiração",
    },
    {
        name: "Simeticona",
        category: "Antigases",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-120mg 3-4x/dia", duration: 30 },
            { dosage: "125", unit: "mg", format: "Cápsula", commonDose: "125mg 3-4x/dia", duration: 30 },
            { dosage: "75", unit: "mg/ml", format: "Gotas", commonDose: "15-30 gotas 3-4x/dia", duration: 30, suggestedDose: "15", suggestedUnit: "gotas" },
        ],
        commonFrequencies: ["3x ao dia", "4x ao dia", "Quando necessário"],
    },
    // VACINAS
    {
        name: "Vacina Influenza (Gripe)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM (Dose anual)", duration: 30 },
            { dosage: "0.25", unit: "ml", format: "Ampola", commonDose: "0.25ml IM (Pediátrico)", duration: 30, indication: "6 meses a 35 meses" },
        ],
        commonFrequencies: ["Dose única", "Anual"],
        notes: "Campanha anual. Contraindicação: anafilaxia a ovo (relativa).",
    },
    {
        name: "Vacina Hepatite B",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "20", unit: "mcg/ml", format: "Ampola", commonDose: "1ml (20mcg) IM", duration: 30, indication: "Adulto" },
            { dosage: "10", unit: "mcg/0.5ml", format: "Ampola", commonDose: "0.5ml (10mcg) IM", duration: 30, indication: "Pediátrico/Adolescente < 20 anos" },
        ],
        commonFrequencies: ["0, 1 e 6 meses"],
        notes: "Esquema de 3 doses.",
    },
    {
        name: "Vacina Dupla Adulto (dT)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM", duration: 30 },
        ],
        commonFrequencies: ["A cada 10 anos", "0, 2 e 6 meses"],
        notes: "Tétano e Difteria. Reforço a cada 10 anos.",
    },
    {
        name: "Vacina Tríplice Viral",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml SC", duration: 30 },
        ],
        commonFrequencies: ["Dose única"],
        notes: "Sarampo, Caxumba, Rubéola. Via Subcutânea.",
    },
    {
        name: "Vacina Febre Amarela",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml SC", duration: 30 },
        ],
        commonFrequencies: ["Dose única", "Reforço se necessário"],
        notes: "Via Subcutânea. Atenção a contraindicações (imunossuprimidos, idosos).",
    },
    {
        name: "Vacina Pneumocócica 23 (VPP23)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM", duration: 30 },
        ],
        commonFrequencies: ["Dose única", "Reforço em 5 anos"],
        notes: "Pneumo 23 valente. Indicada para idosos e comorbidades.",
    },
    {
        name: "Vacina Pneumocócica 13 (VPC13)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM", duration: 30 },
        ],
        commonFrequencies: ["Dose única"],
        notes: "Prevenar 13. Conjugada.",
    },
    {
        name: "Vacina Herpes Zóster (Shingrix)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM", duration: 30 },
        ],
        commonFrequencies: ["0 e 2 meses"],
        notes: "Recombinante inativada. 2 doses com intervalo de 2-6 meses.",
    },
    {
        name: "Vacina HPV Quadrivalente",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml IM", duration: 30 },
        ],
        commonFrequencies: ["0 e 6 meses"],
        notes: "Gardasil. Meninas 9-14 anos, Meninos 11-14 anos (SUS).",
    },
    {
        name: "Vacina Dengue (Qdenga)",
        category: "Vacina",
        route: "injetavel",
        presentations: [
            { dosage: "0.5", unit: "ml", format: "Ampola", commonDose: "0.5ml SC", duration: 30 },
        ],
        commonFrequencies: ["0 e 3 meses"],
        notes: "Via Subcutânea. Vírus atenuado.",
    },
];

// Interface para item de medicamento com apresentação
interface MedicationListItem {
    displayName: string;  // Nome exibido: "Dipirona (comprimido)"
    baseName: string;     // Nome base: "Dipirona"
    format: string;       // Formato: "comprimido"
    dosage?: string;      // Dosagem: "500"
    unit?: string;        // Unidade: "mg"
    prescriptionType?: 'common' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1';
}

// Mapear formatos para categorias amigáveis
const formatCategory = (format: string): string => {
    const lower = format.toLowerCase();
    if (lower.includes('comprimido') || lower.includes('capsula') || lower.includes('cápsula')) {
        return 'comprimido/cápsula';
    }
    if (lower.includes('gotas') || lower.includes('solucao') || lower.includes('solução') || lower.includes('xarope') || lower.includes('suspensao') || lower.includes('suspensão')) {
        return 'gotas/solução';
    }
    if (lower.includes('injecao') || lower.includes('injeção') || lower.includes('injetável') || lower.includes('injetavel')) {
        return 'injetável';
    }
    if (lower.includes('creme') || lower.includes('pomada') || lower.includes('gel')) {
        return 'tópico';
    }
    if (lower.includes('colirio') || lower.includes('colírio')) {
        return 'colírio';
    }
    if (lower.includes('spray') || lower.includes('inalatorio') || lower.includes('inalatório')) {
        return 'inalatório';
    }
    return format;
};

// Gerar lista de medicamentos com apresentações únicas - usa emoji para indicar tipo
export const ALL_MEDICATIONS_WITH_PRESENTATIONS: MedicationListItem[] = (() => {
    const items: MedicationListItem[] = [];
    const seen = new Set<string>();

    // Função para obter emoji baseado no formato
    const getFormatEmoji = (format: string): string => {
        const formatLower = format.toLowerCase();

        // Comprimidos e cápsulas
        if (formatLower.includes('comprimido') || formatLower.includes('capsula') || formatLower.includes('cápsula')) {
            return '💊';
        }

        // Líquidos (gotas, suspensão, solução, xarope)
        if (formatLower.includes('gotas') || formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
            formatLower.includes('solucao') || formatLower.includes('solução') || formatLower.includes('xarope')) {
            return '💧';
        }

        // Injetáveis
        if (formatLower.includes('injecao') || formatLower.includes('injeção') || formatLower.includes('ampola')) {
            return '💉';
        }

        // Inalatórios
        if (formatLower.includes('spray') || formatLower.includes('aerosol') || formatLower.includes('inalatorio') || formatLower.includes('inalatório')) {
            return '💨';
        }

        // Outros (cremes, pomadas, colírios) - usar emoji genérico
        return '💊';
    };

    MEDICATION_DATABASE.forEach(med => {
        med.presentations.forEach(pres => {
            // Criar displayName simplificado: "Medicamento 100 mg" (emoji removido pois já existe ícone na UI)
            const displayName = `${med.name} ${pres.dosage} ${pres.unit}`;

            // Usar displayName como chave única para evitar duplicatas
            if (!seen.has(displayName)) {
                seen.add(displayName);

                items.push({
                    displayName: displayName,
                    baseName: med.name,
                    format: pres.format,
                    dosage: pres.dosage,
                    unit: pres.unit,
                    prescriptionType: med.prescriptionType
                });
            }
        });
    });

    // Ordenar alfabeticamente e por formato/dosagem
    return items.sort((a, b) => {
        // Comparar nomes base
        const nameCompare = a.baseName.localeCompare(b.baseName, 'pt-BR');
        if (nameCompare !== 0) return nameCompare;

        // Se for o mesmo medicamento, ordenar por formato
        const getFormatPriority = (format: string) => {
            const f = format.toLowerCase();
            if (f.includes('comprimido') || f.includes('capsula') || f.includes('cápsula')) return 1;
            if (f.includes('oral') || f.includes('solucao') || f.includes('xarope') || f.includes('gotas')) return 2;
            if (f.includes('topico') || f.includes('creme') || f.includes('pomada')) return 3;
            if (f.includes('oftalmico') || f.includes('colirio')) return 4;
            if (f.includes('nasal') || f.includes('spray') || f.includes('aerosol')) return 5;
            if (f.includes('injetavel') || f.includes('ampola')) return 6;
            return 9;
        };

        const priorityA = getFormatPriority(a.format);
        const priorityB = getFormatPriority(b.format);

        if (priorityA !== priorityB) return priorityA - priorityB;

        // Se mesmo formato, ordenar por dosagem (numérico se possível)
        const parseDosage = (d: string) => {
            const num = parseFloat(d.replace(',', '.'));
            return isNaN(num) ? 0 : num;
        };

        return parseDosage(a.dosage || "0") - parseDosage(b.dosage || "0");
    });
})();

// Lista simples de nomes base para busca (mantido para compatibilidade)
const ALL_MEDICATIONS = MEDICATION_DATABASE.map(m => m.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const MEDICATION_FORMATS = [
    { value: "comprimido", label: "Comprimido" },
    { value: "capsula", label: "Cápsula" },
    { value: "solucao", label: "Solução" },
    { value: "xarope", label: "Xarope" },
    { value: "gotas", label: "Gotas" },
    { value: "injecao", label: "Injeção" },
    { value: "creme", label: "Creme" },
    { value: "pomada", label: "Pomada" },
    { value: "spray", label: "Spray" },
    { value: "adesivo", label: "Adesivo" },
    { value: "supositorio", label: "Supositório" },
    { value: "colirio", label: "Colírio" },
    { value: "suspensao", label: "Suspensão" },
    { value: "bisnaga", label: "Bisnaga" },
    { value: "ampola", label: "Ampola" },
    { value: "refil", label: "Refil" },
    { value: "caneta", label: "Caneta" },
    { value: "aerosol", label: "Aerossol" },
    { value: "capsula inalatoria", label: "Cápsula Inalatória" },
    { value: "sache", label: "Sachê" },
    { value: "enema", label: "Enema" },
];

export const DOSAGE_UNITS = [
    { value: "mg", label: "mg" },
    { value: "g", label: "g" },
    { value: "ml", label: "ml" },
    { value: "gt", label: "gotas" },
    { value: "cps", label: "cápsulas" },
    { value: "cp", label: "comprimidos" },
    { value: "amp", label: "ampola" },
    { value: "ui", label: "UI" },
    { value: "mcg", label: "mcg" },
    { value: "puff", label: "jatos/puffs" },
    { value: "aplicacao", label: "aplicação" },
    { value: "sache", label: "sachê" },
    { value: "adesivo", label: "adesivo" },
    { value: "supositorio", label: "supositório" },
];

export const PRESCRIPTION_TYPES = [
    { value: "padrao", label: "Comum / Livre" },
    { value: "A", label: "A (Amarela e A3)" },
    { value: "B1", label: "B1 (Azul)" },
    { value: "B2", label: "B2 (Azul)" },
    { value: "C1", label: "C1 (Branca)" },
    { value: "C5", label: "C5 (Branca)" },
    { value: "especial", label: "Especial" },
];

export const FREQUENCIES = [
    { value: "Dose única", label: "Dose única" },
    { value: "1x ao dia", label: "1x ao dia" },
    { value: "2x ao dia", label: "2x ao dia" },
    { value: "3x ao dia", label: "3x ao dia" },
    { value: "4x ao dia", label: "4x ao dia" },
    { value: "12h em 12h", label: "12h em 12h" },
    { value: "8h em 8h", label: "8h em 8h" },
    { value: "6h em 6h", label: "6h em 6h" },
    { value: "4h em 4h", label: "4h em 4h" },
    { value: "Quando necessário", label: "Quando necessário" },
    { value: "1x por semana", label: "1x por semana" },
    { value: "1x por mês", label: "1x por mês" },
];

const ADMINISTRATION_ROUTES = [
    { value: "oral", label: "Oral" },
    { value: "sublingual", label: "Sublingual" },
    { value: "injetavel", label: "Injetável" },
    { value: "topico", label: "Tópico" },
    { value: "oftalmico", label: "Oftálmico" },
    { value: "inalatorio", label: "Inalatório" },
    { value: "retal", label: "Retal" },
    { value: "nasal", label: "Nasal" },
    { value: "transdermico", label: "Transdérmico" },
];

const normalizeFormat = (format: string) => {
    if (!format) return "comprimido";
    const lower = format.toLowerCase().trim();

    // Manual overrides for known issues
    const overrides: Record<string, string> = {
        "suspensão": "suspensao",
        "solução": "solucao",
        "cápsula": "capsula",
        "inalatório": "inalatorio",
        "tópico": "topico",
        "supositório": "supositorio",
        "injeção": "injecao",
        "colírio": "colirio",
        "cápsula inalatória": "capsula inalatoria",
        "sachê": "sache",

    };

    if (overrides[lower]) return overrides[lower];

    return lower
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c");
};

const normalizeSuggestionText = (value?: string) =>
    (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c")
        .trim();

const mapSuggestionUnitToDosageUnit = (presentation: MedicationPresentation) => {
    const formatLower = normalizeSuggestionText(presentation.format);
    const unitLower = normalizeSuggestionText(presentation.suggestedUnit || presentation.unit);

    if (formatLower.includes("comprimido")) return "cp";
    if (formatLower.includes("capsula")) return "cps";
    if (formatLower.includes("gota")) return "gt";
    if (formatLower.includes("injecao") || formatLower.includes("ampola")) return "amp";
    if (formatLower.includes("spray") || formatLower.includes("aerossol")) return "puff";
    if (formatLower.includes("sache")) return "sache";
    if (formatLower.includes("adesivo")) return "adesivo";
    if (formatLower.includes("supositorio")) return "supositorio";

    if (unitLower.includes("gota")) return "gt";
    if (unitLower.includes("caps")) return "cps";
    if (unitLower.includes("comprim")) return "cp";
    if (unitLower.includes("amp")) return "amp";
    if (unitLower.includes("jato") || unitLower.includes("puff")) return "puff";
    if (unitLower.includes("aplica")) return "aplicacao";
    if (unitLower.includes("sache")) return "sache";
    if (unitLower.includes("adesivo")) return "adesivo";
    if (unitLower.includes("supositorio") || unitLower.includes("unidade")) return formatLower.includes("supositorio") ? "supositorio" : "cp";
    if (unitLower.includes("ml")) return "ml";
    if (unitLower.includes("mcg")) return "mcg";
    if (unitLower.includes("ui")) return "ui";
    if (unitLower.includes("g")) return unitLower === "g" ? "g" : "mg";
    return "mg";
};

const mapSuggestionFrequency = (presentation: MedicationPresentation, medicationInfo?: MedicationInfo | null) => {
    const commonDose = normalizeSuggestionText(presentation.commonDose);

    if (commonDose.includes("se necessario") || commonDose.includes("quando necessario")) {
        return "Quando necessário";
    }
    if (commonDose.includes("dose unica") || commonDose.includes("dose única") || commonDose.includes("dose unica")) {
        return "Dose única";
    }
    if (commonDose.includes("1x/semana") || commonDose.includes("1x por semana")) {
        return "1x por semana";
    }
    if (commonDose.includes("1x/mes") || commonDose.includes("1x por mes")) {
        return "1x por mês";
    }

    const timesPerDayRangeMatch = commonDose.match(/(\d+)\s*[-–]\s*(\d+)x\/dia/);
    if (timesPerDayRangeMatch) {
        return `${timesPerDayRangeMatch[1]}x ao dia`;
    }

    const hourRangeMatch = commonDose.match(/(\d+)\s*[-–]\s*(\d+)h/);
    if (hourRangeMatch) {
        const largerInterval = Math.max(Number(hourRangeMatch[1]), Number(hourRangeMatch[2]));
        if ([4, 6, 8, 12].includes(largerInterval)) {
            return `${largerInterval}h em ${largerInterval}h`;
        }
    }

    if (commonDose.includes("12/12h")) return "12h em 12h";
    if (commonDose.includes("8/8h")) return "8h em 8h";
    if (commonDose.includes("6/6h")) return "6h em 6h";
    if (commonDose.includes("4/4h")) return "4h em 4h";
    if (commonDose.includes("4x/dia")) return "4x ao dia";
    if (commonDose.includes("3x/dia")) return "3x ao dia";
    if (commonDose.includes("2x/dia")) return "2x ao dia";
    if (commonDose.includes("1x/dia") || commonDose.includes("a noite") || commonDose.includes("a noite")) {
        return "1x ao dia";
    }

    const fallback = medicationInfo?.commonFrequencies?.find((frequency) =>
        FREQUENCIES.some((option) => option.value === frequency)
    );

    return fallback || "";
};

const getSuggestionLowerDose = (presentation: MedicationPresentation) => {
    if (presentation.suggestedDose) {
        return presentation.suggestedDose;
    }

    const commonDose = presentation.commonDose || "";
    const dosageWithUiMatch = commonDose.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*\d+(?:[.,]\d+)?)?\s*ui/i);
    if (dosageWithUiMatch) {
        return dosageWithUiMatch[1].replace(",", ".");
    }

    const genericRangeMatch = commonDose.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?/);
    if (genericRangeMatch) {
        return genericRangeMatch[1].replace(",", ".");
    }

    return "1";
};

const getInsulinUnitsPerContainer = (presentation: MedicationPresentation) => {
    const concentration = Number.parseFloat((presentation.dosage || "").replace(",", "."));
    if (!Number.isFinite(concentration) || concentration <= 0) {
        return 300;
    }

    const formatLower = normalizeSuggestionText(presentation.format);
    if (formatLower.includes("refil") || formatLower.includes("caneta")) {
        return concentration * 3;
    }

    return concentration * 10;
};

export function MedicationDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    mode,
    onRemove,
    isRemovePending,
}: MedicationDialogProps) {
    const isEdit = mode === "edit";
    const [medicationOpen, setMedicationOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [dosagePopoverOpen, setDosagePopoverOpen] = useState(false);
    const [selectedMedInfo, setSelectedMedInfo] = useState<MedicationInfo | null>(null);
    const [selectedSuggestionPresentation, setSelectedSuggestionPresentation] = useState<MedicationPresentation | null>(null);
    const [patientWeight, setPatientWeight] = useState<string>("");

    // Ref para controlar quando ignorar o próximo evento de foco (após seleção)
    const skipNextFocusRef = useRef(false);

    // Fetch custom medications
    const { data: customMedications = [] } = useQuery<CustomMedication[]>({
        queryKey: ["/api/custom-medications"],
    });

    const createCustomMedicationMutation = useMutation({
        mutationFn: async (newMedication: { name: string }) => {
            const res = await apiRequest("POST", "/api/custom-medications", newMedication);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
        },
    });

    const deleteCustomMedicationMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/custom-medications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
        },
    });

    // Função para calcular dose pediátrica baseada no peso
    const calculatePediatricDose = useCallback((pres: MedicationPresentation, weight: number) => {
        if (!pres.isPediatric || !pres.dosePerKg || !pres.concentration || !pres.frequency) {
            return null;
        }

        // Calcula dose diária total em mg
        const dailyDoseLow = pres.dosePerKg * weight;
        const dailyDoseHigh = (pres.dosePerKgMax || pres.dosePerKg) * weight;

        // Limita pela dose máxima diária
        const maxDaily = pres.maxDailyDose || Infinity;
        const effectiveDailyLow = Math.min(dailyDoseLow, maxDaily);
        const effectiveDailyHigh = Math.min(dailyDoseHigh, maxDaily);

        // Dose por administração em mg
        const dosePerAdminLow = effectiveDailyLow / pres.frequency;
        const dosePerAdminHigh = effectiveDailyHigh / pres.frequency;

        // Converte para ml
        const mlPerAdminLow = dosePerAdminLow / pres.concentration;
        const mlPerAdminHigh = dosePerAdminHigh / pres.concentration;

        return {
            dosePerAdminMgLow: Math.round(dosePerAdminLow * 10) / 10,
            dosePerAdminMgHigh: Math.round(dosePerAdminHigh * 10) / 10,
            mlPerAdminLow: Math.round(mlPerAdminLow * 10) / 10,
            mlPerAdminHigh: Math.round(mlPerAdminHigh * 10) / 10,
            frequency: pres.frequency,
        };
    }, []);

    // Watch para o nome do medicamento selecionado
    const selectedMedName = form.watch("name");

    // Atualizar informações do medicamento quando selecionado
    useEffect(() => {
        if (selectedMedName) {
            // Encontrar o item selecionado na lista de apresentações
            const selectedItem = ALL_MEDICATIONS_WITH_PRESENTATIONS.find(
                item => item.displayName === selectedMedName
            );

            // Se encontrar, buscar info do medicamento pelo baseName
            if (selectedItem) {
                const medInfo = MEDICATION_DATABASE.find(
                    m => m.name === selectedItem.baseName
                );
                setSelectedMedInfo(medInfo || null);
            } else {
                // Fallback: tentar buscar diretamente pelo nome (para medicamentos digitados manualmente)
                const medInfo = MEDICATION_DATABASE.find(
                    m => selectedMedName.toLowerCase().includes(m.name.toLowerCase())
                );
                setSelectedMedInfo(medInfo || null);
            }
        } else {
            setSelectedMedInfo(null);
        }
        setSelectedSuggestionPresentation(null);
    }, [selectedMedName]);

    // Filtrar medicamentos baseado na busca - agora usa lista com apresentações + customizados
    const filteredMedications = useMemo(() => {
        const customItems = customMedications.map(m => ({
            displayName: m.name,
            baseName: m.name,
            format: m.format || 'custom',
            prescriptionType: m.prescriptionType || 'padrao',
            isCustom: true,
            id: m.id
        }));

        const allMeds = [...customItems, ...ALL_MEDICATIONS_WITH_PRESENTATIONS] as (MedicationListItem & { isCustom?: boolean })[];

        if (!searchValue) return allMeds;
        const searchLower = searchValue.toLowerCase().trim();

        // Filtrar medicamentos que contenham o termo de busca
        const filtered = allMeds.filter(med =>
            med.displayName.toLowerCase().includes(searchLower) ||
            med.baseName.toLowerCase().includes(searchLower)
        );

        // Ordenar: Customizados primeiro, depois priorizar os que começam com o termo buscado
        return filtered.sort((a, b) => {
            // Prioridade para customizados
            const isCustomA = (a as any).isCustom;
            const isCustomB = (b as any).isCustom;
            if (isCustomA && !isCustomB) return -1;
            if (!isCustomA && isCustomB) return 1;

            const searchLower = searchValue.toLowerCase().trim();
            const aStartsWith = a.baseName.toLowerCase().startsWith(searchLower);
            const bStartsWith = b.baseName.toLowerCase().startsWith(searchLower);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // Comparar nomes base
            const nameCompare = a.baseName.localeCompare(b.baseName, 'pt-BR');
            if (nameCompare !== 0) return nameCompare;

            // Se for o mesmo medicamento, ordenar por formato
            const getFormatPriority = (format: string) => {
                const f = format.toLowerCase();
                if (f.includes('comprimido') || f.includes('capsula') || f.includes('cápsula')) return 1;
                if (f.includes('oral') || f.includes('solucao') || f.includes('xarope') || f.includes('gotas')) return 2;
                if (f.includes('topico') || f.includes('creme') || f.includes('pomada')) return 3;
                if (f.includes('oftalmico') || f.includes('colirio')) return 4;
                if (f.includes('nasal') || f.includes('spray') || f.includes('aerosol')) return 5;
                if (f.includes('injetavel') || f.includes('ampola')) return 6;
                return 9;
            };

            const priorityA = getFormatPriority(a.format);
            const priorityB = getFormatPriority(b.format);

            if (priorityA !== priorityB) return priorityA - priorityB;

            // Se mesmo formato, ordenar por dosagem (numérico se possível)
            const parseDosage = (d: string) => {
                const num = parseFloat(d.replace(',', '.'));
                return isNaN(num) ? 0 : num;
            };

            return parseDosage(a.dosage || "0") - parseDosage(b.dosage || "0");
        });
    }, [searchValue, customMedications]);

    // Watch para cálculo automático de quantidade
    const watchedFrequency = form.watch("frequency");
    const watchedFormat = form.watch("format");
    const watchedDosage = form.watch("dosage");

    // Calcular quantidade automaticamente baseada na frequência (para 30 dias)
    useEffect(() => {
        if (!watchedFrequency || !watchedFormat) return;

        const formatLower = (watchedFormat || "").toLowerCase();
        const isSolid = formatLower.includes("comprimido") || formatLower.includes("capsula") || formatLower.includes("cápsula");
        const isLiquid = formatLower.includes("gotas") || formatLower.includes("suspensao") || formatLower.includes("suspensão") ||
            formatLower.includes("solucao") || formatLower.includes("solução") || formatLower.includes("xarope");

        let frequencyMultiplier = 0;
        switch (watchedFrequency) {
            case "1x ao dia": frequencyMultiplier = 30; break;
            case "2x ao dia": frequencyMultiplier = 60; break;
            case "3x ao dia": frequencyMultiplier = 90; break;
            case "4x ao dia": frequencyMultiplier = 120; break;
            case "12h em 12h": frequencyMultiplier = 60; break;
            case "8h em 8h": frequencyMultiplier = 90; break;
            case "6h em 6h": frequencyMultiplier = 120; break;
            case "1x por semana": frequencyMultiplier = 4; break;
            case "1x por mês": frequencyMultiplier = 1; break;
            default:
                form.setValue("quantity", "");
                return; // Não calcular para "Quando necessário" ou outros
        }

        const isInsulinSuggestion = Boolean(
            selectedSuggestionPresentation &&
            normalizeSuggestionText(selectedSuggestionPresentation.unit).includes("ui") &&
            (formatLower.includes("injecao") || formatLower.includes("refil") || formatLower.includes("caneta"))
        );

        if (isInsulinSuggestion) {
            const dailyUnits = Number.parseFloat((watchedDosage || "").replace(",", ".")) || 0;
            const totalMonthlyUI = dailyUnits * frequencyMultiplier;
            const unitsPerContainer = getInsulinUnitsPerContainer(selectedSuggestionPresentation!);
            const totalContainers = Math.max(1, Math.ceil(totalMonthlyUI / unitsPerContainer));

            if (formatLower.includes("refil") || formatLower.includes("caneta")) {
                form.setValue("quantity", `${totalContainers} ${totalContainers === 1 ? "refil/caneta" : "refis/canetas"}`);
            } else {
                form.setValue("quantity", `${totalContainers} ${totalContainers === 1 ? "ampola" : "ampolas"}`);
            }
        } else if (isSolid) {
            // Para sólidos: calcular total de comprimidos/cápsulas
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            const suffix = formatLower.includes("capsula") || formatLower.includes("cápsula") ? "cápsulas" : "comprimidos";
            form.setValue("quantity", `${totalQuantity} ${suffix}`);
        } else if (isLiquid) {
            // Para líquidos: calcular em frascos
            const dosePerTake = parseInt(watchedDosage) || 5;
            const isGotas = formatLower.includes("gotas");

            if (isGotas) {
                // Gotas: frasco geralmente tem 20ml, ~20 gotas/ml = ~400 gotas/frasco
                const totalGotas = dosePerTake * frequencyMultiplier;
                const gotasPorFrasco = 400; // frasco padrão de 20ml, 20 gotas/ml
                const frascos = Math.ceil(totalGotas / gotasPorFrasco);
                form.setValue("quantity", `${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            } else {
                // Suspensão/Solução: frasco geralmente tem 100ml
                const totalMl = dosePerTake * frequencyMultiplier;
                const frascos = Math.ceil(totalMl / 100); // Assumindo frasco de 100ml
                form.setValue("quantity", `${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            }
        } else if (formatLower.includes("pomada") || formatLower.includes("creme") || formatLower.includes("gel")) {
            // Tópicos (Tubos/Bisnagas)
            form.setValue("quantity", "1 bisnaga");
        } else if (formatLower.includes("spray") || formatLower.includes("aerosol")) {
            // Sprays
            form.setValue("quantity", "1 frasco");
        } else if (formatLower.includes("capsula inalatoria")) {
            // Cápsulas inalatórias
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} cápsulas`);
        } else if (formatLower.includes("refil") || formatLower.includes("caneta")) {
            // Insulinas
            const dose = parseInt(watchedDosage) || 10;
            // Caneta tem 3ml = 300UI. Se dose diária for X...
            const totalUI = dose * frequencyMultiplier; // Total UI no mês
            const canetas = Math.ceil(totalUI / 300);
            form.setValue("quantity", `${canetas} ${canetas === 1 ? 'caneta/refil' : 'canetas/refis'}`);
        } else if (formatLower.includes("injecao") || formatLower.includes("injeção") || formatLower.includes("ampola")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} ampolas`);
        } else if (formatLower.includes("sache") || formatLower.includes("sachê")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} sachês`);
        } else if (formatLower.includes("adesivo")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} adesivos`);
        } else if (formatLower.includes("supositorio") || formatLower.includes("supositório")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} supositórios`);
        } else {
            // Outros formatos: Não preencher automaticamente
        }
    }, [watchedFrequency, watchedFormat, watchedDosage, form, selectedSuggestionPresentation]);

    // Função para aplicar sugestão de dosagem
    const applyDosageSuggestion = useCallback((presentation: MedicationPresentation) => {
        // Marcar para ignorar o próximo foco
        skipNextFocusRef.current = true;

        const formatLower = presentation.format.toLowerCase();
        const mappedUnit = mapSuggestionUnitToDosageUnit(presentation);
        const mappedFrequency = mapSuggestionFrequency(presentation, selectedMedInfo);
        const normalizedDose = getSuggestionLowerDose(presentation);
        const isInsulinSuggestion = normalizeSuggestionText(presentation.unit).includes("ui");

        setSelectedSuggestionPresentation(presentation);

        if (isInsulinSuggestion) {
            form.setValue("dosage", normalizedDose);
            form.setValue("dosageUnit", "ui");
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => {
                skipNextFocusRef.current = false;
            }, 200);
            return;
        }

        // Determinar a unidade apropriada baseada no formato
        let unit = mappedUnit;
        if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
            unit = "cps";
        } else if (formatLower.includes('gotas')) {
            // Para gotas, usar a dose em gotas (ex: 20-40 gotas)
            // Pegar o valor comum da dose se disponível
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+)[-–]?(\d+)?/);
                if (match) {
                    form.setValue("dosage", match[1]); // Usa o valor mínimo
                    form.setValue("dosageUnit", mappedUnit);
                    if (mappedFrequency) {
                        form.setValue("frequency", mappedFrequency);
                    }
                    form.setValue("format", normalizeFormat(presentation.format));
                    setDosagePopoverOpen(false);
                    setTimeout(() => { skipNextFocusRef.current = false; }, 200);
                    return;
                }
            }
            unit = "gotas";
            form.setValue("dosage", "20"); // Dose padrão de gotas
        } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
            formatLower.includes('solucao') || formatLower.includes('solução') ||
            formatLower.includes('xarope')) {
            unit = "ml";
            form.setValue("dosage", "5"); // Dose padrão de líquido
            form.setValue("dosageUnit", mappedUnit);
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => { skipNextFocusRef.current = false; }, 200);
            return;
        } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
            formatLower.includes('ampola')) {
            unit = "amp";
        } else if (formatLower.includes('spray') || formatLower.includes('aerosol')) {
            unit = "puff";
            let dosage = "1";

            // Tentar extrair dose comum (ex: "1-2 jatos")
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+([-–]\d+)?)/);
                if (match) {
                    dosage = match[1];
                }
            }

            form.setValue("dosage", dosage);
            form.setValue("dosageUnit", mappedUnit);
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => { skipNextFocusRef.current = false; }, 200);
            return;
        }

        // Para formas sólidas (comprimido, cápsula) e injetáveis, usar "1" como dose padrão
        form.setValue("dosage", "1");
        form.setValue("dosageUnit", unit);
        if (mappedFrequency) {
            form.setValue("frequency", mappedFrequency);
        }
        form.setValue("format", normalizeFormat(presentation.format));
        setDosagePopoverOpen(false);

        // Resetar o flag após um curto delay
        setTimeout(() => {
            skipNextFocusRef.current = false;
        }, 200);
    }, [form, selectedMedInfo]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Medicamento" : "Adicionar Medicamento de Uso Contínuo"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Atualize as informações do medicamento"
                            : "Registre um medicamento que você usa regularmente"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome do Medicamento */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Nome do Medicamento *</FormLabel>
                                    <Popover open={medicationOpen} onOpenChange={setMedicationOpen} modal={false}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={medicationOpen}
                                                    className={cn(
                                                        "justify-between font-normal h-10",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <span className="flex-1 flex items-center gap-2">
                                                        {field.value || "Selecione o medicamento"}
                                                        {(() => {
                                                            const val = (field.value || "").toLowerCase().trim();
                                                            const isStandard = ALL_MEDICATIONS_WITH_PRESENTATIONS.some(
                                                                m => m.displayName.toLowerCase() === val || m.baseName.toLowerCase() === val
                                                            );
                                                            const isCustom = customMedications.some(m => m.name.toLowerCase() === val) || !isStandard;

                                                            if (isCustom && val) {
                                                                return (
                                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                        Personalizado
                                                                    </Badge>
                                                                );
                                                            }

                                                            if (selectedMedInfo?.prescriptionType && (selectedMedInfo.prescriptionType as string) !== 'common' && (selectedMedInfo.prescriptionType as string) !== 'padrao') {
                                                                return <PrescriptionTypeBadge type={selectedMedInfo.prescriptionType} />;
                                                            }
                                                            return null;
                                                        })()}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-[400px] p-0"
                                            align="start"
                                            onOpenAutoFocus={(e) => e.preventDefault()}
                                        >
                                            <div className="flex items-center border-b px-3">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Buscar medicamento..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                />
                                            </div>
                                            <div
                                                className="max-h-[300px] overflow-y-auto p-1"
                                                onWheel={(e) => {
                                                    e.stopPropagation();
                                                    const target = e.currentTarget;
                                                    target.scrollTop += e.deltaY;
                                                }}
                                            >
                                                <div className="pr-2">
                                                    {/* Opção de digitar manualmente - sempre visível se houver busca */}
                                                    {searchValue && (
                                                        <div
                                                            className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b mb-1 bg-gradient-to-r from-blue-50 to-transparent"
                                                            onClick={() => {
                                                                field.onChange(searchValue);

                                                                // Auto-save as custom medication if not exists
                                                                const exists = customMedications.some(m => m.name?.toLowerCase() === searchValue.toLowerCase()) ||
                                                                    ALL_MEDICATIONS_WITH_PRESENTATIONS.some(m => (m as any).name?.toLowerCase() === searchValue.toLowerCase());

                                                                if (!exists) {
                                                                    createCustomMedicationMutation.mutate({ name: searchValue });
                                                                }

                                                                // Limpar campos para preenchimento manual
                                                                form.setValue("dosage", "");
                                                                form.setValue("frequency", "");
                                                                form.setValue("quantity", "");
                                                                form.setValue("format", "");
                                                                form.setValue("dosageUnit", "mg");
                                                                setMedicationOpen(false);
                                                                setSearchValue("");
                                                            }}
                                                        >
                                                            <span className="text-blue-600">✏️</span>
                                                            <span className="flex-1 text-blue-700 font-medium">
                                                                Digitar manualmente: "{searchValue}"
                                                            </span>
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {filteredMedications.length === 0 ? (
                                                        <div className="py-6 text-center text-sm">
                                                            <p>Nenhum medicamento encontrado.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredMedications.map((medItem) => (
                                                                <div
                                                                    key={medItem.displayName}
                                                                    className={cn(
                                                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                                                        field.value === medItem.displayName && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        // Definir o nome completo com concentração
                                                                        field.onChange(medItem.displayName);

                                                                        // Limpar campos ao trocar de medicamento
                                                                        form.setValue("dosage", "");
                                                                        form.setValue("frequency", "");
                                                                        form.setValue("quantity", "");

                                                                        // Auto-preencher formato
                                                                        if (medItem.format) {
                                                                            form.setValue("format", medItem.format);

                                                                            // Auto-preencher unidade baseada no formato
                                                                            const formatLower = medItem.format.toLowerCase();
                                                                            if (formatLower.includes('comprimido')) {
                                                                                form.setValue("dosageUnit", "cp");
                                                                            } else if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
                                                                                form.setValue("dosageUnit", "cps");
                                                                            } else if (formatLower.includes('gotas')) {
                                                                                form.setValue("dosageUnit", "gt");
                                                                            } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
                                                                                formatLower.includes('solucao') || formatLower.includes('solução') ||
                                                                                formatLower.includes('xarope')) {
                                                                                form.setValue("dosageUnit", "ml");
                                                                            } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
                                                                                formatLower.includes('ampola')) {
                                                                                form.setValue("dosageUnit", "amp");
                                                                            }
                                                                        }
                                                                        // Auto-preencher tipo de receituário
                                                                        if (medItem.prescriptionType) {
                                                                            form.setValue("prescriptionType", medItem.prescriptionType);
                                                                        }
                                                                        // Buscar info completa para via de administração
                                                                        const medInfo = MEDICATION_DATABASE.find(m => m.name === medItem.baseName);
                                                                        if (medInfo?.route) {
                                                                            form.setValue("administrationRoute", medInfo.route);
                                                                        }
                                                                        setMedicationOpen(false);
                                                                        setSearchValue("");
                                                                    }}
                                                                >
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-base">
                                                                        {getMedicationIcon(medItem.format || 'comprimido')}
                                                                    </div>
                                                                    <span className="flex-1">{medItem.displayName}</span>
                                                                    {(medItem as any).isCustom && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                            Personalizado
                                                                        </Badge>
                                                                    )}
                                                                    {(medItem.prescriptionType && (medItem.prescriptionType as string) !== 'common' && (medItem.prescriptionType as string) !== 'padrao') && (
                                                                        <PrescriptionTypeBadge type={medItem.prescriptionType} />
                                                                    )}

                                                                    {(medItem as any).isCustom && (
                                                                        <div
                                                                            role="button"
                                                                            className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteCustomMedicationMutation.mutate((medItem as any).id);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o formato" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MEDICATION_FORMATS.map((format) => (
                                                        <SelectItem key={format.value} value={format.value}>
                                                            {format.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="administrationRoute"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Via de Administração *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value || "oral"}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a via" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ADMINISTRATION_ROUTES.map((route) => (
                                                        <SelectItem key={route.value} value={route.value}>
                                                            {route.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Dosagem com Popup de Sugestões */}
                            <FormField
                                control={form.control}
                                name="dosage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dose por vez *</FormLabel>
                                        <Popover open={dosagePopoverOpen} onOpenChange={setDosagePopoverOpen}>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Ex: 6, 10, 1"
                                                        className="pr-8"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500 hover:text-yellow-600 transition-colors"
                                                        onClick={() => {
                                                            if (selectedMedInfo) setDosagePopoverOpen(true);
                                                        }}
                                                        title="Ver sugestões de dose"
                                                    >
                                                        <Sparkles className="h-4 w-4 fill-yellow-500" />
                                                    </button>
                                                </PopoverTrigger>
                                            </div>
                                            {selectedMedInfo && (
                                                <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                                                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-2 border-b">
                                                        <div className="flex items-center gap-2 text-amber-700">
                                                            <Sparkles className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                            <span className="font-medium text-sm">Sugestão IA</span>
                                                            <Badge variant="outline" className="text-xs ml-auto">{selectedMedInfo.category}</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="p-2 max-h-[280px] overflow-y-auto">
                                                        {/* Apresentações para adultos */}
                                                        {selectedMedInfo.presentations.filter(p => !p.isPediatric).length > 0 && (
                                                            <>
                                                                {selectedMedInfo.presentations.filter(p => !p.isPediatric).map((pres, idx) => (
                                                                    <div
                                                                        key={`adult-${idx}`}
                                                                        className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            applyDosageSuggestion(pres);
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <span className="font-semibold text-gray-900">{pres.dosage}{pres.unit}</span>
                                                                            <span className="text-gray-500 ml-2 text-sm">
                                                                                ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                            </span>
                                                                        </div>
                                                                        {pres.commonDose && (
                                                                            <span className="text-xs text-gray-500">{pres.commonDose}</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}

                                                        {/* Seção pediátrica com campo de peso integrado */}
                                                        {selectedMedInfo.presentations.filter(p => p.isPediatric).length > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex items-center justify-between px-2 py-1">
                                                                    <span className="text-xs text-purple-600 font-medium">👶 Pediátrico</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Peso"
                                                                            value={patientWeight}
                                                                            onChange={(e) => setPatientWeight(e.target.value)}
                                                                            className="h-6 w-16 text-xs px-2"
                                                                            min="0"
                                                                            step="0.1"
                                                                        />
                                                                        <span className="text-xs text-gray-500">kg</span>
                                                                    </div>
                                                                </div>
                                                                {selectedMedInfo.presentations.filter(p => p.isPediatric).map((pres, idx) => {
                                                                    const weight = parseFloat(patientWeight);
                                                                    const calculation = weight > 0 ? calculatePediatricDose(pres, weight) : null;

                                                                    return (
                                                                        <div
                                                                            key={`ped-${idx}`}
                                                                            className="p-2 rounded-md cursor-pointer hover:bg-purple-50 transition-colors border-l-2 border-purple-200 ml-2 mt-1"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (calculation) {
                                                                                    form.setValue("dosage", `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}`);
                                                                                    form.setValue("dosageUnit", "ml");
                                                                                    setSelectedSuggestionPresentation(pres);
                                                                                    const mappedFrequency = mapSuggestionFrequency(pres, selectedMedInfo);
                                                                                    if (mappedFrequency) {
                                                                                        form.setValue("frequency", mappedFrequency);
                                                                                    }
                                                                                    form.setValue("format", normalizeFormat(pres.format));
                                                                                    skipNextFocusRef.current = true;
                                                                                    setDosagePopoverOpen(false);
                                                                                    setTimeout(() => { skipNextFocusRef.current = false; }, 200);
                                                                                } else {
                                                                                    applyDosageSuggestion(pres);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="font-semibold text-gray-900 text-sm">{pres.dosage}</span>
                                                                                    {pres.format && (
                                                                                        <span className="text-gray-500 font-normal text-xs">
                                                                                            ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {calculation ? (
                                                                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                                                        {calculation.mlPerAdminLow === calculation.mlPerAdminHigh
                                                                                            ? `${calculation.mlPerAdminLow}ml`
                                                                                            : `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}ml`
                                                                                        } / dose
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-purple-400 italic">informe peso</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">{pres.commonDose}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedMedInfo.notes && (
                                                        <div className="bg-amber-50 p-2 border-t flex items-start gap-2">
                                                            <Lightbulb className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-xs text-amber-700">{selectedMedInfo.notes}</span>
                                                        </div>
                                                    )}

                                                    {/* Disclaimer */}
                                                    <div className="bg-gray-50 p-2 border-t">
                                                        <p className="text-[10px] text-gray-400 text-center leading-tight">
                                                            ⚕️ Sugestões baseadas em referências gerais. Confirme a posologia conforme protocolo institucional e avaliação clínica.
                                                        </p>
                                                    </div>
                                                </PopoverContent>
                                            )}
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dosageUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DOSAGE_UNITS.map((unit) => (
                                                        <SelectItem key={unit.value} value={unit.value}>
                                                            {unit.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a frequência" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FREQUENCIES.map((freq) => (
                                                        <SelectItem key={freq.value} value={freq.value}>
                                                            {freq.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prescriptionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Receita</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value || "padrao"}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRESCRIPTION_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade (para 30 dias)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 60 comprimidos"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Início *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Adicione observações sobre o medicamento..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className={isEdit ? "flex justify-between gap-3" : "flex justify-end gap-3"}>
                            {isEdit && onRemove && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => onRemove()}
                                    disabled={isRemovePending}
                                >
                                    {isRemovePending ? "Removendo..." : "Remover Medicamento"}
                                </Button>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending
                                        ? isEdit
                                            ? "Salvando..."
                                            : "Adicionando..."
                                        : isEdit
                                            ? "Salvar Alterações"
                                            : "Adicionar Medicamento"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
export const CONTROLLED_MEDICATIONS = [
    // Receita A (Amarela) - Opioides
    { name: "Tramadol", category: "Opioide", prescriptionType: "A" as const },
    { name: "Codeína", category: "Opioide", prescriptionType: "A" as const },
    { name: "Morfina", category: "Opioide", prescriptionType: "A" as const },

    // Receita B1 (Azul) - Psicotrópicos
    { name: "Fluoxetina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Sertralina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Escitalopram", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Amitriptilina", category: "Antidepressivo Tricíclico", prescriptionType: "B1" as const },
    { name: "Duloxetina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Clonazepam", category: "Ansiolítico", prescriptionType: "B1" as const },
    { name: "Alprazolam", category: "Ansiolítico", prescriptionType: "B1" as const },
    { name: "Zolpidem", category: "Hipnótico", prescriptionType: "B1" as const },
    { name: "Diazepam", category: "Ansiolítico", prescriptionType: "B1" as const },
    { name: "Lorazepam", category: "Ansiolítico", prescriptionType: "B1" as const },
    { name: "Bromazepam", category: "Ansiolítico", prescriptionType: "B1" as const },
    { name: "Paroxetina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Venlafaxina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Nortriptilina", category: "Antidepressivo Tricíclico", prescriptionType: "B1" as const },
    { name: "Clomipramina", category: "Antidepressivo Tricíclico", prescriptionType: "B1" as const },
    { name: "Bupropiona", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Trazodona", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Mirtazapina", category: "Antidepressivo", prescriptionType: "B1" as const },
    { name: "Quetiapina", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Risperidona", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Olanzapina", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Aripiprazol", category: "Antipsicótico", prescriptionType: "C1" as const },
    { name: "Brexpiprazol", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Clozapina", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Paliperidona", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Ziprasidona", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Lurasidona", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Haloperidol", category: "Antipsicótico", prescriptionType: "B1" as const },
    { name: "Carbamazepina", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Valproato de Sódio", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Fenitoína", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Lamotrigina", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Topiramato", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Gabapentina", category: "Anticonvulsivante", prescriptionType: "B1" as const },
    { name: "Pregabalina", category: "Anticonvulsivante", prescriptionType: "B1" as const },

    // Receita C - Retinoides
    { name: "Isotretinoína", category: "Retinoide", prescriptionType: "C" as const },
    { name: "Acitretina", category: "Retinoide", prescriptionType: "C" as const },
];
