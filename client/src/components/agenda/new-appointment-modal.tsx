import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Clock, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    profileId: z.string({
        required_error: "Selecione um paciente.",
    }),
    patientName: z.string().optional(),
    type: z.enum(["consulta", "retorno", "exames", "urgencia"], {
        required_error: "Selecione o tipo de consulta.",
    }),
    date: z.date({
        required_error: "Selecione uma data.",
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Horário inválido (HH:MM).",
    }),
    price: z.string().optional(),
    notes: z.string().optional(),
});

interface NewAppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (data: any) => void;
    initialData?: any;
}

export function NewAppointmentModal({ open, onOpenChange, onSuccess, initialData }: NewAppointmentModalProps) {
    const [openCombobox, setOpenCombobox] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            time: "09:00",
            notes: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Format price from cents (123456) to string ("1.234,56")
                let priceFormatted = "";
                if (initialData.price) {
                    priceFormatted = (initialData.price / 100).toFixed(2).replace('.', ',');
                    priceFormatted = priceFormatted.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                }

                form.reset({
                    profileId: initialData.userId ? initialData.userId.toString() : (initialData.profileId ? initialData.profileId.toString() : ""),
                    type: initialData.type,
                    date: new Date(initialData.date + 'T12:00:00'),
                    time: initialData.time,
                    notes: initialData.notes || "",
                    price: priceFormatted
                });
            } else {
                form.reset({
                    time: "09:00",
                    notes: "",
                    price: ""
                });
            }
        }
    }, [open, initialData, form]);

    const { data: profiles = [] } = useQuery<any[]>({
        queryKey: ["/api/profiles"],
        enabled: open, // Only fetch when modal is open
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const selectedProfile = profiles.find((p: any) => p.id.toString() === values.profileId);

        let priceAmount = undefined;
        if (values.price) {
            // Convert "1.234,56" to 123456 (cents)
            const cleanPrice = values.price.replace(/\./g, "").replace(",", "");
            priceAmount = parseInt(cleanPrice);
        }

        // Format date as YYYY-MM-DD string for the backend
        const formattedDate = format(values.date, 'yyyy-MM-dd');

        const submissionData = {
            ...values,
            date: formattedDate, // Override the Date object with formatted string
            profileId: parseInt(values.profileId),
            patientName: selectedProfile ? selectedProfile.name : "Paciente",
            price: priceAmount,
        };

        console.log(submissionData);
        if (onSuccess) {
            onSuccess(submissionData);
        }
        if (onSuccess) {
            onSuccess(submissionData);
        }
        onOpenChange(false);
        form.reset();
        setOpenCombobox(false);
    }

    const isEditing = !!initialData;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Consulta" : "Nova Consulta"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Altere os dados da consulta." : "Selecione um paciente e preencha os dados da consulta."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="profileId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Paciente</FormLabel>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? profiles.find((profile) => profile.id.toString() === field.value)?.name
                                                        : "Selecione o paciente"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar paciente..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {profiles.map((profile) => (
                                                            <CommandItem
                                                                value={profile.name}
                                                                key={profile.id}
                                                                onSelect={() => {
                                                                    form.setValue("profileId", profile.id.toString());
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        profile.id.toString() === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {profile.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="consulta">Consulta</SelectItem>
                                                <SelectItem value="retorno">Retorno</SelectItem>
                                                <SelectItem value="exames">Exames</SelectItem>
                                                <SelectItem value="urgencia">Urgência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Horário</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-8" placeholder="00:00" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Data</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione uma data</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                                                <Input
                                                    className="pl-9"
                                                    placeholder="0,00"
                                                    {...field}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value) {
                                                            value = (parseInt(value) / 100).toFixed(2).replace(".", ",");
                                                            value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                                        }
                                                        field.onChange(value);
                                                    }}
                                                />
                                            </div>
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
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalhes adicionais sobre a consulta..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">{isEditing ? "Salvar Alterações" : "Agendar"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
