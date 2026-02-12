import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Clock, Check, ChevronsUpDown, Lock, UserPlus, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
    profileId: z.string().optional(),
    patientName: z.string().optional(),
    type: z.enum(["consulta", "retorno", "exames", "urgencia", "procedimento", "blocked"], {
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
    isRange: z.boolean().optional(),
    endDate: z.date().optional(),
    isAllDay: z.boolean().optional(),
    isTelemedicine: z.boolean().optional(),
    meetingLink: z.string().optional(),
}).refine((data) => {
    if (data.type !== 'blocked' && !data.profileId) {
        return false;
    }
    return true;
}, {
    message: "Selecione um paciente.",
    path: ["profileId"],
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
            type: "consulta",
            isRange: false,
            isAllDay: false,
            isTelemedicine: false,
        },
    });

    const [mode, setMode] = useState<"appointment" | "blocked">("appointment");

    // Watch type to sync with mode if initialData loaded
    useEffect(() => {
        const type = form.getValues("type");
        if (type === "blocked" && mode !== "blocked") {
            setMode("blocked");
        } else if (type !== "blocked" && mode === "blocked") {
            // Keep it consistent?
            // Actually initialData logic below handles this
        }
    }, []);

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
                    profileId: initialData.userId ? initialData.userId.toString() : (initialData.profileId ? initialData.profileId.toString() : undefined),
                    type: initialData.type,
                    date: new Date(initialData.date + 'T12:00:00'),
                    time: initialData.time,
                    notes: initialData.notes || "",
                    price: priceFormatted,
                    isAllDay: initialData.isAllDay || false,
                    isRange: false, // Assuming range edit isn't fully supported yet or we don't have range data in single appointment
                    isTelemedicine: initialData.isTelemedicine || false,
                    meetingLink: initialData.meetingLink || "",
                });

                if (initialData.type === 'blocked') {
                    setMode("blocked");
                } else {
                    setMode("appointment");
                }
            } else {
                form.reset({
                    type: "consulta",
                    time: "09:00",
                    notes: "",
                    price: "",
                    isRange: false,
                    isAllDay: false
                });
                setMode("appointment");
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
        if (values.price && mode === 'appointment') {
            // Convert "1.234,56" to 123456 (cents)
            const cleanPrice = values.price.replace(/\./g, "").replace(",", "");
            priceAmount = parseInt(cleanPrice);
        }

        // Force blocked type if mode is blocked
        if (mode === 'blocked') {
            values.type = 'blocked';
            values.profileId = undefined;
        }

        // Ensure time is 00:00 if all day
        if (values.isAllDay) {
            values.time = "00:00";
        }

        // Format date as YYYY-MM-DD string for the backend
        const formattedDate = format(values.date, 'yyyy-MM-dd');

        const submissionData = {
            ...values,
            date: formattedDate, // Override the Date object with formatted string
            profileId: values.profileId ? parseInt(values.profileId) : undefined,
            patientName: mode === 'blocked' ? "Horário Bloqueado" : (selectedProfile ? selectedProfile.name : "Paciente"),
            price: priceAmount,
        };

        console.log("Submitting appointment:", submissionData);
        if (onSuccess) {
            // Check if it's a range block
            if (values.isRange && values.endDate && values.type === 'blocked') {
                const startDate = values.date;
                const endDate = values.endDate;
                const appointments = [];

                // Clone date to iterate
                let currentDate = new Date(startDate);

                while (currentDate <= endDate) {
                    appointments.push({
                        ...submissionData,
                        date: format(currentDate, 'yyyy-MM-dd'),
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                onSuccess(appointments);
            } else {
                onSuccess(submissionData);
            }
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
                    <DialogTitle>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Altere os dados do agendamento." : "Agende uma consulta ou bloqueie um horário."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v) => {
                    setMode(v as "appointment" | "blocked");
                    if (v === "blocked") {
                        form.setValue("type", "blocked");
                        form.clearErrors("profileId");
                    } else {
                        form.setValue("type", "consulta");
                    }
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-gray-100 rounded-lg">
                        <TabsTrigger
                            value="appointment"
                            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm rounded-md transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Agendamento
                        </TabsTrigger>
                        <TabsTrigger
                            value="blocked"
                            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md transition-all"
                        >
                            <Lock className="w-4 h-4" />
                            Bloqueio
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {mode === 'appointment' && (
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
                        )}

                        {mode === 'appointment' ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="consulta">Consulta</SelectItem>
                                                    <SelectItem value="retorno">Retorno</SelectItem>
                                                    <SelectItem value="exames">Exames</SelectItem>
                                                    <SelectItem value="procedimento">Procedimento</SelectItem>
                                                    <SelectItem value="urgencia">Urgência</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>

                        ) : (
                            <div className="col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <FormField
                                        control={form.control}
                                        name="isRange"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        id="range-mode"
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="range-mode" className="font-medium cursor-pointer">
                                                    Bloquear Período
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="w-px h-6 bg-gray-200 mx-4 hidden md:block"></div>

                                    <FormField
                                        control={form.control}
                                        name="isAllDay"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={(checked) => {
                                                            field.onChange(checked);
                                                            if (checked) {
                                                                form.setValue("time", "00:00");
                                                            } else {
                                                                form.setValue("time", "09:00");
                                                            }
                                                        }}
                                                        id="all-day-mode"
                                                    />
                                                </FormControl>
                                                <FormLabel htmlFor="all-day-mode" className="font-medium cursor-pointer">
                                                    Dia Inteiro
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {(!form.watch('isAllDay') || mode === 'appointment') && (
                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>Horário</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="00:00" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{form.watch("isRange") ? "Data Inicial" : "Data"}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal border-gray-200 hover:bg-gray-50/50 hover:text-gray-900",
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

                            {mode === 'appointment' && (
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
                            )}

                            {mode === 'blocked' && form.watch("isRange") && (
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Data Final</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal border-gray-200 hover:bg-gray-50/50 hover:text-gray-900",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: ptBR })
                                                            ) : (
                                                                <span>Data final</span>
                                                            )}
                                                            <CalendarRange className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < (form.getValues("date") || new Date())
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={mode === 'blocked' ? "Motivo do bloqueio..." : "Detalhes adicionais sobre a consulta..."}
                                            className="resize-none min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button
                                type="submit"
                                className={cn(
                                    "w-full md:w-auto",
                                    mode === 'blocked'
                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                        : "bg-[#212121] hover:bg-[#424242] text-white"
                                )}
                            >
                                {isEditing ? "Salvar Alterações" : (mode === 'blocked' ? "Confirmar Bloqueio" : "Agendar Consulta")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
