import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo, useEffect } from "react";
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
}

interface MedicationInfo {
    name: string;
    presentations: MedicationPresentation[];
    category: string;
    route: string;
    isControlled?: boolean;
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
        presentations: [
            { dosage: "20", unit: "mg", format: "cápsula", commonDose: "20-40mg 1x/dia", indication: "Depressão, TOC" },
            { dosage: "40", unit: "mg", format: "cápsula", commonDose: "40-60mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
        notes: "Tomar pela manhã",
    },
    {
        name: "Sertralina",
        category: "Antidepressivo",
        route: "oral",
        isControlled: true,
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
        presentations: [
            { dosage: "30", unit: "mg", format: "cápsula", commonDose: "30-60mg 1x/dia", indication: "Depressão, fibromialgia" },
            { dosage: "60", unit: "mg", format: "cápsula", commonDose: "60mg 1x/dia" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    // ANSIOLÍTICOS / SEDATIVOS
    {
        name: "Clonazepam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
        presentations: [
            { dosage: "0.25", unit: "mg", format: "comprimido", commonDose: "0.25-0.5mg 2-3x/dia" },
            { dosage: "0.5", unit: "mg", format: "comprimido", commonDose: "0.5-1mg 2-3x/dia" },
            { dosage: "2", unit: "mg", format: "comprimido", commonDose: "1-2mg 2-3x/dia" },
            { dosage: "2.5", unit: "mg/ml", format: "gotas", commonDose: "5-10 gotas 2-3x/dia" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia", "Quando necessário"],
        notes: "Receita B1 (azul) - Controle especial",
    },
    {
        name: "Alprazolam",
        category: "Ansiolítico",
        route: "oral",
        isControlled: true,
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
            { dosage: "20", unit: "mg", format: "cápsula", commonDose: "20mg 1x/dia", indication: "Proteção gástrica" },
            { dosage: "40", unit: "mg", format: "cápsula", commonDose: "40mg 1x/dia", indication: "DRGE, úlcera" },
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
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h", "Quando necessário"],
        notes: "Dose máxima: 4g/dia",
    },
    {
        name: "Dipirona",
        category: "Analgésico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500-1000mg 4x/dia" },
            { dosage: "1000", unit: "mg", format: "comprimido", commonDose: "1000mg 4x/dia" },
            { dosage: "500", unit: "mg/ml", format: "gotas", commonDose: "20-40 gotas 4x/dia" },
        ],
        commonFrequencies: ["6h em 6h", "8h em 8h"],
    },
    {
        name: "Ibuprofeno",
        category: "Anti-inflamatório",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "comprimido", commonDose: "200-400mg 3-4x/dia" },
            { dosage: "400", unit: "mg", format: "comprimido", commonDose: "400mg 3-4x/dia" },
            { dosage: "600", unit: "mg", format: "comprimido", commonDose: "600mg 3x/dia" },
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
        notes: "Uso máximo: 15 dias",
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
            { dosage: "500", unit: "mg", format: "cápsula", commonDose: "500mg 8/8h por 7 dias" },
            { dosage: "875", unit: "mg", format: "comprimido", commonDose: "875mg 12/12h por 7 dias" },
        ],
        commonFrequencies: ["8h em 8h", "12h em 12h"],
    },
    {
        name: "Azitromicina",
        category: "Antibiótico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "comprimido", commonDose: "500mg 1x/dia por 3-5 dias" },
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
];

// Lista simples de nomes de medicamentos para autocomplete
const COMMON_MEDICATIONS = MEDICATION_DATABASE.map(m => m.name).sort();

// Medicamentos adicionais
const ADDITIONAL_MEDICATIONS = [
    "Captopril", "Atenolol", "Metoprolol", "Nifedipino", "Valsartana", "Furosemida", "Espironolactona",
    "Glibenclamida", "Glimepirida", "Glicazida", "Insulina NPH", "Insulina Regular", "Dapagliflozina",
    "Pravastatina", "Fenofibrato", "Ezetimiba",
    "Paroxetina", "Venlafaxina", "Nortriptilina", "Clomipramina", "Bupropiona", "Trazodona", "Mirtazapina",
    "Diazepam", "Lorazepam", "Bromazepam",
    "Quetiapina", "Risperidona", "Olanzapina", "Aripiprazol", "Haloperidol",
    "Carbamazepina", "Valproato de Sódio", "Fenitoína", "Lamotrigina", "Topiramato", "Gabapentina", "Pregabalina",
    "Diclofenaco", "Cetoprofeno", "Meloxicam", "Piroxicam", "Prednisolona", "Dexametasona", "Betametasona",
    "Tramadol", "Codeína", "Morfina",
    "Amoxicilina + Clavulanato", "Levofloxacino", "Cefalexina", "Ceftriaxona",
    "Sulfametoxazol + Trimetoprima", "Metronidazol", "Clindamicina",
    "Esomeprazol", "Lansoprazol", "Ranitidina", "Domperidona", "Metoclopramida",
    "Propiltiouracil", "Metimazol",
    "Desloratadina", "Cetirizina", "Fexofenadina", "Hidroxizina", "Prometazina",
    "Clopidogrel", "Varfarina", "Rivaroxabana", "Apixabana",
    "Sildenafila", "Tadalafila", "Finasterida", "Tamsulosina", "Doxazosina",
    "Carbonato de Cálcio", "Vitamina D", "Vitamina B12", "Ácido Fólico", "Sulfato Ferroso",
].sort();

const ALL_MEDICATIONS = [...new Set([...COMMON_MEDICATIONS, ...ADDITIONAL_MEDICATIONS])].sort();

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

    // Função para aplicar sugestão de dosagem
    const applyDosageSuggestion = (presentation: MedicationPresentation) => {
        form.setValue("dosage", presentation.dosage);
        form.setValue("dosageUnit", presentation.unit);
        form.setValue("format", presentation.format);
        setDosagePopoverOpen(false);
    };

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
                                                            if (selectedMedInfo) {
                                                                setDosagePopoverOpen(true);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                            </PopoverTrigger>
                                            {selectedMedInfo && (
                                                <PopoverContent className="w-[350px] p-0" align="start" side="bottom">
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b">
                                                        <div className="flex items-center gap-2 text-blue-700">
                                                            <Sparkles className="h-4 w-4" />
                                                            <span className="font-medium text-sm">Sugestão IA</span>
                                                            <Badge variant="outline" className="text-xs ml-auto">{selectedMedInfo.category}</Badge>
                                                        </div>
                                                        <p className="text-xs text-blue-600 mt-1">Apresentações disponíveis para {selectedMedInfo.name}:</p>
                                                    </div>
                                                    <div className="p-2 max-h-[200px] overflow-y-auto">
                                                        {selectedMedInfo.presentations.map((pres, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                                                                onClick={() => applyDosageSuggestion(pres)}
                                                            >
                                                                <div>
                                                                    <span className="font-semibold text-gray-900">{pres.dosage}{pres.unit}</span>
                                                                    <span className="text-gray-500 ml-2 text-sm">({pres.format})</span>
                                                                </div>
                                                                {pres.commonDose && (
                                                                    <span className="text-xs text-gray-500">{pres.commonDose}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {selectedMedInfo.notes && (
                                                        <div className="bg-amber-50 p-2 border-t flex items-start gap-2">
                                                            <Lightbulb className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-xs text-amber-700">{selectedMedInfo.notes}</span>
                                                        </div>
                                                    )}
                                                    {selectedMedInfo.isControlled && (
                                                        <div className="bg-red-50 p-2 border-t">
                                                            <span className="text-xs text-red-700">⚠️ Medicamento controlado - Requer receita especial</span>
                                                        </div>
                                                    )}
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
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 60 comprimidos" {...field} />
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
