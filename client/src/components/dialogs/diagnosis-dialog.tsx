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
import { CID10Selector } from "@/components/cid10-selector";

export const diagnosisSchema = z.object({
    cidCode: z.string().min(1, "Código CID-10 é obrigatório"),
    diagnosisDate: z.string().min(1, "Data é obrigatória"),
    status: z.enum(["ativo", "em_tratamento", "resolvido", "cronico", "curado", "controlado"]).optional(),
    notes: z.string().optional(),
});

export type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

interface DiagnosisDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<DiagnosisFormData>;
    onSubmit: (data: DiagnosisFormData) => void;
    isPending: boolean;
    mode: "create" | "edit";
    onRemove?: () => void;
    isRemovePending?: boolean;
}

export function DiagnosisDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    mode,
    onRemove,
    isRemovePending,
}: DiagnosisDialogProps) {
    const isEdit = mode === "edit";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Diagnóstico" : "Registrar Novo Diagnóstico"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Modifique ou remova este diagnóstico da sua linha do tempo"
                            : "Adicione um diagnóstico médico à sua linha do tempo"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="cidCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código CID-10 *</FormLabel>
                                        <FormControl>
                                            <CID10Selector
                                                value={field.value || ""}
                                                onValueChange={field.onChange}
                                                placeholder="Buscar código CID-10..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className={isEdit ? "grid grid-cols-2 gap-4" : ""}>
                                <FormField
                                    control={form.control}
                                    name="diagnosisDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data do Diagnóstico{isEdit ? " *" : ""}</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status{isEdit ? " *" : ""}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ativo">Ativo</SelectItem>
                                                    <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
                                                    <SelectItem value="resolvido">Resolvido</SelectItem>
                                                    <SelectItem value="cronico">Crônico</SelectItem>
                                                    {isEdit && (
                                                        <>
                                                            <SelectItem value="curado">Curado</SelectItem>
                                                            <SelectItem value="controlado">Controlado</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
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
                                                placeholder="Adicione observações sobre o diagnóstico..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className={isEdit ? "flex justify-between gap-3" : "flex justify-end gap-3"}>
                            {isEdit && onRemove && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onRemove}
                                    disabled={isRemovePending}
                                >
                                    {isRemovePending ? "Removendo..." : "Remover Diagnóstico"}
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
                                            : "Registrando..."
                                        : isEdit
                                            ? "Salvar Alterações"
                                            : "Registrar Diagnóstico"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
