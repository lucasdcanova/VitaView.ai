import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
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

export const allergySchema = z.object({
    allergen: z.string().min(1, "Nome do alérgeno é obrigatório"),
    allergenType: z.string().default("medication"),
    reaction: z.string().optional(),
    severity: z.enum(["leve", "moderada", "grave"]).optional(),
    notes: z.string().optional(),
});

export type AllergyFormData = z.infer<typeof allergySchema>;

const ALLERGEN_TYPES = [
    { value: "medication", label: "Medicamento" },
    { value: "food", label: "Alimento" },
    { value: "environment", label: "Ambiental" },
];

const SEVERITY_OPTIONS = [
    { value: "leve", label: "Leve" },
    { value: "moderada", label: "Moderada" },
    { value: "grave", label: "Grave" },
];

interface AllergyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<AllergyFormData>;
    onSubmit: (data: AllergyFormData) => void;
    isPending: boolean;
    mode: "create" | "edit";
    onRemove?: () => void;
    isRemovePending?: boolean;
}

export function AllergyDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    mode,
    onRemove,
    isRemovePending,
}: AllergyDialogProps) {
    const isEdit = mode === "edit";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Alergia" : "Adicionar Nova Alergia"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="allergen"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Medicamento/Substância</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Penicilina, Dipirona..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allergenType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALLERGEN_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reaction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reação</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Erupção cutânea, inchaço..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gravidade</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a gravidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SEVERITY_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Informações adicionais..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className={isEdit ? "flex justify-between gap-3 pt-4" : "flex gap-3 pt-4"}>
                            {isEdit && onRemove && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onRemove}
                                    disabled={isRemovePending}
                                >
                                    {isRemovePending ? "Removendo..." : "Remover Alergia"}
                                </Button>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending
                                        ? "Salvando..."
                                        : isEdit
                                            ? "Salvar Alterações"
                                            : "Salvar Alergia"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
