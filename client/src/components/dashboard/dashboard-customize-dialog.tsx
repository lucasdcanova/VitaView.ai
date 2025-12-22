
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Calendar,
    Activity,
    Users,
    Lightbulb,
    LayoutDashboard,
    AlertCircle,
    FileText
} from "lucide-react";

interface DashboardCustomizeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hiddenWidgets: string[];
    onToggleWidget: (widgetId: string, isHidden: boolean) => void;
}

const WIDGETS = [
    {
        id: "quick-actions",
        label: "Ações Rápidas",
        description: "Botões de acesso rápido para tarefas comuns",
        icon: <LayoutDashboard className="h-5 w-5 text-gray-500" />
    },
    {
        id: "vitals",
        label: "Resumo de Saúde (Vitals)",
        description: "Métricas vitais do paciente selecionado",
        icon: <Activity className="h-5 w-5 text-gray-500" />
    },
    {
        id: "stats-row",
        label: "Estatísticas Gerais",
        description: "Total de pacientes, check-ups pendentes e exames",
        icon: <Users className="h-5 w-5 text-gray-500" />
    },
    {
        id: "getting-started",
        label: "Guia Inicial",
        description: "Passo a passo para começar a usar a plataforma",
        icon: <Lightbulb className="h-5 w-5 text-gray-500" />
    },
    {
        id: "agenda",
        label: "Agenda do Dia",
        description: "Próximas consultas e compromissos",
        icon: <Calendar className="h-5 w-5 text-gray-500" />
    },
    {
        id: "recent-exams",
        label: "Últimos Exames",
        description: "Lista dos exames enviados recentemente",
        icon: <FileText className="h-5 w-5 text-gray-500" />
    },
    {
        id: "attention",
        label: "Atenção Necessária",
        description: "Pacientes que precisam de acompanhamento",
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />
    }
];

export function DashboardCustomizeDialog({
    open,
    onOpenChange,
    hiddenWidgets,
    onToggleWidget
}: DashboardCustomizeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Personalizar Dashboard</DialogTitle>
                    <DialogDescription>
                        Escolha quais widgets você deseja ver no seu painel.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    {WIDGETS.map((widget) => {
                        const isVisible = !hiddenWidgets.includes(widget.id);
                        return (
                            <div key={widget.id} className="flex items-center justify-between space-x-4">
                                <div className="flex items-start space-x-4">
                                    <div className="mt-1 bg-gray-100 p-2 rounded-lg">
                                        {widget.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor={`widget-${widget.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {widget.label}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {widget.description}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id={`widget-${widget.id}`}
                                    checked={isVisible}
                                    onCheckedChange={(checked) => onToggleWidget(widget.id, !checked)}
                                />
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
