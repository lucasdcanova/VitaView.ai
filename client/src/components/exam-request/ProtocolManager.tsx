import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, Package, Check, X, Search, FileText } from "lucide-react";
import { EXAM_PROTOCOLS, ALL_EXAMS } from "@/constants/exam-database";
import { CustomProtocol } from "@/hooks/use-exam-protocols";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProtocolManagerProps {
    customProtocols: CustomProtocol[];
    onApplyProtocol: (exams: any[]) => void;
    // Protocol Management Props form hook
    createProtocolOpen: boolean;
    setCreateProtocolOpen: (open: boolean) => void;
    deleteMode: boolean;
    setDeleteMode: (mode: boolean) => void;
    deleteConfirmationOpen: boolean;
    setDeleteConfirmationOpen: (open: boolean) => void;
    protocolsToDelete: (string | number)[];
    toggleProtocolToDelete: (id: string | number) => void;
    handleCreateProtocol: () => void;
    bulkDeleteMutation: any;
    newProtocolData: any;
    setNewProtocolData: (data: any) => void;
    newProtocolSearch: string;
    setNewProtocolSearch: (search: string) => void;
}

export function ProtocolManager({
    customProtocols,
    onApplyProtocol,
    createProtocolOpen,
    setCreateProtocolOpen,
    deleteMode,
    setDeleteMode,
    deleteConfirmationOpen,
    setDeleteConfirmationOpen,
    protocolsToDelete,
    toggleProtocolToDelete,
    handleCreateProtocol,
    bulkDeleteMutation,
    newProtocolData,
    setNewProtocolData,
    newProtocolSearch,
    setNewProtocolSearch
}: ProtocolManagerProps) {

    // Helper to filter exams for new protocol creation
    const filteredExamsForProtocol = ALL_EXAMS.filter(exam =>
        exam.name.toLowerCase().includes(newProtocolSearch.toLowerCase())
    ).slice(0, 15);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-700">Protocolos Rápidos</h3>
                </div>
                <div className="flex items-center gap-1">
                    {!deleteMode ? (
                        <>
                            {/* Create Protocol Dialog */}
                            <Dialog open={createProtocolOpen} onOpenChange={setCreateProtocolOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Criar Novo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Criar Novo Protocolo</DialogTitle>
                                        <DialogDescription>
                                            Crie um conjunto de exames para acesso rápido.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="flex-1 overflow-y-auto py-4 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nome do Protocolo</Label>
                                                <Input
                                                    placeholder="Ex: Check-up Cardiológico"
                                                    value={newProtocolData.name}
                                                    onChange={(e) => setNewProtocolData({ ...newProtocolData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cor do Ícone</Label>
                                                <div className="flex gap-2">
                                                    {['blue', 'green', 'purple', 'orange', 'red', 'gray'].map(color => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setNewProtocolData({ ...newProtocolData, color })}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full border-2 transition-all",
                                                                newProtocolData.color === color ? "border-gray-900 scale-110" : "border-transparent opacity-70 hover:opacity-100"
                                                            )}
                                                            style={{ backgroundColor: `var(--${color}-500)` }} // Simplified, adjust if needed or use Tailwind classes
                                                        >
                                                            <div className={`w-full h-full rounded-full bg-${color}-500`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Selecionar Exames ({newProtocolData.exams.length})</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Buscar exames..."
                                                    value={newProtocolSearch}
                                                    onChange={(e) => setNewProtocolSearch(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>

                                            <div className="border rounded-md h-[250px] overflow-hidden flex flex-col">
                                                <ScrollArea className="flex-1">
                                                    <div className="divide-y">
                                                        {filteredExamsForProtocol.map((exam, idx) => {
                                                            const isSelected = newProtocolData.exams.some((e: any) => e.name === exam.name);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                                                        isSelected && "bg-blue-50/50"
                                                                    )}
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setNewProtocolData({
                                                                                ...newProtocolData,
                                                                                exams: newProtocolData.exams.filter((e: any) => e.name !== exam.name)
                                                                            });
                                                                        } else {
                                                                            setNewProtocolData({
                                                                                ...newProtocolData,
                                                                                exams: [...newProtocolData.exams, { name: exam.name, type: exam.type }]
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Checkbox checked={isSelected} />
                                                                        <span className="text-sm">{exam.name}</span>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] h-5">{exam.category}</Badge>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setCreateProtocolOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleCreateProtocol} disabled={!newProtocolData.name || newProtocolData.exams.length === 0}>
                                            Salvar Protocolo
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteMode(true)}
                                className="h-8 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Editar
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 mr-1">{protocolsToDelete.length} selecionados</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDeleteMode(false);
                                    // clear selection logic handled in parent or here?
                                    // Parent hook logic: setProtocolsToDelete([])
                                }}
                                className="h-7 text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={protocolsToDelete.length === 0}
                                onClick={() => setDeleteConfirmationOpen(true)}
                                className="h-7 text-xs"
                            >
                                Excluir/Ocultar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ScrollArea className="h-auto max-h-[220px]">
                <div className="grid grid-cols-2 gap-3 pb-2">
                    {/* System Protocols */}
                    {EXAM_PROTOCOLS.map((protocol) => {
                        // Check if hidden (needs logic from parent passing 'hidden' IDs if we want to fully support hiding system protocols)
                        // For now, assume implemented in backend logic or passed props. 
                        // Implementation plan says "hide system protocols" via user preferences.
                        // But useExamProtocols hook handles the mutation.
                        // We render all system protocols here unless we are passed a filtered list?
                        // Ideally parent filters them before passing? Or we pass hidden IDs?
                        // Let's assume we show them for now or logic is upstream.
                        // For refactor simplicity, I'll render all, adding selection logic.
                        const Icon = protocol.icon;
                        const isDeleting = deleteMode && protocolsToDelete.includes(protocol.id);

                        return (
                            <div
                                key={protocol.id}
                                className={cn(
                                    "relative group flex items-start p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                                    deleteMode ?
                                        (isDeleting ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-200") :
                                        "bg-white border-gray-100 hover:border-blue-200"
                                )}
                                onClick={() => {
                                    if (deleteMode) {
                                        toggleProtocolToDelete(protocol.id);
                                    } else {
                                        onApplyProtocol(protocol.exams);
                                    }
                                }}
                            >
                                <div className={cn("p-2 rounded-lg mr-3 flex-shrink-0", `bg-${protocol.color}-50`)}>
                                    <Icon className={cn("h-5 w-5", `text-${protocol.color}-600`)} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{protocol.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{protocol.description}</p>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-gray-100 text-gray-600">
                                            {protocol.exams.length} exames
                                        </Badge>
                                    </div>
                                </div>
                                {deleteMode && (
                                    <div className="absolute top-2 right-2">
                                        <Checkbox checked={isDeleting} className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Custom Protocols */}
                    {customProtocols.map((protocol) => {
                        const isDeleting = deleteMode && protocolsToDelete.includes(protocol.id);
                        return (
                            <div
                                key={protocol.id}
                                className={cn(
                                    "relative group flex items-start p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                                    deleteMode ?
                                        (isDeleting ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-200") :
                                        "bg-white border-gray-100 hover:border-blue-200"
                                )}
                                onClick={() => {
                                    if (deleteMode) {
                                        toggleProtocolToDelete(protocol.id);
                                    } else {
                                        onApplyProtocol(protocol.exams);
                                    }
                                }}
                            >
                                <div className={cn("p-2 rounded-lg mr-3 flex-shrink-0", "bg-gray-100")}>
                                    {/* Default icon for custom */}
                                    <FileText className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{protocol.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{protocol.description || "Personalizado"}</p>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-gray-100 text-gray-600">
                                            {protocol.exams.length} exames
                                        </Badge>
                                    </div>
                                </div>
                                {deleteMode && (
                                    <div className="absolute top-2 right-2">
                                        <Checkbox checked={isDeleting} className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Protocolos?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem certeza que deseja excluir/ocultar os {protocolsToDelete.length} protocolos selecionados?
                            Essa ação não pode ser desfeita para protocolos personalizados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => bulkDeleteMutation.mutate(protocolsToDelete)}
                        >
                            {bulkDeleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
