import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const medicationSchema = z.object({
    name: z.string().min(1, "Nome do medicamento é obrigatório"),
    format: z.string().default("comprimido"),
    dosage: z.string().min(1, "Dosagem é obrigatória"),
    dosageUnit: z.string().default("mg"),
    frequency: z.string().min(1, "Frequência é obrigatória"),
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

const MEDICATION_FORMATS = [
    { value: "comprimido", label: "Comprimido" },
    { value: "capsula", label: "Cápsula" },
    { value: "solucao", label: "Solução" },
    { value: "xarope", label: "Xarope" },
    { value: "gotas", label: "Gotas" },
    { value: "injecao", label: "Injeção" },
    { value: "creme", label: "Creme" },
    { value: "pomada", label: "Pomada" },
];

const DOSAGE_UNITS = [
    { value: "mg", label: "mg (miligramas)" },
    { value: "g", label: "g (gramas)" },
    { value: "mcg", label: "mcg (microgramas)" },
    { value: "ml", label: "ml (mililitros)" },
    { value: "UI", label: "UI (unidades internacionais)" },
    { value: "%", label: "% (porcentagem)" },
    { value: "gotas", label: "gotas" },
    { value: "comprimido(s)", label: "comprimido(s)" },
    { value: "cápsula(s)", label: "cápsula(s)" },
];

const FREQUENCIES = [
    { value: "1x-dia", label: "1x ao dia" },
    { value: "2x-dia", label: "2x ao dia" },
    { value: "3x-dia", label: "3x ao dia" },
    { value: "4x-dia", label: "4x ao dia" },
    { value: "12h-12h", label: "12h em 12h" },
    { value: "8h-8h", label: "8h em 8h" },
    { value: "6h-6h", label: "6h em 6h" },
    { value: "quando-necessario", label: "Quando necessário" },
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Medicamento *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Losartana" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                name="dosage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dosagem *</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 50" min="0" step="0.01" {...field} />
                                        </FormControl>
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
                                                    <SelectValue placeholder="Selecione a unidade" />
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
