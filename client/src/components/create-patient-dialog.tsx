
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useProfiles } from "@/hooks/use-profiles";

const profileSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    gender: z.string().min(1, "Gênero é obrigatório"),
    birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
    phone: z.string().min(10, "Telefone é obrigatório"),
    planType: z.string().optional(),
    // All other fields optional
    cpf: z.string().optional(),
    rg: z.string().optional(),
    landline: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    guardianName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    profession: z.string().optional(),
    maritalStatus: z.string().optional(),
    insuranceCardNumber: z.string().optional(),
    insuranceValidity: z.string().optional(),
    insuranceName: z.string().optional(),
    referralSource: z.string().optional(),
    notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CreatePatientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function CreatePatientDialog({ open, onOpenChange, onSuccess }: CreatePatientDialogProps) {
    const { createProfile } = useProfiles();

    const createForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            gender: "",
            birthDate: "",
            phone: "",
            planType: "",
            cpf: "",
            rg: "",
            landline: "",
            email: "",
            cep: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            guardianName: "",
            emergencyPhone: "",
            profession: "",
            maritalStatus: "",
            insuranceCardNumber: "",
            insuranceValidity: "",
            insuranceName: "",
            referralSource: "",
            notes: "",
        },
    });

    const onCreateSubmit = (data: ProfileFormData) => {
        createProfile({
            name: data.name,
            gender: data.gender,
            birthDate: data.birthDate,
            phone: data.phone,
            planType: data.planType || null,
            relationship: null,
            bloodType: null,
            isDefault: false,
            // Identification
            cpf: data.cpf || null,
            rg: data.rg || null,
            landline: data.landline || null,
            email: data.email || null,
            // Address
            cep: data.cep || null,
            street: data.street || null,
            number: data.number || null,
            complement: data.complement || null,
            neighborhood: data.neighborhood || null,
            city: data.city || null,
            state: data.state || null,
            // Complementary
            guardianName: data.guardianName || null,
            emergencyPhone: data.emergencyPhone || null,
            profession: data.profession || null,
            maritalStatus: data.maritalStatus || null,
            // Administrative
            insuranceCardNumber: data.insuranceCardNumber || null,
            insuranceValidity: data.insuranceValidity || null,
            insuranceName: data.insuranceName || null,
            referralSource: data.referralSource || null,
            notes: data.notes || null,
        });
        onOpenChange(false);
        createForm.reset();
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar novo paciente</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                        {/* Dados Básicos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Dados Básicos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome completo *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do paciente" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 00000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gênero *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o gênero" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                                    <SelectItem value="Feminino">Feminino</SelectItem>
                                                    <SelectItem value="Outro">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="birthDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de nascimento *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Identificação */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Identificação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="cpf"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPF</FormLabel>
                                            <FormControl>
                                                <Input placeholder="000.000.000-00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="rg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RG</FormLabel>
                                            <FormControl>
                                                <Input placeholder="00.000.000-0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="email@exemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="landline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone fixo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 0000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Endereço</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="cep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CEP</FormLabel>
                                            <FormControl>
                                                <Input placeholder="00000-000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Rua</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome da rua" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="complement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Apto, bloco..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="neighborhood"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bairro</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Bairro" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cidade" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <FormControl>
                                                <Input placeholder="UF" maxLength={2} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Dados Complementares */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Dados Complementares</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="guardianName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do responsável</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome completo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="emergencyPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone de emergência</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 00000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="profession"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profissão</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Profissão" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="maritalStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado civil</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                                    <SelectItem value="União estável">União estável</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Informações do Plano */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Informações do Plano</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="planType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de plano</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SUS, particular, convênio..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="insuranceName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do convênio</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do convênio" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="insuranceCardNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número da carteirinha</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Número da carteirinha" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="insuranceValidity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Validade da carteirinha</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Outros */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Outros</h3>
                            <FormField
                                control={createForm.control}
                                name="referralSource"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Indicação (Como conheceu?)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Indicação" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observações</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Observações gerais sobre o paciente" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Cadastrar Paciente</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
