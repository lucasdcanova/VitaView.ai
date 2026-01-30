
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Profile } from "@shared/schema";
import { AlertTriangle } from "lucide-react";

const deathSchema = z.object({
    deathDate: z.string().min(1, "Data do óbito é obrigatória"),
    deathTime: z.string().optional(),
    deathCause: z.string().min(1, "Causa do óbito é obrigatória"),
});

type DeathFormData = z.infer<typeof deathSchema>;

interface RegisterDeathDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patient: Profile;
    onSuccess?: () => void;
}

export function RegisterDeathDialog({
    open,
    onOpenChange,
    patient,
    onSuccess,
}: RegisterDeathDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<DeathFormData>({
        resolver: zodResolver(deathSchema),
        defaultValues: {
            deathDate: new Date().toISOString().split("T")[0],
            deathTime: "",
            deathCause: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: DeathFormData) => {
            const res = await apiRequest("PUT", `/api/profiles/${patient.id}`, {
                ...data,
                deceased: true,
            });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Óbito registrado",
                description: "As informações de óbito foram salvas com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
            queryClient.invalidateQueries({ queryKey: ["/api/patient-dashboard", patient.id] });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Não foi possível registrar o óbito. Tente novamente.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: DeathFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Registrar Óbito
                    </DialogTitle>
                    <DialogDescription>
                        Esta ação marcará o paciente <strong>{patient.name}</strong> como falecido.
                        Preencha os dados abaixo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="deathDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data do Óbito</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deathTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="deathCause"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Causa do Óbito</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva a causa principal do óbito..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={mutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Salvando..." : "Confirmar Óbito"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
