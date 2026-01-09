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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const surgerySchema = z.object({
    procedureName: z.string().min(1, "Nome do procedimento é obrigatório"),
    hospitalName: z.string().optional(),
    surgeonName: z.string().optional(),
    surgeryDate: z.string().min(1, "Data da cirurgia é obrigatória"),
    notes: z.string().optional(),
});

export type SurgeryFormData = z.infer<typeof surgerySchema>;

interface SurgeryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<SurgeryFormData>;
    onSubmit: (data: SurgeryFormData) => void;
    isPending: boolean;
    mode: "create" | "edit";
    onRemove?: () => void;
    isRemovePending?: boolean;
}

export function SurgeryDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    mode,
    onRemove,
    isRemovePending,
}: SurgeryDialogProps) {
    const isEdit = mode === "edit";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Cirurgia" : "Registrar Nova Cirurgia"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="procedureName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Procedimento *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Apendicectomia..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="hospitalName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hospital (opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Hospital Albert Einstein..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="surgeonName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cirurgião (opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Dr. Silva..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="surgeryDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data da Cirurgia *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (opcional)</FormLabel>
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
                                    {isRemovePending ? "Removendo..." : "Remover Cirurgia"}
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
                                            : "Salvar Cirurgia"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
