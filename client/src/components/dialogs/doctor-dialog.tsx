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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const doctorSchema = z.object({
    name: z.string().min(1, "Nome do médico é obrigatório"),
    crm: z.string().min(1, "CRM é obrigatório"),
    specialty: z.string().optional(),
    isDefault: z.boolean().optional(),
});

export type DoctorFormData = z.infer<typeof doctorSchema>;

interface DoctorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<DoctorFormData>;
    onSubmit: (data: DoctorFormData) => void;
    isPending: boolean;
}

export function DoctorDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
}: DoctorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Médico</DialogTitle>
                    <DialogDescription>
                        Adicione um médico para usar nas prescrições
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Médico *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dr. João Silva" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="crm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CRM *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345/SP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Especialidade (opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cardiologia" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Cadastrando..." : "Cadastrar Médico"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
