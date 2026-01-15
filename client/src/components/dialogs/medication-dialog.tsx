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
import { Check, ChevronsUpDown, Sparkles, Lightbulb, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface MedicationInfo {
    name: string;
    presentations: MedicationPresentation[];
    category: string;
    route: string;
    isControlled?: boolean;
    prescriptionType?: 'common' | 'A' | 'B1' | 'B2' | 'C'; // Tipo de receituário
    commonFrequencies?: string[];
    notes?: string;
}

// Banco de dados de medicamentos com apresentações
const MEDICATION_DATABASE: MedicationInfo[] = [
    // ANTI-HIPERTENSIVOS
    {
        name: "Losartana",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1x/dia", indication: "HAS leve a moderada" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 1x/dia", indication: "HAS moderada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Enalapril",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 1-2x/dia" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1-2x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Anlodipino",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "comprimido", commonDose: "2.5-5mg 1x/dia", indication: "Idosos" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 1x/dia", indication: "HAS leve a moderada" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroclorotiazida",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "12.5-25mg 1x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Propranolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-40mg 2-3x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40-80mg 2-3x/dia" },
            { dosage: "80", unit: "mg", format: "comprimido", commonDose: "80mg 2x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    // ANTIDIABÉTICOS
    {
        name: "Metformina",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500mg 1-2x/dia", indication: "Dose inicial" },
            { dosage: "850", unit: "mg", format: "comprimido", commonDose: "850mg 1-3x/dia", indication: "Dose habitual" },
            { dosage: "1000", unit: "mg", format: "comprimido", commonDose: "1000mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
        notes: "Tomar junto às refeições",
    },
    // HIPOLIPEMIANTES
    {
        name: "Sinvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Atorvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40-80mg 1x/dia" },
            { dosage: "80", unit: "mg", format: "comprimido", commonDose: "80mg 1x/dia", indication: "Alto risco CV" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Rosuvastatina",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 1x/dia" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDEPRESSIVOS
    {
        name: "Fluoxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "20", unit: "mg", format: "capsula", commonDose: "20-40mg 1x/dia", indication: "Depressão, TOC" },
            { dosage: "40", unit: "mg", format: "capsula", commonDose: "40-60mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Sertralina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia", indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-200mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Escitalopram",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
            { dosage: "15", unit: "mg", format: "comprimido", commonDose: "15-20mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Amitriptilina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-75mg 1x/dia", indication: "Depressão, dor crônica" },
            { dosage: "75", unit: "mg", format: "comprimido", commonDose: "75-150mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Duloxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "30", unit: "mg", format: "capsula", commonDose: "30-60mg 1x/dia", indication: "Depressão, fibromialgia" },
            { dosage: "60", unit: "mg", format: "capsula", commonDose: "60mg 1x/dia" },
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
            { dosage: "0.25", unit: "mg", format: "comprimido", commonDose: "0.25-0.5mg 2-3x/dia" },
            { dosage: "0.5", unit: "mg", format: "comprimido", commonDose: "0.5-1mg 2-3x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "1-2mg 2-3x/dia" },
            { dosage: "2.5", unit: "mg/ml", format: "gotas", commonDose: "5-10 gotas 2-3x/dia" },
            // Apresentação pediátrica (convulsões)
            {
                dosage: "2.5", unit: "mg/ml", format: "gotas",
                commonDose: "0.01-0.05mg/kg/dia dividido 2-3x/dia",
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
            { dosage: "0.25", unit: "mg", format: "comprimido", commonDose: "0.25-0.5mg 2-3x/dia" },
            { dosage: "0.5", unit: "mg", format: "comprimido", commonDose: "0.5-1mg 2-3x/dia" },
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1mg 2-3x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2mg 2-3x/dia" },
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
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg à noite", indication: "Idosos" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg à noite" },
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
            { dosage: "20", unit: "mg", format: "capsula", commonDose: "20mg 1x/dia", indication: "Proteção gástrica" },
            { dosage: "40", unit: "mg", format: "capsula", commonDose: "40mg 1x/dia", indication: "DRGE, úlcera" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum, 30min antes da refeição",
    },
    {
        name: "Pantoprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40mg 1-2x/dia" },
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
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-1000mg 4-6x/dia" },
            { dosage: "750", unit: "mg", format: "comprimido", commonDose: "750mg 4-6x/dia" },
            { dosage: "200", unit: "mg/ml", format: "gotas", commonDose: "35-55 gotas 4-6x/dia" },
            // Apresentação pediátrica
            {
                dosage: "200", unit: "mg/ml", format: "gotas",
                commonDose: "10-15mg/kg/dose 4-6x/dia",
                indication: "Uso pediátrico (1 gota = 10mg)",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 15,
                concentration: 200, // 200mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h", "Quando necessário"],
        notes: "Dose máxima: 4g/dia. 1 gota = 10mg",
    },
    {
        name: "Dipirona",
        category: "Analgésico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-1000mg 4x/dia" },
            { dosage: "1000", unit: "mg", format: "comprimido", commonDose: "1000mg 4x/dia" },
            { dosage: "500", unit: "mg/ml", format: "gotas", commonDose: "20-40 gotas 4x/dia" },
            // Apresentação pediátrica
            {
                dosage: "500", unit: "mg/ml", format: "gotas",
                commonDose: "12.5-25mg/kg/dose 4x/dia",
                indication: "Uso pediátrico (1 gota = 25mg)",
                isPediatric: true,
                dosePerKg: 12.5,
                dosePerKgMax: 25,
                concentration: 500, // 500mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "1 gota = 25mg",
    },
    {
        name: "Ibuprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "comprimido", commonDose: "200-400mg 3-4x/dia" },
            { dosage: "400", unit: "mg", format: "comprimido", commonDose: "400mg 3-4x/dia" },
            { dosage: "600", unit: "mg", format: "comprimido", commonDose: "600mg 3x/dia" },
            // Apresentações pediátricas
            {
                dosage: "50", unit: "mg/ml", format: "suspensao",
                commonDose: "5-10mg/kg/dose 3-4x/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 5,
                dosePerKgMax: 10,
                concentration: 50, // 50mg/ml
                maxDailyDose: 1200,
                frequency: 3
            },
            {
                dosage: "100", unit: "mg/5ml", format: "suspensao",
                commonDose: "5-10mg/kg/dose 3-4x/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 5,
                dosePerKgMax: 10,
                concentration: 20, // 100mg/5ml = 20mg/ml
                maxDailyDose: 1200,
                frequency: 3
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
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 2x/dia" },
        ],
        commonFrequencies: ["12h em 12h"],
        notes: "⚠️ CONTRAINDICADO em menores de 12 anos. Uso máximo: 15 dias",
    },
    {
        name: "Prednisona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-60mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã, após café da manhã",
    },
    // ANTIBIÓTICOS
    {
        name: "Amoxicilina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "capsula", commonDose: "500mg 8/8h por 7 dias" },
            { dosage: "875", unit: "mg", format: "comprimido", commonDose: "875mg 12/12h por 7 dias" },
            // Apresentações líquidas pediátricas
            {
                dosage: "250", unit: "mg/5ml", format: "suspensao",
                commonDose: "25-50mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 50, // 250mg/5ml = 50mg/ml
                maxDailyDose: 3000,
                frequency: 3
            },
            {
                dosage: "500", unit: "mg/5ml", format: "suspensao",
                commonDose: "25-50mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico - concentração alta",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 100, // 500mg/5ml = 100mg/ml
                maxDailyDose: 3000,
                frequency: 3
            },
        ],
        commonFrequencies: ["8h em 8h", "12h em 12h"],
    },
    {
        name: "Azitromicina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500mg 1x/dia por 3-5 dias" },
            // Apresentação pediátrica
            {
                dosage: "200", unit: "mg/5ml", format: "suspensao",
                commonDose: "10mg/kg/dia 1x/dia por 3-5 dias",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 10,
                dosePerKgMax: 10,
                concentration: 40, // 200mg/5ml = 40mg/ml
                maxDailyDose: 500,
                frequency: 1
            },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ciprofloxacino",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "comprimido", commonDose: "250-500mg 12/12h" },
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-750mg 12/12h" },
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
            { dosage: "25", unit: "mcg", format: "comprimido", commonDose: "25-50mcg 1x/dia", indication: "Dose inicial" },
            { dosage: "50", unit: "mcg", format: "comprimido", commonDose: "50-100mcg 1x/dia" },
            { dosage: "75", unit: "mcg", format: "comprimido", commonDose: "75-125mcg 1x/dia" },
            { dosage: "88", unit: "mcg", format: "comprimido", commonDose: "88mcg 1x/dia" },
            { dosage: "100", unit: "mcg", format: "comprimido", commonDose: "100-150mcg 1x/dia" },
            { dosage: "112", unit: "mcg", format: "comprimido", commonDose: "112mcg 1x/dia" },
            { dosage: "125", unit: "mcg", format: "comprimido", commonDose: "125-175mcg 1x/dia" },
            { dosage: "150", unit: "mcg", format: "comprimido", commonDose: "150-200mcg 1x/dia" },
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
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia" },
            // Apresentação pediátrica
            {
                dosage: "1", unit: "mg/ml", format: "xarope",
                commonDose: "2-12a: 5mg (5ml); >30kg: 10mg (10ml) 1x/dia",
                indication: "Uso pediátrico (>2 anos)",
                isPediatric: true,
                dosePerKg: 0.2,
                dosePerKgMax: 0.3,
                concentration: 1, // 1mg/ml
                maxDailyDose: 10,
                frequency: 1
            },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // OUTROS
    {
        name: "Ácido Acetilsalicílico",
        category: "Antiagregante",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 1x/dia", indication: "Prevenção CV" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTI-HIPERTENSIVOS ADICIONAIS
    {
        name: "Captopril",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "12.5", unit: "mg", format: "comprimido", commonDose: "12.5-25mg 2-3x/dia", indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 2-3x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50mg 2-3x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Atenolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia", indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Metoprolol",
        category: "Beta-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 2x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 2x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 2x/dia" },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Nifedipino",
        category: "Bloqueador de Canal de Cálcio",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 3x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 2-3x/dia" },
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-60mg 1x/dia", indication: "Liberação prolongada" },
            { dosage: "60", unit: "mg", format: "comprimido", commonDose: "60mg 1x/dia", indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },
    {
        name: "Valsartana",
        category: "Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40-80mg 1x/dia", indication: "Dose inicial" },
            { dosage: "80", unit: "mg", format: "comprimido", commonDose: "80-160mg 1x/dia" },
            { dosage: "160", unit: "mg", format: "comprimido", commonDose: "160-320mg 1x/dia" },
            { dosage: "320", unit: "mg", format: "comprimido", commonDose: "320mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Furosemida",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40-80mg 1-2x/dia" },
            { dosage: "80", unit: "mg", format: "comprimido", commonDose: "80mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Espironolactona",
        category: "Diurético",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDIABÉTICOS ADICIONAIS
    {
        name: "Glibenclamida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "comprimido", commonDose: "2.5-5mg 1-2x/dia", indication: "Dose inicial" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar antes das refeições",
    },
    {
        name: "Glimepirida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1-2mg 1x/dia", indication: "Dose inicial" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2-4mg 1x/dia" },
            { dosage: "4", unit: "mg", format: "comprimido", commonDose: "4mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar no café da manhã",
    },
    {
        name: "Glicazida",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-60mg 1x/dia", indication: "Liberação modificada" },
            { dosage: "60", unit: "mg", format: "comprimido", commonDose: "60-120mg 1x/dia" },
            { dosage: "80", unit: "mg", format: "comprimido", commonDose: "80-160mg 2x/dia", indication: "Liberação imediata" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Insulina NPH",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "injecao", commonDose: "10-40 UI 1-2x/dia", indication: "Dose conforme glicemia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Ajustar dose conforme glicemia",
    },
    {
        name: "Insulina Regular",
        category: "Insulina",
        route: "injetavel",
        presentations: [
            { dosage: "100", unit: "UI/ml", format: "injecao", commonDose: "Conforme glicemia", indication: "Ação rápida" },
        ],
        commonFrequencies: ["Antes das refeições"],
        notes: "Aplicar 30min antes das refeições",
    },
    {
        name: "Dapagliflozina",
        category: "Antidiabético",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 1x/dia", indication: "Dose inicial" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia" },
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
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Fenofibrato",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "160", unit: "mg", format: "comprimido", commonDose: "160mg 1x/dia" },
            { dosage: "200", unit: "mg", format: "capsula", commonDose: "200mg 1x/dia" },
            { dosage: "250", unit: "mg", format: "capsula", commonDose: "250mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar com as refeições",
    },
    {
        name: "Ezetimiba",
        category: "Hipolipemiante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIDEPRESSIVOS ADICIONAIS
    {
        name: "Paroxetina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 1x/dia", indication: "Dose habitual" },
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-40mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "comprimido", commonDose: "40mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Venlafaxina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "37.5", unit: "mg", format: "capsula", commonDose: "37.5-75mg 1x/dia", indication: "Dose inicial" },
            { dosage: "75", unit: "mg", format: "capsula", commonDose: "75-150mg 1x/dia" },
            { dosage: "150", unit: "mg", format: "capsula", commonDose: "150-225mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Nortriptilina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "10", unit: "mg", format: "capsula", commonDose: "10-25mg 1-3x/dia", indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "capsula", commonDose: "25-75mg 1x/dia" },
            { dosage: "50", unit: "mg", format: "capsula", commonDose: "50-150mg 1x/dia" },
            { dosage: "75", unit: "mg", format: "capsula", commonDose: "75-150mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Clomipramina",
        category: "Antidepressivo Tricíclico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-25mg 1x/dia", indication: "Dose inicial" },
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-150mg 1x/dia" },
            { dosage: "75", unit: "mg", format: "comprimido", commonDose: "75-250mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Bupropiona",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "150", unit: "mg", format: "comprimido", commonDose: "150mg 1-2x/dia" },
            { dosage: "300", unit: "mg", format: "comprimido", commonDose: "300mg 1x/dia", indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Não tomar à noite (pode causar insônia)",
    },
    {
        name: "Trazodona",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1x/dia", indication: "Insônia/dose inicial" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-300mg 1x/dia" },
            { dosage: "150", unit: "mg", format: "comprimido", commonDose: "150-400mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar à noite (causa sonolência)",
    },
    {
        name: "Mirtazapina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "15", unit: "mg", format: "comprimido", commonDose: "15-30mg 1x/dia", indication: "Dose inicial" },
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-45mg 1x/dia" },
            { dosage: "45", unit: "mg", format: "comprimido", commonDose: "45mg 1x/dia" },
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
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 2-3x/dia" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 2-3x/dia" },
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
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1-2mg 2-3x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2mg 2-3x/dia" },
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
            { dosage: "3", unit: "mg", format: "comprimido", commonDose: "1.5-3mg 2-3x/dia" },
            { dosage: "6", unit: "mg", format: "comprimido", commonDose: "6mg 2-3x/dia" },
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
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 1x/dia", indication: "Insônia/dose baixa" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-300mg 1x/dia" },
            { dosage: "200", unit: "mg", format: "comprimido", commonDose: "200-400mg 1x/dia" },
            { dosage: "300", unit: "mg", format: "comprimido", commonDose: "300-600mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar à noite",
    },
    {
        name: "Risperidona",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1-2mg 1-2x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2-4mg 1-2x/dia" },
            { dosage: "3", unit: "mg", format: "comprimido", commonDose: "3-6mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Olanzapina",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "2.5", unit: "mg", format: "comprimido", commonDose: "2.5-5mg 1x/dia", indication: "Dose inicial" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 1x/dia" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Aripiprazol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-15mg 1x/dia" },
            { dosage: "15", unit: "mg", format: "comprimido", commonDose: "15-30mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-30mg 1x/dia" },
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Haloperidol",
        category: "Antipsicótico",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1-5mg 2-3x/dia" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-10mg 2-3x/dia" },
            { dosage: "2", unit: "mg/ml", format: "gotas", commonDose: "5-15 gotas 2-3x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    // ANTICONVULSIVANTES
    {
        name: "Carbamazepina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "200", unit: "mg", format: "comprimido", commonDose: "200-400mg 2-3x/dia" },
            { dosage: "400", unit: "mg", format: "comprimido", commonDose: "400mg 2-3x/dia" },
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
            { dosage: "250", unit: "mg", format: "comprimido", commonDose: "250-500mg 2-3x/dia" },
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-1000mg 2x/dia" },
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
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-200mg 2-3x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Lamotrigina",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25mg 1x/dia", indication: "Dose inicial - titular lentamente" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 1-2x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-200mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Titular lentamente para evitar rash",
    },
    {
        name: "Topiramato",
        category: "Anticonvulsivante",
        route: "oral",
        isControlled: true,
        prescriptionType: 'B1',
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 2x/dia", indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50-100mg 2x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-200mg 2x/dia" },
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
            { dosage: "300", unit: "mg", format: "capsula", commonDose: "300mg 3x/dia", indication: "Dose inicial" },
            { dosage: "400", unit: "mg", format: "capsula", commonDose: "400mg 3x/dia" },
            { dosage: "600", unit: "mg", format: "comprimido", commonDose: "600mg 3x/dia" },
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
            { dosage: "75", unit: "mg", format: "capsula", commonDose: "75mg 2x/dia", indication: "Dose inicial" },
            { dosage: "150", unit: "mg", format: "capsula", commonDose: "150mg 2x/dia" },
            { dosage: "300", unit: "mg", format: "capsula", commonDose: "300mg 2x/dia" },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    // ANTI-INFLAMATÓRIOS ADICIONAIS
    {
        name: "Diclofenaco",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50mg 2-3x/dia" },
            { dosage: "75", unit: "mg", format: "comprimido", commonDose: "75mg 2x/dia", indication: "Liberação prolongada" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 1x/dia", indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Tomar após as refeições",
    },
    {
        name: "Cetoprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "capsula", commonDose: "50mg 3x/dia" },
            { dosage: "100", unit: "mg", format: "capsula", commonDose: "100mg 2x/dia" },
            { dosage: "150", unit: "mg", format: "capsula", commonDose: "150mg 1x/dia", indication: "Liberação prolongada" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Meloxicam",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "7.5", unit: "mg", format: "comprimido", commonDose: "7.5-15mg 1x/dia" },
            { dosage: "15", unit: "mg", format: "comprimido", commonDose: "15mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Piroxicam",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "capsula", commonDose: "20mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Prednisolona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-60mg 1x/dia" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20-40mg 1x/dia" },
            // Apresentação pediátrica
            {
                dosage: "3", unit: "mg/ml", format: "solucao",
                commonDose: "1-2mg/kg/dia 1x/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 1,
                dosePerKgMax: 2,
                concentration: 3, // 3mg/ml
                maxDailyDose: 60,
                frequency: 1
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
            { dosage: "0.5", unit: "mg", format: "comprimido", commonDose: "0.5-4mg 1x/dia" },
            { dosage: "4", unit: "mg", format: "comprimido", commonDose: "4-8mg 1x/dia" },
            // Apresentação pediátrica
            {
                dosage: "0.1", unit: "mg/ml", format: "elixir",
                commonDose: "0.1-0.3mg/kg/dia",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 0.1,
                dosePerKgMax: 0.3,
                concentration: 0.1, // 0.1mg/ml
                maxDailyDose: 16,
                frequency: 1
            },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Betametasona",
        category: "Corticoide",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "comprimido", commonDose: "0.5-2mg 1x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2-4mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // OPIOIDES
    {
        name: "Tramadol",
        category: "Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "50", unit: "mg", format: "capsula", commonDose: "50-100mg 4-6x/dia" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg 2x/dia", indication: "Liberação prolongada" },
            { dosage: "100", unit: "mg/ml", format: "gotas", commonDose: "10-20 gotas 4-6x/dia" },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "Receita A (amarela) - Controle especial",
    },
    {
        name: "Codeína",
        category: "Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-60mg 4-6x/dia" },
            { dosage: "60", unit: "mg", format: "comprimido", commonDose: "60mg 4-6x/dia" },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
        notes: "Receita A (amarela) - Controle especial",
    },
    {
        name: "Morfina",
        category: "Opioide",
        route: "oral",
        isControlled: true,
        prescriptionType: 'A',
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-30mg 4h/4h" },
            { dosage: "30", unit: "mg", format: "comprimido", commonDose: "30-60mg 4h/4h" },
            { dosage: "10", unit: "mg/ml", format: "solucao", commonDose: "10-20mg 4h/4h" },
        ],
        commonFrequencies: ["4h em 4h", "6h em 6h"],
        notes: "Receita A (amarela) - Controle especial",
    },
    // ANTIBIÓTICOS ADICIONAIS
    {
        name: "Amoxicilina + Clavulanato",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500+125", unit: "mg", format: "comprimido", commonDose: "500+125mg 8/8h por 7-10 dias" },
            { dosage: "875+125", unit: "mg", format: "comprimido", commonDose: "875+125mg 12/12h por 7-10 dias" },
            // Apresentações pediátricas
            {
                dosage: "250+62.5", unit: "mg/5ml", format: "suspensao",
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
                dosage: "400+57", unit: "mg/5ml", format: "suspensao",
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
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500mg 1x/dia por 7-14 dias" },
            { dosage: "750", unit: "mg", format: "comprimido", commonDose: "750mg 1x/dia por 5-7 dias" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Cefalexina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "capsula", commonDose: "500mg 6/6h por 7-10 dias" },
            { dosage: "1000", unit: "mg", format: "comprimido", commonDose: "1g 12/12h por 7-10 dias" },
            // Apresentação pediátrica
            {
                dosage: "250", unit: "mg/5ml", format: "suspensao",
                commonDose: "25-50mg/kg/dia dividido 6/6h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 25,
                dosePerKgMax: 50,
                concentration: 50, // 250mg/5ml = 50mg/ml
                maxDailyDose: 4000,
                frequency: 4
            },
        ],
        commonFrequencies: ["6h em 6h", "12h em 12h"],
    },
    {
        name: "Ceftriaxona",
        category: "Antibiótico",
        route: "injetavel",
        presentations: [
            { dosage: "500", unit: "mg", format: "injecao", commonDose: "500mg-1g 1x/dia IM/IV" },
            { dosage: "1000", unit: "mg", format: "injecao", commonDose: "1-2g 1x/dia IM/IV" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfametoxazol + Trimetoprima",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "400+80", unit: "mg", format: "comprimido", commonDose: "800+160mg 12/12h por 7-14 dias" },
            { dosage: "800+160", unit: "mg", format: "comprimido", commonDose: "800+160mg 12/12h" },
            // Apresentação pediátrica
            {
                dosage: "200+40", unit: "mg/5ml", format: "suspensao",
                commonDose: "40-50mg/kg/dia (SMZ) dividido 12/12h",
                indication: "Uso pediátrico (>2 meses)",
                isPediatric: true,
                dosePerKg: 40,
                dosePerKgMax: 50,
                concentration: 40, // 200mg SMZ/5ml = 40mg/ml
                maxDailyDose: 1600,
                frequency: 2
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
            { dosage: "250", unit: "mg", format: "comprimido", commonDose: "250-500mg 8/8h" },
            { dosage: "400", unit: "mg", format: "comprimido", commonDose: "400mg 8/8h" },
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500mg 8/8h por 7-10 dias" },
            // Apresentação pediátrica
            {
                dosage: "40", unit: "mg/ml", format: "suspensao",
                commonDose: "30-40mg/kg/dia dividido 8/8h",
                indication: "Uso pediátrico",
                isPediatric: true,
                dosePerKg: 30,
                dosePerKgMax: 40,
                concentration: 40, // 40mg/ml
                maxDailyDose: 2000,
                frequency: 3
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
            { dosage: "150", unit: "mg", format: "capsula", commonDose: "150-300mg 6/6h" },
            { dosage: "300", unit: "mg", format: "capsula", commonDose: "300-600mg 6/6h" },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
    },
    // GASTROPROTETORES ADICIONAIS
    {
        name: "Esomeprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "capsula", commonDose: "20mg 1x/dia" },
            { dosage: "40", unit: "mg", format: "capsula", commonDose: "40mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Lansoprazol",
        category: "Inibidor de Bomba de Prótons",
        route: "oral",
        presentations: [
            { dosage: "15", unit: "mg", format: "capsula", commonDose: "15mg 1x/dia" },
            { dosage: "30", unit: "mg", format: "capsula", commonDose: "30mg 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar em jejum",
    },
    {
        name: "Ranitidina",
        category: "Antagonista H2",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "comprimido", commonDose: "150mg 2x/dia" },
            { dosage: "300", unit: "mg", format: "comprimido", commonDose: "300mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Domperidona",
        category: "Procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 3x/dia" },
        ],
        commonFrequencies: ["3x ao dia"],
        notes: "Tomar 15-30min antes das refeições",
    },
    {
        name: "Metoclopramida",
        category: "Procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 3x/dia" },
            { dosage: "4", unit: "mg/ml", format: "gotas", commonDose: "10-15 gotas 3x/dia" },
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
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100-150mg 3x/dia", indication: "Hipertireoidismo" },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Metimazol",
        category: "Antitireoidiano",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5-20mg 1x/dia" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-30mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANTIALÉRGICOS ADICIONAIS
    {
        name: "Desloratadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Cetirizina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Fexofenadina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "120", unit: "mg", format: "comprimido", commonDose: "120mg 1x/dia" },
            { dosage: "180", unit: "mg", format: "comprimido", commonDose: "180mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroxizina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg 2-3x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50mg 2-3x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        notes: "Pode causar sonolência",
    },
    {
        name: "Prometazina",
        category: "Anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25mg 1-3x/dia" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50mg 1x/dia" },
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
            { dosage: "75", unit: "mg", format: "comprimido", commonDose: "75mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Varfarina",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "Conforme INR" },
            { dosage: "2.5", unit: "mg", format: "comprimido", commonDose: "Conforme INR" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "2.5-10mg 1x/dia conforme INR" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Monitorar INR regularmente",
    },
    {
        name: "Rivaroxabana",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10mg 1x/dia", indication: "Profilaxia TVP" },
            { dosage: "15", unit: "mg", format: "comprimido", commonDose: "15mg 2x/dia", indication: "TEV fase aguda" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg 1x/dia", indication: "FA, TEV manutenção" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar com alimentos",
    },
    {
        name: "Apixabana",
        category: "Anticoagulante",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "comprimido", commonDose: "2.5mg 2x/dia", indication: "Dose reduzida" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 2x/dia" },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    // UROLOGIA
    {
        name: "Sildenafila",
        category: "Disfunção Erétil",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "comprimido", commonDose: "25-50mg quando necessário", indication: "Dose inicial" },
            { dosage: "50", unit: "mg", format: "comprimido", commonDose: "50mg quando necessário" },
            { dosage: "100", unit: "mg", format: "comprimido", commonDose: "100mg quando necessário" },
        ],
        commonFrequencies: ["Quando necessário"],
        notes: "Tomar 30-60min antes da atividade sexual",
    },
    {
        name: "Tadalafila",
        category: "Disfunção Erétil",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 1x/dia", indication: "Uso diário" },
            { dosage: "10", unit: "mg", format: "comprimido", commonDose: "10-20mg quando necessário" },
            { dosage: "20", unit: "mg", format: "comprimido", commonDose: "20mg quando necessário" },
        ],
        commonFrequencies: ["1x ao dia", "Quando necessário"],
    },
    {
        name: "Finasterida",
        category: "Urologia",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1mg 1x/dia", indication: "Calvície" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 1x/dia", indication: "HPB" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Tamsulosina",
        category: "Urologia",
        route: "oral",
        presentations: [
            { dosage: "0.4", unit: "mg", format: "capsula", commonDose: "0.4mg 1x/dia", indication: "HPB" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar após o café da manhã",
    },
    {
        name: "Doxazosina",
        category: "Urologia/Anti-hipertensivo",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "2-4mg 1x/dia" },
            { dosage: "4", unit: "mg", format: "comprimido", commonDose: "4-8mg 1x/dia" },
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
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-1000mg 1-2x/dia" },
            { dosage: "600", unit: "mg", format: "comprimido", commonDose: "600mg 1-2x/dia" },
            { dosage: "1250", unit: "mg", format: "comprimido", commonDose: "1250mg 1x/dia", indication: "= 500mg Ca elemento" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar com as refeições",
    },
    {
        name: "Vitamina D",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "1000", unit: "UI", format: "comprimido", commonDose: "1000-2000 UI 1x/dia" },
            { dosage: "2000", unit: "UI", format: "capsula", commonDose: "2000 UI 1x/dia" },
            { dosage: "5000", unit: "UI", format: "capsula", commonDose: "5000 UI 1x/dia", indication: "Deficiência moderada" },
            { dosage: "7000", unit: "UI", format: "capsula", commonDose: "7000 UI 1x/semana" },
            { dosage: "50000", unit: "UI", format: "capsula", commonDose: "50000 UI 1x/semana", indication: "Deficiência grave" },
        ],
        commonFrequencies: ["1x ao dia", "1x por semana"],
    },
    {
        name: "Vitamina B12",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "1000", unit: "mcg", format: "comprimido", commonDose: "1000mcg 1x/dia" },
            { dosage: "2500", unit: "mcg", format: "comprimido", commonDose: "2500mcg 1x/dia" },
            { dosage: "5000", unit: "mcg", format: "comprimido", commonDose: "5000mcg 1x/dia", indication: "Deficiência" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ácido Fólico",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "0.4", unit: "mg", format: "comprimido", commonDose: "0.4mg 1x/dia", indication: "Gestação" },
            { dosage: "1", unit: "mg", format: "comprimido", commonDose: "1mg 1x/dia" },
            { dosage: "5", unit: "mg", format: "comprimido", commonDose: "5mg 1x/dia", indication: "Deficiência" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfato Ferroso",
        category: "Suplemento",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg Fe", format: "comprimido", commonDose: "40-80mg Fe 1-2x/dia" },
            { dosage: "60", unit: "mg Fe", format: "comprimido", commonDose: "60mg Fe 1-2x/dia" },
            { dosage: "25", unit: "mg/ml", format: "gotas", commonDose: "20-40 gotas 1-2x/dia" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        notes: "Tomar em jejum com vitamina C para melhor absorção",
    },
];

// Lista simples de nomes de medicamentos para autocomplete
const ALL_MEDICATIONS = MEDICATION_DATABASE.map(m => m.name).sort();

const MEDICATION_FORMATS = [
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
];

const DOSAGE_UNITS = [
    { value: "mg", label: "mg" },
    { value: "g", label: "g" },
    { value: "mcg", label: "mcg" },
    { value: "ml", label: "ml" },
    { value: "UI", label: "UI" },
    { value: "%", label: "%" },
    { value: "gotas", label: "gotas" },
    { value: "mg/ml", label: "mg/ml" },
    { value: "mg/5ml", label: "mg/5ml" },
];

const FREQUENCIES = [
    { value: "1x ao dia", label: "1x ao dia" },
    { value: "2x ao dia", label: "2x ao dia" },
    { value: "3x ao dia", label: "3x ao dia" },
    { value: "4x ao dia", label: "4x ao dia" },
    { value: "12h em 12h", label: "12h em 12h" },
    { value: "8h em 8h", label: "8h em 8h" },
    { value: "6h em 6h", label: "6h em 6h" },
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
        "colírio": "colirio"
    };

    if (overrides[lower]) return overrides[lower];

    return lower
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c");
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
    const [patientWeight, setPatientWeight] = useState<string>("");

    // Ref para controlar quando ignorar o próximo evento de foco (após seleção)
    const skipNextFocusRef = useRef(false);

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
            const medInfo = MEDICATION_DATABASE.find(
                m => m.name.toLowerCase() === selectedMedName.toLowerCase()
            );
            setSelectedMedInfo(medInfo || null);

            // Auto-preencher via de administração se disponível
            if (medInfo && medInfo.route) {
                form.setValue("administrationRoute", medInfo.route);
            }
        } else {
            setSelectedMedInfo(null);
        }
    }, [selectedMedName, form]);

    // Filtrar medicamentos baseado na busca
    const filteredMedications = useMemo(() => {
        if (!searchValue) return ALL_MEDICATIONS.slice(0, 20);
        return ALL_MEDICATIONS.filter(med =>
            med.toLowerCase().includes(searchValue.toLowerCase())
        ).slice(0, 20);
    }, [searchValue]);

    // Watch para cálculo automático de quantidade
    const watchedFrequency = form.watch("frequency");
    const watchedFormat = form.watch("format");
    const watchedDoseAmount = form.watch("doseAmount");

    // Calcular quantidade automaticamente baseada na frequência (para 30 dias)
    useEffect(() => {
        if (!watchedFrequency) return;

        // Apenas calcular para formas sólidas comuns
        const formatLower = (watchedFormat || "").toLowerCase();
        const isSolid = formatLower.includes("comprimido") || formatLower.includes("capsula") || formatLower.includes("cápsula");

        if (!isSolid) return;

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
            default: return; // Não calcular para "Quando necessário" ou outros
        }

        const dose = watchedDoseAmount || 1;
        const totalQuantity = dose * frequencyMultiplier;

        let suffix = "comprimidos";
        if (formatLower.includes("capsula") || formatLower.includes("cápsula")) {
            suffix = "cápsulas";
        }

        form.setValue("quantity", `${totalQuantity} ${suffix}`);
    }, [watchedFrequency, watchedFormat, watchedDoseAmount, form]);

    // Função para aplicar sugestão de dosagem
    const applyDosageSuggestion = useCallback((presentation: MedicationPresentation) => {
        // Marcar para ignorar o próximo foco
        skipNextFocusRef.current = true;

        form.setValue("dosage", presentation.dosage);
        form.setValue("dosageUnit", presentation.unit);
        form.setValue("format", normalizeFormat(presentation.format));
        form.setValue("doseAmount", 1);
        setDosagePopoverOpen(false);

        // Resetar o flag após um curto delay
        setTimeout(() => {
            skipNextFocusRef.current = false;
        }, 200);
    }, [form]);

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
                                    <Popover open={medicationOpen} onOpenChange={setMedicationOpen}>
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
                                                    <span className="flex items-center gap-2">
                                                        {field.value || "Selecione o medicamento"}
                                                        {selectedMedInfo?.isControlled && (
                                                            <Badge variant="secondary" className="text-xs">Controlado</Badge>
                                                        )}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <div className="flex items-center border-b px-3">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Buscar medicamento..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {filteredMedications.length === 0 ? (
                                                    <div className="py-6 text-center text-sm">
                                                        <p>Nenhum medicamento encontrado.</p>
                                                        {searchValue && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="mt-2"
                                                                onClick={() => {
                                                                    field.onChange(searchValue);
                                                                    setMedicationOpen(false);
                                                                    setSearchValue("");
                                                                }}
                                                            >
                                                                Usar "{searchValue}"
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    filteredMedications.map((medication) => {
                                                        const medInfo = MEDICATION_DATABASE.find(m => m.name === medication);
                                                        return (
                                                            <div
                                                                key={medication}
                                                                className={cn(
                                                                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                                                    field.value === medication && "bg-accent"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(medication);
                                                                    setMedicationOpen(false);
                                                                    setSearchValue("");
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4",
                                                                        field.value === medication ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="flex-1">{medication}</span>
                                                                {medInfo?.isControlled && (
                                                                    <Badge variant="secondary" className="text-xs">Controlado</Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
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
                            <FormField
                                control={form.control}
                                name="prescriptionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Receituário</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value || "padrao"}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="padrao">🟢 Padrão</SelectItem>
                                                    <SelectItem value="especial">🟡 Especial (2 vias)</SelectItem>
                                                    <SelectItem value="A">🟠 A - Opioides (Amarela)</SelectItem>
                                                    <SelectItem value="B1">🔵 B1 - Psicotrópicos (Azul)</SelectItem>
                                                    <SelectItem value="B2">🔵 B2 - Anorexígenos (Azul)</SelectItem>
                                                    <SelectItem value="C">⚪ C - Retinoides</SelectItem>
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
                                        <FormLabel>Dosagem *</FormLabel>
                                        <Popover open={dosagePopoverOpen} onOpenChange={setDosagePopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Ex: 50"
                                                        {...field}
                                                        onFocus={() => {
                                                            // Só abre o popup se não acabou de fechar por uma seleção
                                                            if (selectedMedInfo && !skipNextFocusRef.current) {
                                                                setDosagePopoverOpen(true);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                            </PopoverTrigger>
                                            {selectedMedInfo && (
                                                <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 border-b">
                                                        <div className="flex items-center gap-2 text-blue-700">
                                                            <Sparkles className="h-4 w-4" />
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

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="doseAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantidade</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
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
                                            <FormLabel>Total</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: 60 comprimidos" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                    onClick={onRemove}
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
        </Dialog>
    );
}
